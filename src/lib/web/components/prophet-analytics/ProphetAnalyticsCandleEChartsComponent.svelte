<script lang="ts">
	import * as echarts from 'echarts';
	import {
		onDestroy,
		tick
	} from 'svelte';
	import type {
		MarkLineOption,
		MarkPointOption
	} from 'echarts/types/dist/shared';
	import { colorThemeStore } from '$lib/stores/ThemeStore';
	import type { ProphetAnalyticsEChartRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';
	import {
		Button,
		ButtonGroup,
		Range
	} from 'flowbite-svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import type { CandleData } from '$lib/common/models/CandleData';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		type ECHartLineConfidenceBandSeriesData,
		EChartsOptionUtils
	} from '$lib/common/utils/EChartsOptionUtils';
	import {
		ChartGanttIcon,
		MapPinPlusIcon
	} from 'lucide-svelte';

	let {
		eChartRequestData,
		chartClearYn = $bindable()
	}: {
		eChartRequestData: ProphetAnalyticsEChartRequestData,
		chartClearYn: boolean
	} = $props();

	const _markPoint: MarkPointOption = EChartsOptionUtils.getMarkPointOption();
	const _markLine: MarkLineOption = EChartsOptionUtils.getMarkLineOption();

	let _showMarkPoint = $state(false);
	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _height = $state(600);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _candleDataList: CandleData[] = $state([]);
	let _resultAndItemData: ProphetAnalyticsResultAndItemData | null = $state(null);
	let _addTrendYn = $state(false);
	let _addForecastYn = $state(false);
	let _addForecastAreaYn = $state(false);

	onDestroy(() => {
		_candleDataList = [];
		_resultAndItemData = null;
		if (_eCharts && !_eCharts.isDisposed()) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	});

	$effect(() => {
		if (eChartRequestData && eChartRequestData.prophetAnalyticsResultId) {
			getCandleDataList(eChartRequestData)
				.then(() => addProphetAnalyticsResultAndItemAndMount());
		} else {
			getCandleDataList(eChartRequestData)
				.then(() => removeProphetAnalyticsResultAndItemAndMount());
		}
	});

	$effect(() => {
		const candleInterval = setInterval(() => {
			updateCandleDataList();
		}, 1000 * 5);

		return () => {
			clearInterval(candleInterval);
		};
	});

	$effect(() => {
		if (_textColor) {
			reflectColorTheme(_textColor);
		}
	});

	$effect(() => {
		resizeDataZoom();
	});

	async function getCandleDataList(eChartRequestData: ProphetAnalyticsEChartRequestData) {
		const candleCount = 0;
		const to = '';

		_candleDataList = [];

		const responseObjet = await CandleWebApi.getSavedCandleList(
			eChartRequestData.market,
			eChartRequestData.candleType,
			eChartRequestData.candleTimeZone,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			return;
		}

		_candleDataList = (responseObjet.data as CandleData[]).reverse();
	}

	async function getProphetAnalyticsResultAndItem(eChartRequestData: ProphetAnalyticsEChartRequestData) {

		_resultAndItemData = null;

		if (!eChartRequestData || !eChartRequestData.prophetAnalyticsResultId) {
			return;
		}

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.getProphetAnalyticsResult(
			eChartRequestData.prophetAnalyticsResultId
		);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		_resultAndItemData = responseObject.data as ProphetAnalyticsResultAndItemData;
	}

	async function updateCandleDataList() {

		if (!_eCharts || !_candleDataList || _candleDataList.length === 0) {
			console.log('end updateCandleDataList echarts or candleDataList is null');
			return;
		}

		const candleCount = 20;
		const to = '';

		const responseObjet = await CandleWebApi.getCandleList(
			eChartRequestData.market,
			eChartRequestData.candleType,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			console.log('end updateCandleDataList responseObjet.code is not success' + responseObjet.message);
			return;
		}

		const currentCandleData = (responseObjet.data as CandleData[]).reverse();

		const lastCandleData: CandleData = _candleDataList[_candleDataList.length - 1];

		let equalsDataYn = false;

		const filteredCandleData = currentCandleData.filter((item) => {
			const current = CurrentDateUtils.toUnixTimestampByString(item.candleDateTimeUtc);
			const latest = CurrentDateUtils.toUnixTimestampByString(lastCandleData.candleDateTimeUtc);

			if (current === latest) {
				equalsDataYn = true;
			}

			return current >= latest;
		});

		if (filteredCandleData.length === 0) {
			console.log('end updateCandleDataList filteredCandleData.length is 0');
			return;
		}

		if (equalsDataYn) {
			const datalist = _candleDataList.slice(0, -1);

			datalist.push(...filteredCandleData);

			_candleDataList = datalist;
		} else {
			_candleDataList.push(...filteredCandleData);
		}

		const marketCandleSeries = EChartsOptionUtils.getCandleSeriesOption(
			eChartRequestData.marketName,
			_candleDataList,
			'#FF0000',
			'#0000FF',
			'#FF0000',
			'#0000FF'
		);

		_eCharts.setOption({
			series: [
				marketCandleSeries
			]
		});
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

		if (chartClearYn) {
			_eCharts.clear();
			chartClearYn = false;
		}

		_eCharts.showLoading();

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === eChartRequestData.candleType) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const marketCandleDateTime: string[] = await getDateTimeList(dateTimeFormat);

		const seriesData = await getSeriesOptionList();

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
		const addHeight = (dataListInList.length - 2) * 100;
		if (addHeight > 0) {
			_height = 600 + addHeight;
			onChangeHigh();
		}

		_eCharts.hideLoading();
	}

	function addProphetAnalyticsResultAndItemAndMount() {
		_addForecastYn = true;

		getProphetAnalyticsResultAndItem(eChartRequestData)
			.then(() => mount());
	}

	function removeProphetAnalyticsResultAndItemAndMount() {
		_resultAndItemData = null;
		_addForecastYn = false;
		_addTrendYn = false;
		_addForecastAreaYn = false;
		mount();
	}

	function addTrend() {
		_addTrendYn = !_addTrendYn;
		mount();
	}

	function addForecast() {
		_addForecastYn = !_addForecastYn;
		mount();
	}

	function addForecastArea() {
		_addForecastAreaYn = !_addForecastAreaYn;
		mount();
	}

	async function getDateTimeList(dateTimeFormat: string): Promise<string[]> {

		const marketCandleDateTime: string[] = _candleDataList.map((item: CandleData) => {
				if (UPBitCandleTimeZones.utc === eChartRequestData.candleTimeZone) {
					return item.candleDateTimeUtc;
				} else {
					return item.candleDateTimeKst;
				}
			})
			.map((dateTime: string) => {
				return CurrentDateUtils.convertFormat(dateTime, dateTimeFormat);
			});

		if (_addTrendYn || _addForecastYn) {
			const dateTimeList = _resultAndItemData?.resultItemList.map((item) => {
				return CurrentDateUtils.convertFormat(item.ds, dateTimeFormat);
			}) || [];

			return Array.from(
				new Set([
					...marketCandleDateTime,
					...dateTimeList
				])
			);
		}

		return marketCandleDateTime;
	}

	async function getSeriesOptionList() {
		const marketCandleSeries = EChartsOptionUtils.getCandleSeriesOption(
			eChartRequestData.marketName,
			_candleDataList,
			'#FF0000',
			'#0000FF',
			'#FF0000',
			'#0000FF'
		);

		const seriesData = {
			itemNameList: [
				eChartRequestData.marketName
			],
			seriesList: [
				marketCandleSeries
			]
		};

		if (!_resultAndItemData) {
			return seriesData;
		}

		if (_addTrendYn) {
			const itemName = 'Trend';
			const trendSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => item.trend),
				0,
				0,
				'#0000FF'
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(trendSeriesOption);
		}

		if (_addForecastYn) {
			const itemName = 'Forecast';

			const forecastSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				_resultAndItemData.resultItemList.map((item) => item.yhat),
				0,
				0,
				'#000f0f'
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
						middle: item.yhat,
						low: item.yhatLower,
						high: item.yhatUpper
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
				// position: tooltipPosition
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
		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markLine: _showMarkLine ? _markLine : undefined }
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

	function onChangeHigh() {
		_eCharts?.resize({ height: _height });
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

	function onClickShowMarkPoint() {
		_showMarkPoint = !_showMarkPoint;

		addMarkPoint();
	}

	function addMarkPoint() {
		if (!_eCharts) {
			return;
		}

		if (!_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markPoint: _showMarkPoint ? _markPoint : undefined }
			]
		});
	}

	function onClickShowMarkLine() {
		_showMarkLine = !_showMarkLine;

		addMarkLine();
	}
</script>


<div class="flex flex-col w-full h-full">
	<div class="flex w-full items-center justify-between">
		<ButtonGroup class="*:!ring-0">
			<Button
				color={_showMarkPoint ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onClickShowMarkPoint}>
				<MapPinPlusIcon class="w-5 h-5" />
			</Button>
			<Button
				color={_showMarkLine ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onClickShowMarkLine}>
				<ChartGanttIcon class="w-5 h-5" />
			</Button>
		</ButtonGroup>
		<ButtonGroup class="*:!ring-0">
			<Button
				disabled={!_resultAndItemData}
				color={_addTrendYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => addTrend()}>
				<p class="text-[12px]">
					Trend
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addForecastYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => addForecast()}>
				<p class="text-[11px]">
					Forecast
				</p>
			</Button>
			<Button
				disabled={!_resultAndItemData}
				color={_addForecastAreaYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={() => addForecastArea()}>
				<p class="text-[11px]">
					F Area
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
</div>