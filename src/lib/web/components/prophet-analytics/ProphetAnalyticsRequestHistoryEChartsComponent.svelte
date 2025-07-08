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
		Card,
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

	let {
		prophetAnalyticsRequestId,
		chartClearYn = $bindable()
	}: {
		prophetAnalyticsRequestId: number | undefined,
		chartClearYn: boolean
	} = $props();

	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _resultAndItemData: ProphetAnalyticsResultAndItemData | null = $state(null);
	let _addTrendYn = $state(false);
	let _addForecastYn = $state(false);
	let _addForecastAreaYn = $state(false);
	let _addYearlyYn = $state(false);
	let _addMonthlyYn = $state(false);
	let _addWeeklyYn = $state(false);
	let _addDailyYn = $state(false);
	let _addAdditiveYn = $state(false);
	let _addMultiplicativeYn = $state(false);

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

	async function getProphetAnalyticsResultAndItem(prophetAnalyticsRequestId: number | undefined) {

		_resultAndItemData = null;

		if (!prophetAnalyticsRequestId) {
			return;
		}

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.getProphetAnalyticsResultByRequestId(
			prophetAnalyticsRequestId
		);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		_resultAndItemData = responseObject.data as ProphetAnalyticsResultAndItemData;
	}

	async function mount() {

		if (!_resultAndItemData) {
			return;
		}

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

		if (chartClearYn) {
			_eCharts.clear();
			chartClearYn = false;
		}

		_eCharts.showLoading();

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _resultAndItemData.result.candleType) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const seriesData = await getSeriesOptionList();

		if (!seriesData) {
			return;
		}

		const marketCandleDateTime: string[] = await getDateTimeList(dateTimeFormat);

		const dataListInList = [marketCandleDateTime];
		const gridOption = EChartsOptionUtils.getGridOption(dataListInList.length);
		const xAxis = EChartsOptionUtils.getXAxisOption(dataListInList);
		const yAxis = EChartsOptionUtils.getYAxisOption(dataListInList);

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

		addMarkLine();

		_eCharts.hideLoading();
	}

	function addProphetAnalyticsResultAndItemAndMount() {
		_addForecastYn = true;

		getProphetAnalyticsResultAndItem(prophetAnalyticsRequestId)
			.then(() => mount());
	}

	function removeProphetAnalyticsResultAndItemAndMount() {
		_resultAndItemData = null;
		_addForecastYn = false;
		_addTrendYn = false;
		_addForecastAreaYn = false;
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

		if (_addTrendYn) {
			const itemName = 'Trend';
			const trendSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.trend, decimalDepth);
				}),
				0,
				0,
				'lightgreen'
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(trendSeriesOption);
		}

		if (_addForecastYn) {
			const itemName = 'Forecast';

			const forecastSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.yhat, decimalDepth);
				}),
				0,
				0,
				'black'
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(forecastSeriesOption);
		}

		if (_addForecastAreaYn) {
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

		if (_addYearlyYn) {
			const itemName = 'Yearly';
			const yearlySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.yearly || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(yearlySeriesOption);
		}

		if (_addMonthlyYn) {
			const itemName = 'Monthly';
			const monthlySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.monthly || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(monthlySeriesOption);
		}

		if (_addWeeklyYn) {
			const itemName = 'Weekly';
			const weeklySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.weekly || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(weeklySeriesOption);
		}

		if (_addDailyYn) {
			const itemName = 'Daily';
			const dailySeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.daily || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(dailySeriesOption);
		}

		if (_addAdditiveYn) {
			const itemName = 'Additive';
			const additiveSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.additiveTerms || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(additiveSeriesOption);
		}

		if (_addMultiplicativeYn) {
			const itemName = 'Multiplicative';
			const multiplicativeSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => {
					return CurrentNumberUtils.ceilPrice(item.multiplicativeTerms || 0, decimalDepth);
				}),
				0,
				0,
			);

			seriesData.itemNameList.push(itemName);
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

	function addMarkLine() {
		if (!_eCharts || !_eCharts.getOption() || !_resultAndItemData ||
			!_resultAndItemData.result.changepointDateTimeList) {
			return;
		}

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _resultAndItemData.result.candleType) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const markLineOption = EChartsOptionUtils.getXAxisMarkLineOption(
			_resultAndItemData.result.changepointDateTimeList.map((dateTime) => {
				return CurrentDateUtils.convertFormat(dateTime, dateTimeFormat);
			})
		);

		_eCharts.setOption({
			series: [
				{ markLine: _showMarkLine ? markLineOption : undefined }
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

	function onclickAddTrend() {
		_addTrendYn = !_addTrendYn;
		mount();
	}

	function onclickAddForecast() {
		_addForecastYn = !_addForecastYn;
		mount();
	}

	function onclickAddForecastArea() {
		_addForecastAreaYn = !_addForecastAreaYn;
		mount();
	}

	function onclickAddYearly() {
		_addYearlyYn = !_addYearlyYn;
		mount();
	}

	function onclickAddMonthly() {
		_addMonthlyYn = !_addMonthlyYn;
		mount();
	}

	function onclickAddWeekly() {
		_addWeeklyYn = !_addWeeklyYn;
		mount();
	}

	function onclickAddDaily() {
		_addDailyYn = !_addDailyYn;
		mount();
	}

	function onclickAddAdditive() {
		_addAdditiveYn = !_addAdditiveYn;
		mount();
	}

	function onclickAddMultiplicative() {
		_addMultiplicativeYn = !_addMultiplicativeYn;
		mount();
	}

	function onClickShowMarkLine() {
		_showMarkLine = !_showMarkLine;

		addMarkLine();
	}
</script>


<Card class="flex flex-col w-[800px] h-[300px]"
			padding="none"
			size="none">
	<div class="flex w-full items-center justify-between">
		<ButtonGroup class="*:!ring-0">
			<Button
				disabled={!_resultAndItemData}
				color={_addForecastYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddForecast()}>
				<p class="text-[11px]">
					Forecast
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addForecastAreaYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddForecastArea()}>
				<p class="text-[11px]">
					Forecast Area
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addTrendYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddTrend()}>
				<p class="text-[12px]">
					Trend
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_showMarkLine ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onClickShowMarkLine}>
				<p class="text-[11px]">
					Point
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addYearlyYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddYearly()}>
				<p class="text-[11px]">
					Yearly
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addMonthlyYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddMonthly()}>
				<p class="text-[11px]">
					Monthly
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addWeeklyYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddWeekly()}>
				<p class="text-[11px]">
					Weekly
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addDailyYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddDaily()}>
				<p class="text-[11px]">
					Daily
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addAdditiveYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddAdditive()}>
				<p class="text-[11px]">
					Additive
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addMultiplicativeYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => onclickAddMultiplicative()}>
				<p class="text-[11px]">
					Multiplicative
				</p>
			</Button>
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
</Card>