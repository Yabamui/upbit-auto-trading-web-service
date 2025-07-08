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
		Dropdown,
		DropdownDivider,
		DropdownItem,
		Range
	} from 'flowbite-svelte';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import type { CandleData } from '$lib/common/models/CandleData';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		type EChartCandlestickSeriesData,
		type ECHartLineConfidenceBandSeriesData,
		EChartsOptionUtils
	} from '$lib/common/utils/EChartsOptionUtils';
	import {
		ChartGanttIcon,
		ChevronDownIcon,
		MapPinPlusIcon
	} from 'lucide-svelte';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import Decimal from 'decimal.js';
	import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
	import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';

	let {

		marketInfo,
		chartClearYn = $bindable()
	}: {
		marketInfo: MarketInfoData,
		chartClearYn: boolean
	} = $props();

	const _markPoint: MarkPointOption = EChartsOptionUtils.getMarkPointOption();
	const _markLine: MarkLineOption = EChartsOptionUtils.getMinMaxMarkLineOption();

	let _eChartIndicator = $state({
		MA: {
			chartName: 'MA',
			openYn: true
		},
		Volume: {
			chartName: '거래량',
			openYn: true
		},
		PriceRate: {
			chartName: 'Price Rate',
			openYn: false
		},
		MACD: {
			chartName: 'MACD',
			openYn: false
		},
		RSI: {
			chartName: 'RSI',
			openYn: false
		},
		Stochastic: {
			chartName: 'Stochastic',
			openYn: false
		},
		StochasticRSI: {
			chartName: 'Stochastic RSI',
			openYn: false
		}
	});

	let _initYn = $state(false);
	let _eChartIndicatorsDropdownOpenYn = $state(false);
	let _eChartCandleUnit = $state(UPBitCandleUnitEnum.days.key);
	let _eChartCandleTimeZone = $derived.by(getEChartCandleTimeZones);
	let _eChartDateTimeFormat = $derived.by(getEChartDateTimeFormat);
	let _eChartCount = $derived.by(getEChartCount);
	let _eChartSubtextList: string[] = $state([]);
	let _eChartReloadingYn = $state(false);

	let _showMarkPoint = $state(false);
	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);

	let _decimalDepth = $state(0);
	let _candleListByDateTimeRecord: Record<string, CandleData> = $state({});
	let _prophetInferenceByDateTimeRecord: Record<string, ProphetAnalyticsResultItemData> | undefined = $state(undefined);
	let _addTrendYn = $state(false);
	let _addForecastYn = $state(false);
	let _addForecastAreaYn = $state(false);

	onDestroy(() => {
		_candleListByDateTimeRecord = {};
		_prophetInferenceByDateTimeRecord = undefined;

		if (_eCharts && !_eCharts.isDisposed()) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	});

	$effect(() => {
		if (marketInfo) {
			initDataSet(marketInfo);
		}
	});

	$effect(() => {
		if (!_initYn) {
			return;
		}

		const candleInterval = setInterval(() => {
			if (!_eChartReloadingYn) {
				updateCandleDataList();
			}
		}, 1000 * 2);

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

	function getEChartCandleTimeZones() {
		switch (_eChartCandleUnit) {
			case UPBitCandleUnitEnum.seconds.key:
			case UPBitCandleUnitEnum.minutes.key:
			case UPBitCandleUnitEnum.minutes3.key:
			case UPBitCandleUnitEnum.minutes5.key:
			case UPBitCandleUnitEnum.minutes10.key:
			case UPBitCandleUnitEnum.minutes15.key:
			case UPBitCandleUnitEnum.minutes30.key:
			case UPBitCandleUnitEnum.hours.key:
			case UPBitCandleUnitEnum.hours4.key:
				return UPBitCandleTimeZones.kst;
			default:
				return UPBitCandleTimeZones.utc;
		}
	}

	function getEChartDateTimeFormat() {
		return CurrentDateUtils.getFormat(_eChartCandleUnit);
	}

	function getEChartCount() {
		let eChartCount = 1;

		if (_eChartIndicator.Volume.openYn) {
			eChartCount += 1;
		}

		if (_eChartIndicator.PriceRate.openYn) {
			eChartCount += 1;
		}

		if (_eChartIndicator.MACD.openYn) {
			eChartCount += 1;
		}

		if (_eChartIndicator.RSI.openYn) {
			eChartCount += 1;
		}

		if (_eChartIndicator.Stochastic.openYn) {
			eChartCount += 1;
		}

		if (_eChartIndicator.StochasticRSI.openYn) {
			eChartCount += 1;
		}

		return eChartCount;
	}

	async function initDataSet(marketInfo: MarketInfoData) {
		_eChartReloadingYn = true;

		await Promise.all([
			setCandleListByDateTimeRecord(marketInfo.market),
			setProphetInferenceByDateTimeRecord(marketInfo.market)
		]);

		if (!_prophetInferenceByDateTimeRecord) {
			_addForecastYn = false;
			_addTrendYn = false;
			_addForecastAreaYn = false;
		}

		await initEChart();

		_eChartReloadingYn = false;

		_initYn = true;
	}

	async function setCandleListByDateTimeRecord(market: string) {
		const candleCount = 0;
		const to = '';

		_candleListByDateTimeRecord = {};

		const responseObjet = await CandleWebApi.getSavedCandleList(
			market,
			_eChartCandleUnit,
			_eChartCandleTimeZone,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			return;
		}

		const candleDataList = (responseObjet.data as CandleData[]).reverse();

		_candleListByDateTimeRecord = candleDataList.reduce((acc, item) => {
			const candleDateTime = UPBitCandleTimeZones.utc === _eChartCandleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				_eChartDateTimeFormat
			);

			_decimalDepth = new Decimal(item.tradePrice).dp();

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, CandleData>);
	}

	async function setProphetInferenceByDateTimeRecord(market: string) {
		const responseObject = await ProphetAnalyticsWebApi.getLatestProphetAnalyticsResultItemList(
			market,
			_eChartCandleUnit,
			_eChartCandleTimeZone,
			ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key
		);

		if (ResponseCode.success.code !== responseObject.code) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent setProphetInferenceByDateTime',
				responseObject.message
			);
			_prophetInferenceByDateTimeRecord = undefined;
			return;
		}

		const resultItemList = responseObject.data as ProphetAnalyticsResultItemData[];

		_prophetInferenceByDateTimeRecord = resultItemList.reduce((acc, item) => {
			const dateTime = UPBitCandleTimeZones.utc === _eChartCandleTimeZone ?
				CurrentDateUtils.convertFormat(
					item.ds,
					_eChartDateTimeFormat
				) :
				CurrentDateUtils.addHoursByString(
					item.ds,
					9,
					_eChartDateTimeFormat
				);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, ProphetAnalyticsResultItemData>);
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
			marketInfo.market,
			_eChartCandleUnit,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			console.log('end updateCandleDataList responseObjet.code is not success' + responseObjet.message);
			return;
		}

		const currentCandleData = (responseObjet.data as CandleData[]);

		currentCandleData.forEach((item) => {
			const candleDateTime = UPBitCandleTimeZones.utc === _eChartCandleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				_eChartDateTimeFormat
			);

			_candleListByDateTimeRecord[dateTime] = item;
		});

		const dateTimeList = await getDateTimeList();

		const seriesDataList = await getSeriesOptionList(dateTimeList);
		const xAxis = EChartsOptionUtils.getXAxisOption(dateTimeList, _eChartCount);

		_eCharts.setOption({
			series: seriesDataList.seriesList,
			xAxis: xAxis
		});
	}

	async function initEChart() {

		await tick();

		_eChartSubtextList = [];

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

		const visualMap = await getVisualMapOption(seriesData.seriesList);

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

		if (_prophetInferenceByDateTimeRecord) {
			Object.keys(_prophetInferenceByDateTimeRecord)
				.forEach((dateTime) => {
					if (dateTime.localeCompare(endDateTime) > 0) {
						endDateTime = dateTime;
					}
				});
		}

		return CurrentDateUtils.getDateTimeList(
			startDateTime,
			endDateTime,
			_eChartCandleUnit
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

			const tradeDecimalDepth = new Decimal(candleData.tradePrice).dp();

			if (tradeDecimalDepth > _decimalDepth) {
				_decimalDepth = tradeDecimalDepth;
			}

			return {
				openingPrice: candleData.openingPrice,
				highPrice: candleData.highPrice,
				lowPrice: candleData.lowPrice,
				tradePrice: candleData.tradePrice
			} as EChartCandlestickSeriesData;
		});

		const marketCandleSeries = EChartsOptionUtils.getCandleSeriesOption(
			marketInfo.koreanName,
			candlestickList,
			'#FF0000',
			'#0000FF',
			'#FF0000',
			'#0000FF'
		);

		seriesData.itemNameList.push(marketInfo.koreanName);
		seriesData.seriesList.push(marketCandleSeries);

		if (_prophetInferenceByDateTimeRecord) {

			const itemName = '시계열 예측';

			const dataList = [];
			const forecastAreaList = [];
			const trendList = [];

			for (let dateTime of dateTimeList) {
				const prophetInference = _prophetInferenceByDateTimeRecord[dateTime];

				if (!prophetInference) {
					forecastAreaList.push({
						middle: NaN,
						low: NaN,
						high: NaN
					});
					dataList.push(NaN);
					trendList.push(NaN);
					continue;
				}

				forecastAreaList.push({
					middle: CurrentNumberUtils.ceilPrice(prophetInference.yhat, _decimalDepth),
					low: CurrentNumberUtils.ceilPrice(prophetInference.yhatLower, _decimalDepth),
					high: CurrentNumberUtils.ceilPrice(prophetInference.yhatUpper, _decimalDepth)
				});
				dataList.push(CurrentNumberUtils.ceilPrice(
					prophetInference.yhat,
					_decimalDepth
				));
				trendList.push(CurrentNumberUtils.ceilPrice(
					prophetInference.trend,
					_decimalDepth
				));
			}

			const forecastSeriesOption = EChartsOptionUtils.getLineSeriesOption(
				itemName,
				dataList,
				0,
				0,
				'#000f0f'
			);

			seriesData.itemNameList.push(itemName);
			seriesData.seriesList.push(forecastSeriesOption);

			if (_addTrendYn) {
				const itemName = 'Trend';
				const trendSeriesOption = EChartsOptionUtils.getLineSeriesOption(
					itemName,
					trendList,
					0,
					0,
					'#0000FF'
				);

				seriesData.itemNameList.push(itemName);
				seriesData.seriesList.push(trendSeriesOption);
			}

			if (_addForecastAreaYn) {
				const lineConfidenceBandSeriesData: ECHartLineConfidenceBandSeriesData = {
					highName: 'Forecast Upper',
					lowName: 'Forecast Lower',
					highColor: '#ccc',
					itemList: forecastAreaList
				};

				seriesData.itemNameList.push(lineConfidenceBandSeriesData.highName);
				seriesData.itemNameList.push(lineConfidenceBandSeriesData.lowName);

				const forecastSeriesOptionList = EChartsOptionUtils.getLineConfidenceBandSeriesOption(
					lineConfidenceBandSeriesData
				);

				seriesData.seriesList.push(...forecastSeriesOptionList);
			}
		}

		if (_eChartIndicator.MA.openYn) {
			const tradePriceList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const periodList = [5, 15, 30];

			const maSeriesOptionList = await EChartsOptionUtils.getMASeriesOption(
				_eChartIndicator.MA.chartName,
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

			_eChartSubtextList.push(`${ _eChartIndicator.MA.chartName } (${ periodList.join(', ') })`);

			seriesData.itemNameList.push(...itemNameList);
			seriesData.seriesList.push(...maSeriesOptionList);
		}

		let axisIndex = 0;

		if (_eChartIndicator.Volume.openYn) {
			axisIndex += 1;

			const tradeValueDataList = dateTimeList.map((dateTime, index) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return [
						index,
						0,
						NaN
					];
				}

				return [
					index,
					candleData.candleAccTradeVolume,
					candleData.openingPrice > candleData.tradePrice ? 1 : -1
				];
			});

			const accTradeVolumeSeriesOption = EChartsOptionUtils.getVolumeSeriesOption(
				_eChartIndicator.Volume.chartName,
				tradeValueDataList,
				axisIndex
			);

			seriesData.seriesList.push(accTradeVolumeSeriesOption);
		}

		if (_eChartIndicator.PriceRate.openYn) {
			axisIndex += 1;

			const priceRateList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return CurrentNumberUtils.ceilPrice(
					CurrentNumberUtils.calculateRate(
						candleData.tradePrice,
						candleData.openingPrice
					),
					2
				);
			});

			const priceRateSeriesOption = EChartsOptionUtils.getPriceRateSeriesOption(
				_eChartIndicator.PriceRate.chartName,
				priceRateList,
				axisIndex
			);

			seriesData.seriesList.push(priceRateSeriesOption);
		}

		if (_eChartIndicator.MACD.openYn) {
			axisIndex += 1;

			const fastPeriod = 12;
			const slowPeriod = 26;
			const signalPeriod = 9;

			const tradePriceList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const macdLineSeriesOption = await EChartsOptionUtils.getMACDSeriesOption(
				_eChartIndicator.MACD.chartName,
				tradePriceList,
				fastPeriod,
				slowPeriod,
				signalPeriod,
				axisIndex,
				'#0000FF',
				'#FF0000'
			);

			seriesData.seriesList.push(...macdLineSeriesOption);
		}

		if (_eChartIndicator.RSI.openYn) {
			axisIndex += 1;

			const tradePriceList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const rsiPeriod = 15;
			const signalPeriod = 5;
			const rsiLineColor = '#FF0000';
			const signalLineColor = '#0000FF';

			const rsiSeriesOption = await EChartsOptionUtils.getRSISeriesOption(
				_eChartIndicator.RSI.chartName,
				tradePriceList,
				rsiPeriod,
				signalPeriod,
				axisIndex,
				axisIndex,
				rsiLineColor,
				signalLineColor
			);

			seriesData.seriesList.push(...rsiSeriesOption);
		}

		if (_eChartIndicator.Stochastic.openYn) {
			axisIndex += 1;

			const dataListInList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return [];
				}

				return [
					candleData.highPrice,
					candleData.lowPrice,
					candleData.tradePrice
				];
			});

			const stochasticKItemName = '%K';
			const stochasticDItemName = '%D';
			const period = 14;
			const signalPeriod = 3;
			const dPeriod = 3;

			const stochasticSeriesOption = await EChartsOptionUtils.getStochasticSeriesOption(
				stochasticKItemName,
				stochasticDItemName,
				dataListInList,
				period,
				signalPeriod,
				dPeriod,
				axisIndex
			);

			seriesData.seriesList.push(...stochasticSeriesOption);
		}

		return seriesData;
	}

	async function getVisualMapOption(seriesItemList: echarts.SeriesOption[]): Promise<echarts.VisualMapComponentOption[]> {
		const visualMap: echarts.VisualMapComponentOption[] = [];

		const volumeSeriesIndex = seriesItemList.findIndex((item) => item.name === _eChartIndicator.Volume.chartName);

		if (volumeSeriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOption(volumeSeriesIndex));
		}

		const priceRateSeriesIndex = seriesItemList.findIndex((item) => item.name === _eChartIndicator.PriceRate.chartName);

		if (priceRateSeriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOptionPriceRate(priceRateSeriesIndex));
		}

		const macdSeriesIndex = seriesItemList.findIndex((item) => item.name === _eChartIndicator.MACD.chartName);

		if (macdSeriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOptionByMACD(macdSeriesIndex));
		}

		return visualMap;
	}

	function getEChartsOption(
		legend: echarts.LegendComponentOption,
		visualMap: echarts.VisualMapComponentOption[],
		gridOption: echarts.GridComponentOption[],
		xAxis: echarts.XAXisComponentOption[],
		yAxis: echarts.YAXisComponentOption[],
		series: echarts.SeriesOption[]
	): echarts.EChartsOption {
		const title = _eChartSubtextList.length > 0 ? {
			subtext: _eChartSubtextList.join('\n'),
			top: '2%',
			left: '1%'
		} : undefined;

		return {
			title: title,
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

	function onclickTrendYn() {
		_addTrendYn = !_addTrendYn;
		initEChart();
	}

	function onclickForecastYn() {
		_addForecastYn = !_addForecastYn;
		initEChart();
	}

	function onclickForecastAreaYn() {
		_addForecastAreaYn = !_addForecastAreaYn;
		initEChart();
	}

	function onclickMaYn() {
		_eChartIndicator.MA.openYn = !_eChartIndicator.MA.openYn;

		initEChart();
	}

	function onclickAccTradeVolumeYn() {
		_eChartIndicator.Volume.openYn = !_eChartIndicator.Volume.openYn;
		initEChart();
	}

	function onclickPriceRateYn() {
		_eChartIndicator.PriceRate.openYn = !_eChartIndicator.PriceRate.openYn;
		initEChart();
	}

	function onclickMACDYn() {
		_eChartIndicator.MACD.openYn = !_eChartIndicator.MACD.openYn;

		initEChart();
	}

	function onclickRSIYn() {
		_eChartIndicator.RSI.openYn = !_eChartIndicator.RSI.openYn;

		initEChart();
	}

	function onclickStochasticYn() {
		_eChartIndicator.Stochastic.openYn = !_eChartIndicator.Stochastic.openYn;

		initEChart();
	}

	function onclickStochasticRSIYn() {
		_eChartIndicator.StochasticRSI.openYn = !_eChartIndicator.StochasticRSI.openYn;

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
			<DropdownItem
				class={_addForecastYn ? 'border border-green-500' : ''}
				onclick={onclickForecastYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					Forecast
				</div>
			</DropdownItem>
			<DropdownItem
				class={_addForecastAreaYn ? 'border border-green-500' : ''}
				onclick={onclickForecastAreaYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					Forecast Area
				</div>
			</DropdownItem>
			<DropdownItem
				class={_addTrendYn ? 'border border-green-500' : ''}
				onclick={onclickTrendYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					Trend
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.MA.openYn ? 'border border-green-500' : ''}
				onclick={onclickMaYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.MA.chartName}
				</div>
			</DropdownItem>
			<DropdownDivider />
			<DropdownItem
				class={_eChartIndicator.Volume.openYn ? 'border border-green-500' : ''}
				onclick={onclickAccTradeVolumeYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.Volume.chartName}
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.PriceRate.openYn ? 'border border-green-500' : ''}
				onclick={onclickPriceRateYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.PriceRate.chartName}
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.MACD.openYn ? 'border border-green-500' : ''}
				onclick={onclickMACDYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.MACD.chartName}
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.RSI.openYn ? 'border border-green-500' : ''}
				onclick={onclickRSIYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.RSI.chartName}
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.Stochastic.openYn ? 'border border-green-500' : ''}
				onclick={onclickStochasticYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.Stochastic.chartName}
				</div>
			</DropdownItem>
			<DropdownItem
				class={_eChartIndicator.StochasticRSI.openYn ? 'border border-green-500' : ''}
				onclick={onclickStochasticRSIYn}>
				<div class="w-full text-[12px] items-center text-start leading-none">
					{_eChartIndicator.StochasticRSI.chartName}
				</div>
			</DropdownItem>
		</Dropdown>
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