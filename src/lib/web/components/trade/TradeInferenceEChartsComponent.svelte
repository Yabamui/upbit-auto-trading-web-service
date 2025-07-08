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
	import {
		Button,
		ButtonGroup,
		Range
	} from 'flowbite-svelte';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import type { CandleData } from '$lib/common/models/CandleData';
	import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		type EChartCandlestickSeriesData,
		EChartsOptionUtils
	} from '$lib/common/utils/EChartsOptionUtils';
	import {
		ChartGanttIcon,
		CircleChevronLeftIcon,
		MapPinPlusIcon
	} from 'lucide-svelte';
	import type { AiAnalyticsCandleEChartRequestData } from '$lib/common/models/AiAnalyticsData';
	import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

	let {
		eChartRequestData,
		chartClearYn = $bindable()
	}: {
		eChartRequestData: AiAnalyticsCandleEChartRequestData,
		chartClearYn: boolean
	} = $props();

	const _markPoint: MarkPointOption = EChartsOptionUtils.getMarkPointOption();
	const _markLine: MarkLineOption = EChartsOptionUtils.getMinMaxMarkLineOption();

	let _showMarkPoint = $state(false);
	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _candleListByDateTimeRecord: Record<string, CandleData> = $state({});
	let _addAccTradeVolumeYn = $state(true);
	let _addMaYn = $state(false);

	onDestroy(() => {
		_candleListByDateTimeRecord = {};

		if (_eCharts && !_eCharts.isDisposed()) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	});

	$effect(() => {
		if (eChartRequestData.inferenceByDateTime) {
			initDataWithAiResponses(eChartRequestData);
		} else {
			initDataWithoutAiResponses(eChartRequestData);
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

	async function initDataWithAiResponses(eChartRequestData: AiAnalyticsCandleEChartRequestData) {
		await getCandleDataList(eChartRequestData);
		await initEChart();
	}

	async function initDataWithoutAiResponses(eChartRequestData: AiAnalyticsCandleEChartRequestData) {
		await getCandleDataList(eChartRequestData);
		await initEChart();
	}

	async function getCandleDataList(eChartRequestData: AiAnalyticsCandleEChartRequestData) {
		const candleCount = 200;
		const to = '';

		_candleListByDateTimeRecord = {};

		const responseObjet = await CandleWebApi.getCandleList(
			eChartRequestData.market,
			eChartRequestData.candleUnit,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			return;
		}

		const candleDataList = (responseObjet.data as CandleData[]).reverse();

		_candleListByDateTimeRecord = candleDataList.reduce((acc, item) => {
			const candleDateTime = UPBitCandleTimeZones.utc === eChartRequestData.candleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				eChartRequestData.dateTimeFormat
			);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, CandleData>);
	}

	async function updateCandleDataList() {

		if (!_eCharts) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent updateCandleDataList',
				'_eCharts is null'
			);
			return;
		}

		if (Object.keys(_candleListByDateTimeRecord).length === 0) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent updateCandleDataList',
				'_candleListByDateTimeRecord is empty'
			);
			return;
		}

		const candleCount = 20;
		const to = '';

		const responseObjet = await CandleWebApi.getCandleList(
			eChartRequestData.market,
			eChartRequestData.candleUnit,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent updateCandleDataList',
				responseObjet.message
			);
			return;
		}

		const currentCandleData = (responseObjet.data as CandleData[]);

		currentCandleData.forEach((item) => {
			const candleDateTime = UPBitCandleTimeZones.utc === eChartRequestData.candleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				eChartRequestData.dateTimeFormat
			);

			_candleListByDateTimeRecord[dateTime] = item;
		});

		const dateTimeList = await getDateTimeList();

		const candlestickList: EChartCandlestickSeriesData[] = dateTimeList.map((dateTime) => {
			const candleData = _candleListByDateTimeRecord[dateTime];

			if (!candleData) {
				return {
					openingPrice: NaN,
					highPrice: NaN,
					lowPrice: NaN,
					tradePrice: NaN
				} as EChartCandlestickSeriesData;
			}

			return {
				openingPrice: candleData.openingPrice,
				highPrice: candleData.highPrice,
				lowPrice: candleData.lowPrice,
				tradePrice: candleData.tradePrice
			} as EChartCandlestickSeriesData;
		});

		const marketCandleSeries = EChartsOptionUtils.getCandleSeriesOption(
			eChartRequestData.marketName,
			candlestickList,
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

	async function initEChart() {

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

		const marketCandleDateTime: string[] = await getDateTimeList();

		const seriesData = await getSeriesOptionList(marketCandleDateTime);

		const dataListInList = _addAccTradeVolumeYn ? [marketCandleDateTime, marketCandleDateTime] : [marketCandleDateTime];

		const gridOption = EChartsOptionUtils.getGridOption(dataListInList.length);
		const xAxis = EChartsOptionUtils.getXAxisOption(dataListInList);
		const yAxis = EChartsOptionUtils.getYAxisOption(dataListInList);

		const legend = EChartsOptionUtils.getLegentOption(seriesData.itemNameList);

		const visualMap = _addAccTradeVolumeYn ?
			EChartsOptionUtils.getVisualMapOption(1) :
			undefined;

		const eChartsOption = getEChartsOption(
			legend,
			visualMap,
			gridOption,
			xAxis,
			yAxis,
			seriesData.seriesList
		);

		_eCharts.setOption(eChartsOption);

		reflectColorTheme(_textColor);

		_eCharts.hideLoading();
	}

	async function getDateTimeList(): Promise<string[]> {

		const marketCandleDateTime = Object.keys(_candleListByDateTimeRecord)
			.sort((a, b) => {
				return a.localeCompare(b);
			});

		let startDateTime = marketCandleDateTime[0];
		let endDateTime = marketCandleDateTime[marketCandleDateTime.length - 1];

		if (!eChartRequestData.inferenceByDateTime) {
			return CurrentDateUtils.getDateTimeList(
				startDateTime,
				endDateTime,
				eChartRequestData.candleUnit
			);
		}

		const inferenceEndDate = Object.keys(eChartRequestData.inferenceByDateTime)
			.reduce((acc, item) => {
				return acc.localeCompare(item) > 0 ? acc : item;
			});

		endDateTime = inferenceEndDate.localeCompare(endDateTime) > 0 ? inferenceEndDate : endDateTime;

		return CurrentDateUtils.getDateTimeList(
			startDateTime,
			endDateTime,
			eChartRequestData.candleUnit
		);
	}

	async function getSeriesOptionList(dateTimeList: string[]) {

		const seriesData: {
			itemNameList: string[],
			seriesList: echarts.SeriesOption[]
		} = {
			itemNameList: [],
			seriesList: []
		};

		const candlestickList: EChartCandlestickSeriesData[] = dateTimeList.map((dateTime) => {
			const candleData = _candleListByDateTimeRecord[dateTime];

			if (!candleData) {
				return {
					openingPrice: NaN,
					highPrice: NaN,
					lowPrice: NaN,
					tradePrice: NaN
				} as EChartCandlestickSeriesData;
			}

			return {
				openingPrice: candleData.openingPrice,
				highPrice: candleData.highPrice,
				lowPrice: candleData.lowPrice,
				tradePrice: candleData.tradePrice
			} as EChartCandlestickSeriesData;
		});

		const marketCandleSeries = EChartsOptionUtils.getCandleSeriesOption(
			eChartRequestData.marketName,
			candlestickList,
			'#FF0000',
			'#0000FF',
			'#FF0000',
			'#0000FF'
		);

		seriesData.itemNameList.push(eChartRequestData.marketName);
		seriesData.seriesList.push(marketCandleSeries);

		if (_addAccTradeVolumeYn) {
			const itemName = '누적 거래량';

			const tradeValueDataList = dateTimeList.map((dateTime, index) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return [
						NaN,
						NaN,
						NaN
					];
				}

				return [
					index,
					candleData.candleAccTradeVolume,
					candleData.openingPrice > candleData.tradePrice ? 1 : -1
				];
			});
			const accTradeVolumeSeriesOption = EChartsOptionUtils.getBarSeriesOption(
				itemName,
				tradeValueDataList,
				1,
				1
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(accTradeVolumeSeriesOption);
		}

		if (_addMaYn) {
			const tradePriceList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const ma5SeriesOption = EChartsOptionUtils.getLineSeriesOption(
				'MA5',
				EChartsOptionUtils.calculateMA(5, tradePriceList),
				0,
				0,
				'#FF0000'
			);

			const ma10SeriesOption = EChartsOptionUtils.getLineSeriesOption(
				'MA10',
				EChartsOptionUtils.calculateMA(10, tradePriceList),
				0,
				0,
				'#00FF00'
			);

			const ma20SeriesOption = EChartsOptionUtils.getLineSeriesOption(
				'MA20',
				EChartsOptionUtils.calculateMA(20, tradePriceList),
				0,
				0,
				'#0000FF'
			);

			const ma30SeriesOption = EChartsOptionUtils.getLineSeriesOption(
				'MA30',
				EChartsOptionUtils.calculateMA(30, tradePriceList),
				0,
				0,
				'#FF00FF'
			);

			seriesData.itemNameList.push('MA5');
			seriesData.itemNameList.push('MA10');
			seriesData.itemNameList.push('MA20');
			seriesData.itemNameList.push('MA30');

			seriesData.seriesList.push(ma5SeriesOption);
			seriesData.seriesList.push(ma10SeriesOption);
			seriesData.seriesList.push(ma20SeriesOption);
			seriesData.seriesList.push(ma30SeriesOption);
		}

		if (!eChartRequestData.inferenceByDateTime) {
			return seriesData;
		}

		const inferenceByDateTime = eChartRequestData.inferenceByDateTime;

		const candleData: EChartCandlestickSeriesData[] = dateTimeList.map((dateTime) => {

			if (!inferenceByDateTime[dateTime]) {
				return {
					openingPrice: NaN,
					highPrice: NaN,
					lowPrice: NaN,
					tradePrice: NaN
				};
			}

			const inference = inferenceByDateTime[dateTime];

			return {
				openingPrice: inference.openPrice,
				highPrice: inference.highPrice,
				lowPrice: inference.lowPrice,
				tradePrice: inference.closePrice
			};
		});

		const inferenceCandleName = '예상금액';

		const aiResponsesItemSeriesOption = EChartsOptionUtils.getCandleSeriesOption(
			inferenceCandleName,
			candleData,
			undefined,
			undefined,
			'#FF0000',
			'#0000FF'
		);

		seriesData.itemNameList.push(inferenceCandleName);
		seriesData.seriesList.push(aiResponsesItemSeriesOption);

		return seriesData;
	}

	function getEChartsOption(
		legend: echarts.LegendComponentOption,
		visualMap: echarts.VisualMapComponentOption | undefined,
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
				},
				position: EChartsOptionUtils.tooltipPosition
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
			visualMap: visualMap,
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

	function onclickShowMarkPoint() {
		_showMarkPoint = !_showMarkPoint;

		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markPoint: _showMarkPoint ? _markPoint : undefined }
			]
		});
	}

	function onclickShowMarkLine() {
		_showMarkLine = !_showMarkLine;

		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markLine: _showMarkLine ? _markLine : undefined }
			]
		});
	}

	function onclickAddMa() {
		_addMaYn = !_addMaYn;
		initEChart();
	}

	function onclickAddAccTradeVolume() {
		_addAccTradeVolumeYn = !_addAccTradeVolumeYn;
		initEChart();
	}

	async function onclickAddBeforeCandleList() {
		if (!_eCharts || Object.keys(_candleListByDateTimeRecord).length === 0) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent addCandleDataList',
				'_eCharts or _candleListByDateTimeRecord is null'
			);
			return;
		}

		const candleCount = 200;

		const to = Object.values(_candleListByDateTimeRecord)
			.sort((a, b) => {
				return a.candleDateTimeUtc.localeCompare(b.candleDateTimeUtc);
			})[0].candleDateTimeUtc;

		const responseObjet = await CandleWebApi.getCandleList(
			eChartRequestData.market,
			eChartRequestData.candleUnit,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent addCandleDataList',
				responseObjet.message
			);
			return;
		}

		const currentCandleData = (responseObjet.data as CandleData[]);

		currentCandleData.forEach((item) => {
			const candleDateTime = UPBitCandleTimeZones.utc === eChartRequestData.candleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				eChartRequestData.dateTimeFormat
			);

			_candleListByDateTimeRecord[dateTime] = item;
		});

		if (_eCharts) {
			_eCharts.clear();
		}

		await initEChart();
	}
</script>


<div class="flex flex-col w-full h-full">
	<div class="flex w-full items-center justify-between">
		<ButtonGroup class="*:!ring-0">
			<Button
				color={_showMarkPoint ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onclickShowMarkPoint}>
				<MapPinPlusIcon class="w-3 h-3"
												strokeWidth={3} />
			</Button>
			<Button
				color={_showMarkLine ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onclickShowMarkLine}>
				<ChartGanttIcon class="w-3 h-3"
												strokeWidth={3} />
			</Button>
		</ButtonGroup>
		<ButtonGroup class="*:!ring-0 p-0">
			<Button
				color={_addAccTradeVolumeYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onclickAddAccTradeVolume}>
				<p class="text-[12px] leading-none">
					Trade Volume
				</p>
			</Button>
			<Button
				color={_addMaYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onclickAddMa}>
				<p class="text-[12px] leading-none">
					MA
				</p>
			</Button>
		</ButtonGroup>
		<div class="inline-flex items-center gap-2">
			<Button
				type="button"
				color="none"
				class="p-0 focus:ring-0"
				onclick={onclickAddBeforeCandleList}>
				<CircleChevronLeftIcon class="w-5 h-5"
															 strokeWidth={3} />
			</Button>
			<div class="border pb-1 shadow-sm rounded-md">
				<Range
					min="0"
					max="99"
					step="1"
					bind:value={_dataZoomStart} />
			</div>
		</div>
	</div>
	<div class="flex w-full h-full"
			 bind:this={_eChartsElement}>
	</div>
</div>