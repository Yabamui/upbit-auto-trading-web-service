<script lang="ts">
	import * as echarts from 'echarts';
	import {
		onDestroy,
		tick
	} from 'svelte';
	import { colorThemeStore } from '$lib/stores/ThemeStore';
	import {
		Button,
		ButtonGroup,
		Dropdown,
		DropdownItem,
		Range
	} from 'flowbite-svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
	import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		type ECHartLineConfidenceBandSeriesData,
		EChartsOptionUtils
	} from '$lib/common/utils/EChartsOptionUtils';
	import Decimal from 'decimal.js';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';
	import { ChevronDownIcon } from 'lucide-svelte';

	let {
		prophetAnalyticsRequestId
	}: {
		prophetAnalyticsRequestId: number | undefined,
	} = $props();

	let _eChartCount = $derived.by(getEChartCount);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _priceType: string = $state(ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key);
	let _priceTypeDropdownOpenYn = $state(false);
	let _resultAndItemByPriceTypeRecord: Record<string, ProphetAnalyticsResultAndItemData> = $state({});
	let _resultAndItemData: ProphetAnalyticsResultAndItemData | null = $state(null);

	let _eChartIndicatorsDropdownOpenYn = $state(false);
	let _eChartIndicator = $state({
		Forecast: {
			chartName: 'Forecast',
			openYn: false
		},
		ForecastArea: {
			chartName: 'Forecast Area',
			openYn: false
		},
		Trend: {
			chartName: 'Trend',
			openYn: false
		},
		Yearly: {
			chartName: 'Yearly',
			openYn: false
		},
		Monthly: {
			chartName: 'Monthly',
			openYn: false
		},
		Weekly: {
			chartName: 'Weekly',
			openYn: false
		},
		Daily: {
			chartName: 'Daily',
			openYn: false
		},
		Additive: {
			chartName: 'Additive',
			openYn: false
		},
		Multiplicative: {
			chartName: 'Multiplicative',
			openYn: false
		},
		Changepoint: {
			chartName: 'Changepoint',
			openYn: false
		},
	});
	// let _addTrendYn = $state(false);
	// let _addForecastYn = $state(false);
	// let _addForecastAreaYn = $state(false);
	// let _addYearlyYn = $state(false);
	// let _addMonthlyYn = $state(false);
	// let _addWeeklyYn = $state(false);
	// let _addDailyYn = $state(false);
	// let _addAdditiveYn = $state(false);
	// let _addMultiplicativeYn = $state(false);

	onDestroy(() => {
		_resultAndItemData = null;
		if (_eCharts && !_eCharts.isDisposed()) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	});

	$effect(() => {
		if (prophetAnalyticsRequestId) {
			addProphetAnalyticsResultAndItemAndMount();
		} else {
			removeProphetAnalyticsResultAndItemAndMount();
		}
	});

	$effect(() => {
	});

	$effect(() => {
		if (_textColor) {
			reflectColorTheme(_textColor);
		}
	});

	$effect(() => {
		resizeDataZoom();
	});

	function getEChartCount() {
		let eChartCount = 1;

		return eChartCount;
	}

	async function getProphetAnalyticsResultAndItem(prophetAnalyticsRequestId: number | undefined) {

		_resultAndItemData = null;
		_resultAndItemByPriceTypeRecord = {};

		if (!prophetAnalyticsRequestId) {
			return;
		}

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.getProphetAnalyticsResultByRequestId(
			prophetAnalyticsRequestId
		);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const resultAndItemList = responseObject.data as ProphetAnalyticsResultAndItemData[];

		_resultAndItemByPriceTypeRecord = resultAndItemList.reduce((acc, item) => {
			acc[item.result.priceType] = item;

			return acc;
		}, {} as Record<string, ProphetAnalyticsResultAndItemData>);

		_resultAndItemData = _resultAndItemByPriceTypeRecord[_priceType] || null;
	}

	async function mount() {

		await tick();

		if (_eCharts) {
			_eCharts.dispose();
			_eCharts = undefined;
		}

		_eCharts = echarts.init(_eChartsElement, '', {
			renderer: 'canvas',
			width: 'auto',
			height: 'auto'
		});

		if (!_eCharts.isDisposed()) {
			window.addEventListener('resize', () => {
				_eCharts?.resize();
			});
		}

		if (!_resultAndItemData) {
			return;
		}

		_eCharts.showLoading();

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _resultAndItemData.result.candleUnit) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const seriesData = await getSeriesOptionList();

		if (!seriesData) {
			return;
		}

		const dateTimeList: string[] = await getDateTimeList(dateTimeFormat);

		const gridOption = EChartsOptionUtils.getGridOption(_eChartCount);
		const xAxis = EChartsOptionUtils.getXAxisOption(dateTimeList, _eChartCount);
		const yAxis = EChartsOptionUtils.getYAxisOption(_eChartCount);

		const legend = EChartsOptionUtils.getLegentOption(seriesData.itemNameList);

		const eChartsOption = getEChartsOption(
			legend,
			gridOption,
			xAxis,
			yAxis,
			seriesData.seriesList
		);

		_eCharts.setOption(eChartsOption);

		reflectColorTheme(_textColor);

		addChangepointMarkLine();

		_eCharts.hideLoading();
	}

	function addProphetAnalyticsResultAndItemAndMount() {
		_eChartIndicator.Forecast.openYn = true;

		getProphetAnalyticsResultAndItem(prophetAnalyticsRequestId)
			.then(() => mount());
	}

	function removeProphetAnalyticsResultAndItemAndMount() {
		_resultAndItemData = null;
		_eChartIndicator = {
			Forecast: {
				chartName: 'Forecast',
				openYn: false
			},
			ForecastArea: {
				chartName: 'Forecast Area',
				openYn: false
			},
			Trend: {
				chartName: 'Trend',
				openYn: false
			},
			Yearly: {
				chartName: 'Yearly',
				openYn: false
			},
			Monthly: {
				chartName: 'Monthly',
				openYn: false
			},
			Weekly: {
				chartName: 'Weekly',
				openYn: false
			},
			Daily: {
				chartName: 'Daily',
				openYn: false
			},
			Additive: {
				chartName: 'Additive',
				openYn: false
			},
			Multiplicative: {
				chartName: 'Multiplicative',
				openYn: false
			},
			Changepoint: {
				chartName: 'Changepoint',
				openYn: false
			},
		};
	}

	async function getDateTimeList(dateTimeFormat: string): Promise<string[]> {
		if (!_resultAndItemData) {
			return [];
		}

		return _resultAndItemData.resultItemList.map((item) => {
			return CurrentDateUtils.convertFormat(item.ds, dateTimeFormat);
		});
	}

	async function getSeriesOptionList() {
		if (!_resultAndItemData) {
			return undefined;
		}

		const tradeItemName = 'Price';
		let decimalDepth = 0;

		const tradeSeriesOption = EChartsOptionUtils.getLineSeriesOption(
			tradeItemName,
			_resultAndItemData.resultItemList.map((item) => {
				if (item.y) {
					const dp = new Decimal(item.y).dp();

					if (dp > decimalDepth) {
						decimalDepth = dp;
					}
				}

				return item.y;
			}),
			0, 0,
			'red'
		);

		const seriesData = {
			itemNameList: [
				tradeItemName
			],
			seriesList: [
				tradeSeriesOption
			]
		};

		if (!_resultAndItemData) {
			return seriesData;
		}

		if (_eChartIndicator.Trend.openYn) {

			const trendSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Trend.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.trend, decimalDepth);
				}),
				0,
				0,
				'lightgreen'
			);

			seriesData.itemNameList.push(_eChartIndicator.Trend.chartName);
			seriesData.seriesList.push(trendSeriesOption);
		}

		if (_eChartIndicator.Forecast.openYn) {

			const forecastSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Forecast.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.yhat, decimalDepth);
				}),
				0,
				0,
				'black'
			);

			seriesData.itemNameList.push(_eChartIndicator.Forecast.chartName);
			seriesData.seriesList.push(forecastSeriesOption);
		}

		if (_eChartIndicator.ForecastArea.openYn) {

			const lineConfidenceBandSeriesData: ECHartLineConfidenceBandSeriesData = {
				highName: 'Forecast Upper',
				lowName: 'Forecast Lower',
				highColor: '#ccc',
				itemList: _resultAndItemData.resultItemList.map((item) => {
					return {
						middle: CurrentNumberUtils.ceilPrice(item.yhat, decimalDepth),
						low: CurrentNumberUtils.ceilPrice(item.yhatLower, decimalDepth),
						high: CurrentNumberUtils.ceilPrice(item.yhatUpper, decimalDepth)
					};
				})
			};

			seriesData.itemNameList.push(lineConfidenceBandSeriesData.highName);
			seriesData.itemNameList.push(lineConfidenceBandSeriesData.lowName);

			const forecastSeriesOptionList = EChartsOptionUtils.getLineConfidenceBandSeriesOption(
				lineConfidenceBandSeriesData
			);

			seriesData.seriesList.push(...forecastSeriesOptionList);
		}

		if (_eChartIndicator.Yearly.openYn) {

			const yearlySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Yearly.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.yearly || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Yearly.chartName);
			seriesData.seriesList.push(yearlySeriesOption);
		}

		if (_eChartIndicator.Monthly.openYn) {
			const monthlySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Monthly.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.monthly || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Monthly.chartName);
			seriesData.seriesList.push(monthlySeriesOption);
		}

		if (_eChartIndicator.Weekly.openYn) {

			const weeklySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Weekly.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.weekly || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Weekly.chartName);
			seriesData.seriesList.push(weeklySeriesOption);
		}

		if (_eChartIndicator.Daily.openYn) {

			const dailySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Daily.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.daily || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Daily.chartName);
			seriesData.seriesList.push(dailySeriesOption);
		}

		if (_eChartIndicator.Additive.openYn) {

			const additiveSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Additive.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.additiveTerms || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Additive.chartName);
			seriesData.seriesList.push(additiveSeriesOption);
		}

		if (_eChartIndicator.Multiplicative.openYn) {

			const multiplicativeSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				_eChartIndicator.Multiplicative.chartName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.multiplicativeTerms || 0, decimalDepth);
				}),
				0,
				0
			);

			seriesData.itemNameList.push(_eChartIndicator.Multiplicative.chartName);
			seriesData.seriesList.push(multiplicativeSeriesOption);
		}

		return seriesData;
	}

	function getEChartsOption(
		legend: echarts.LegendComponentOption,
		gridOption: echarts.GridComponentOption[],
		xAxis: echarts.XAXisComponentOption[],
		yAxis: echarts.YAXisComponentOption[],
		series: echarts.SeriesOption[]
	): echarts.EChartsOption {
		return {
			legend: legend,
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				borderWidth: 1,
				borderColor: '#ccc',
				padding: 10,
				textStyle: {
					color: '#000',
					fontSize: 12
				}
			},
			axisPointer: {
				link: [
					{
						xAxisIndex: 'all'
					}
				],
				label: {
					backgroundColor: '#777'
				}
			},
			grid: gridOption,
			xAxis: xAxis,
			yAxis: yAxis,
			dataZoom: [
				{
					type: 'inside',
					xAxisIndex: xAxis.map((_, index) => index),
					start: $state.snapshot(_dataZoomStart),
					end: 100,
					zoomLock: true
				},
				{
					show: false,
					xAxisIndex: xAxis.map((_, index) => index),
					type: 'slider',
					top: '0%',
					start: $state.snapshot(_dataZoomStart),
					end: 100
				}
			],
			series: series
		};
	}

	function addChangepointMarkLine() {
		if (!_eCharts || !_eCharts.getOption() || !_resultAndItemData ||
			!_resultAndItemData.result.changepointDateTimeList) {
			console.log('addChangepointMarkLine: no data');
			return;
		}

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _resultAndItemData.result.candleUnit) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const markLineOption = EChartsOptionUtils.getXAxisMarkLineOption(
			_resultAndItemData.result.changepointDateTimeList.map((dateTime) => {
				return CurrentDateUtils.convertFormat(dateTime, dateTimeFormat);
			})
		);

		_eCharts.setOption({
			series: [
				{ markLine: _eChartIndicator.Changepoint.openYn ? markLineOption : undefined }
			]
		});
	}

	function reflectColorTheme(textColor: string) {
		if (!textColor) {
			return;
		}

		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			legend: {
				textStyle: {
					color: textColor
				}
			},
			xAxis: [
				{
					axisLabel: {
						color: textColor
					}
				},
				{
					axisLabel: {
						color: textColor
					}
				}
			],
			yAxis: [
				{
					nameTextStyle: {
						color: textColor
					},
					axisLabel: {
						color: textColor
					}
				},
				{
					axisLabel: {
						color: textColor
					}
				}
			]
		});
	}

	function resizeDataZoom() {
		if (!_eCharts) {
			return;
		}

		_eCharts.setOption({
			dataZoom: [
				{
					start: _dataZoomStart
				},
				{
					start: _dataZoomStart
				}
			]
		});
	}

	function onclickPriceType(priceType: string) {
		_priceType = priceType;
		_resultAndItemData = _resultAndItemByPriceTypeRecord[priceType] || null;
		_priceTypeDropdownOpenYn = false;

		mount();
	}

	function onclickIndicator(chartName: string) {
		switch (chartName) {
			case 'Forecast':
				onclickForecastYn();
				break;
			case 'Forecast Area':
				onclickForecastAreaYn();
				break;
			case 'Trend':
				onclickTrendYn();
				break;
			case 'Yearly':
				onclickYearlyYn();
				break;
			case 'Monthly':
				onclickMonthlyYn();
				break;
			case 'Weekly':
				onclickWeeklyYn();
				break;
			case 'Daily':
				onclickDailyYn();
				break;
			case 'Additive':
				onclickAdditiveYn();
				break;
			case 'Multiplicative':
				onclickMultiplicativeYn();
				break;
			case 'Changepoint':
				onclickChangepointYn();
				break
			default:
				break;
		}
	}

	function onclickTrendYn() {
		_eChartIndicator.Trend.openYn = !_eChartIndicator.Trend.openYn;
		mount();
	}

	function onclickForecastYn() {
		_eChartIndicator.Forecast.openYn = !_eChartIndicator.Forecast.openYn;
		mount();
	}

	function onclickForecastAreaYn() {
		_eChartIndicator.ForecastArea.openYn = !_eChartIndicator.ForecastArea.openYn;
		mount();
	}

	function onclickYearlyYn() {
		_eChartIndicator.Yearly.openYn = !_eChartIndicator.Yearly.openYn;
		mount();
	}

	function onclickMonthlyYn() {
		_eChartIndicator.Monthly.openYn = !_eChartIndicator.Monthly.openYn;
		mount();
	}

	function onclickWeeklyYn() {
		_eChartIndicator.Weekly.openYn = !_eChartIndicator.Weekly.openYn;
		mount();
	}

	function onclickDailyYn() {
		_eChartIndicator.Daily.openYn = !_eChartIndicator.Daily.openYn;
		mount();
	}

	function onclickAdditiveYn() {
		_eChartIndicator.Additive.openYn = !_eChartIndicator.Additive.openYn;
		mount();
	}

	function onclickMultiplicativeYn() {
		_eChartIndicator.Multiplicative.openYn = !_eChartIndicator.Multiplicative.openYn;
		mount();
	}

	function onclickChangepointYn() {
		_eChartIndicator.Changepoint.openYn = !_eChartIndicator.Changepoint.openYn;

		addChangepointMarkLine();
	}
</script>

<div class="flex flex-col w-full h-full">
	<div class="flex w-full items-center justify-between">
		<ButtonGroup class="*:!ring-0 gap-2">
			<Button
				color="none"
				class="p-0 focus:ring-0">
				<div class="text-[12px] leading-none">
					{_priceType}
				</div>
				<ChevronDownIcon class="w-3 h-3 ml-1"
												 strokeWidth={3} />
			</Button>
			<Dropdown
				placement="bottom-start"
				bind:open={_priceTypeDropdownOpenYn}>
				<DropdownItem
					onclick={() => onclickPriceType(ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key)}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						{ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key}
					</div>
				</DropdownItem>
				<DropdownItem
					onclick={() => onclickPriceType(ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE_RATE.key)}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						{ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE_RATE.key}
					</div>
				</DropdownItem>
			</Dropdown>
			<Button
				color="none"
				class="p-0 focus:ring-0">
				<div class="text-[12px] leading-none">
					지표
				</div>
				<ChevronDownIcon class="w-3 h-3 ml-1"
												 strokeWidth={3} />
			</Button>
			<Dropdown
				placement="bottom-start"
				bind:open={_eChartIndicatorsDropdownOpenYn}>
				{#each Object.values(_eChartIndicator) as item}
					<DropdownItem
						class={item.openYn ? 'border border-green-500' : ''}
						onclick={() => onclickIndicator(item.chartName)}>
						<div class="w-full text-[12px] items-center text-start leading-none">
							{item.chartName}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>
		</ButtonGroup>
		<div class="border pb-2 shadow-sm rounded-md">
			<Range
				size="sm"
				min="0"
				max="99"
				step="1"
				bind:value={_dataZoomStart} />
		</div>
	</div>
	<div class="flex w-full h-full"
			 bind:this={_eChartsElement}>
	</div>
</div>