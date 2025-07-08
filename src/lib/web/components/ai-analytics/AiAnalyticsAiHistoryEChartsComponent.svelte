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
		MapPinPlusIcon
	} from 'lucide-svelte';
	import type { AiAnalyticsHistoryEChartRequestData } from '$lib/common/models/AiAnalyticsData';
	import Decimal from 'decimal.js';

	let {
		eChartRequestData,
		chartClearYn = $bindable()
	}: {
		eChartRequestData: AiAnalyticsHistoryEChartRequestData,
		chartClearYn: boolean
	} = $props();

	const _markPoint: MarkPointOption = EChartsOptionUtils.getMarkPointOption();
	const _markLine: MarkLineOption = EChartsOptionUtils.getMinMaxMarkLineOption();

	let _eChartCount = $derived.by(getEChartCount);
	let _showMarkPoint = $state(false);
	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _candleListByDateTimeRecord: Record<string, CandleData> = $state({});
	let _decimalDepth = $state(0);
	let _addCandleYn = $state(true);
	let _addAccTradeVolumeYn = $state(false);
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
		if (eChartRequestData.inferenceList.length > 0) {
			initDataWithAiResponses(eChartRequestData);
		} else {
			initDataWithoutAiResponses(eChartRequestData);
		}
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
		if (_addAccTradeVolumeYn) {
			eChartCount += 1;
		}

		return eChartCount;
	}

	async function initDataWithAiResponses(eChartRequestData: AiAnalyticsHistoryEChartRequestData) {
		Promise.all([
				getCandleDataList(eChartRequestData)
			])
			.then(() => {
				initEChart();
			});
	}

	async function initDataWithoutAiResponses(eChartRequestData: AiAnalyticsHistoryEChartRequestData) {
		await getCandleDataList(eChartRequestData);
		await initEChart();
	}

	async function getCandleDataList(eChartRequestData: AiAnalyticsHistoryEChartRequestData) {
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

			_decimalDepth = new Decimal(item.tradePrice).dp();

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, CandleData>);
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

		const dateTimeList: string[] = await getDateTimeList();

		const seriesData = await getSeriesOptionList(dateTimeList);

		const gridOption = EChartsOptionUtils.getGridOption(_eChartCount);
		const xAxis = EChartsOptionUtils.getXAxisOption(dateTimeList, _eChartCount);
		const yAxis = EChartsOptionUtils.getYAxisOption(_eChartCount);

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

		const marketCandleDateTime = Object.keys(_candleListByDateTimeRecord);

		let startDateTime = marketCandleDateTime[0];
		let endDateTime = marketCandleDateTime[marketCandleDateTime.length - 1];

		if (!eChartRequestData.inferenceList.length) {
			return CurrentDateUtils.getDateTimeList(
				startDateTime,
				endDateTime,
				eChartRequestData.candleUnit
			);
		}

		const inferenceEndDate = eChartRequestData.inferenceList.map((item) => {
				return Object.keys(item.inferenceItemByDateTimeRecord);
			})
			.flatMap((item) => item)
			.reduce((acc, item) => {
				return acc.localeCompare(item) > 0 ? acc : item;
			}, endDateTime);

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

		if (_addCandleYn) {
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
		}

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

			const periodList = [5, 15, 30];

			const maSeriesOptionList = EChartsOptionUtils.getMASeriesOption(
				'MA',
				tradePriceList,
				periodList,
				0,
				_decimalDepth
			);

			const itemNameList = maSeriesOptionList.map((item) => {
				if (item.name) {
					return item.name.toString();
				}

				return '';
			});

			seriesData.itemNameList.push(...itemNameList);
			seriesData.seriesList.push(...maSeriesOptionList);
		}

		if (!eChartRequestData.inferenceList.length) {
			return seriesData;
		}

		eChartRequestData.inferenceList
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
			.forEach((inference) => {
				const candlestickList: EChartCandlestickSeriesData[] = dateTimeList.map((dateTime) => {
					const inferenceItem = inference.inferenceItemByDateTimeRecord[dateTime];

					if (!inferenceItem) {
						return {
							openingPrice: NaN,
							highPrice: NaN,
							lowPrice: NaN,
							tradePrice: NaN
						} as EChartCandlestickSeriesData;
					}

					return {
						openingPrice: inferenceItem.openingPrice,
						highPrice: inferenceItem.highPrice,
						lowPrice: inferenceItem.lowPrice,
						tradePrice: inferenceItem.tradePrice
					} as EChartCandlestickSeriesData;
				});

				const candleSeriesOption = EChartsOptionUtils.getCandleSeriesOption(
					inference.createdAt,
					candlestickList,
					undefined,
					undefined,
					'#FF0000',
					'#0000FF'
				);

				seriesData.itemNameList.push(inference.createdAt);
				seriesData.seriesList.push(candleSeriesOption);
			});

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

	function onclickAddCandle() {
		_addCandleYn = !_addCandleYn;
		initEChart();
	}

	function onclickAddMa() {
		_addMaYn = !_addMaYn;
		initEChart();
	}

	function onclickAddAccTradeVolume() {
		_addAccTradeVolumeYn = !_addAccTradeVolumeYn;
		initEChart();
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
		<ButtonGroup class="*:!ring-0">
			<Button
				color={_addCandleYn ? 'green' : 'light'}
				class="p-2 focus:ring-0"
				onclick={onclickAddCandle}>
				<p class="text-[12px] leading-none">
					{eChartRequestData.marketName}
				</p>
			</Button>
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
		<div class="border pb-2 shadow-sm rounded-md">
			<Range
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