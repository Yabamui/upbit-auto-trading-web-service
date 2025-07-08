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
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import type { CandleData } from '$lib/common/models/CandleData';
	import {
		UPBitCandleTimeZones,
		type UPBitCandleUnitCodeData,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		type EChartCandlestickSeriesData,
		EChartsOptionUtils
	} from '$lib/common/utils/EChartsOptionUtils';
	import {
		ChartGanttIcon,
		ChevronDownIcon,
		CircleChevronLeftIcon,
		MapPinPlusIcon
	} from 'lucide-svelte';
	import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
	import type { AiLatestInferenceData } from '$lib/common/models/AiResponsesData';
	import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';
	import Decimal from 'decimal.js';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';
	import { currentMarketCodeStore } from '$lib/stores/MarketStore';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { tradeEChartIndicatorValueStore } from '$lib/stores/ConfigStore';

	let {
		marketInfo
	}: {
		marketInfo: MarketInfoData,
	} = $props();

	let market: string = $state('');

	const _markPoint: MarkPointOption = EChartsOptionUtils.getMarkPointOption();
	const _markLine: MarkLineOption = EChartsOptionUtils.getMinMaxMarkLineOption();

	let _eChartCandleUnit = $state(UPBitCandleUnitEnum.days.key);
	let _eChartCandleUnitName = $state(UPBitCandleUnitEnum.days.name);
	let _eChartIndicator = $state({
		MA: {
			chartName: 'MA',
			openYn: true,
			seriesIndex: -1
		},
		Volume: {
			chartName: 'Volume',
			openYn: false,
			seriesIndex: -1
		},
		ATR: {
			chartName: 'ATR',
			openYn: false,
			seriesIndex: -1
		},
		PriceRate: {
			chartName: 'Price Rate',
			openYn: false,
			seriesIndex: -1
		},
		MACD: {
			chartName: 'MACD',
			openYn: true,
			seriesIndex: -1
		},
		RSI: {
			chartName: 'RSI',
			openYn: true,
			seriesIndex: -1
		},
		Stochastic: {
			chartName: 'Stochastic',
			openYn: true,
			seriesIndex: -1
		},
		StochasticRSI: {
			chartName: 'Stochastic RSI',
			openYn: true,
			seriesIndex: -1
		}
	});
	let _eChartCandleUnitDropdownOpenYn = $state(false);
	let _eChartIndicatorsDropdownOpenYn = $state(false);
	let _eChartProphetInferenceUpYn = $state(false);
	let _eChartProphetInferenceLowYn = $state(false);

	let _eChartCandleTimeZone = $derived.by(getEChartCandleTimeZones);
	let _eChartDateTimeFormat = $derived.by(getEChartDateTimeFormat);
	let _eChartCount = $derived.by(getEChartCount);
	let _eChartReloadingYn = $state(false);

	let _showMarkPoint = $state(false);
	let _showMarkLine = $state(false);
	let _dataZoomStart = $state(50);
	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _eChartSubtextList: string[] = $state([]);

	let _decimalDepth = $state(0);
	let _candleListByDateTimeRecord: Record<string, CandleData> = $state({});
	let _aiInferenceByDateTimeRecord: Record<string, AiLatestInferenceData> | undefined = $state(undefined);
	let _prophetInferenceByDateTimeRecord: Record<string, ProphetAnalyticsResultItemData> | undefined = $state(undefined);

	onDestroy(() => {
		_candleListByDateTimeRecord = {};
		tradeEChartIndicatorValueStore.set(JSON.stringify(_eChartIndicator));

		if (_eCharts && !_eCharts.isDisposed()) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	});

	$effect(() => {
		if (marketInfo && marketInfo.market !== market) {
			market = marketInfo.market;
			mount();
		}
	});

	$effect(() => {
		const candleInterval = setInterval(() => {
			if (!_eChartReloadingYn) {
				updateCandleDataList();
			}
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

		if (_eChartIndicator.ATR.openYn) {
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

	async function mount() {

		_eChartReloadingYn = true;

		if ($tradeEChartIndicatorValueStore) {
			_eChartIndicator = JSON.parse($tradeEChartIndicatorValueStore);
		}

		await initEChart();

		_eChartReloadingYn = false;
	}

	async function getCandleDataList(market: string) {
		const candleCount = 200;
		const to = '';

		_candleListByDateTimeRecord = {};

		const responseObjet = await CandleWebApi.getCandleList(
			market,
			_eChartCandleUnit,
			candleCount,
			to
		);

		if (ResponseCode.success.code !== responseObjet.code) {
			return;
		}

		const candleList = (responseObjet.data as CandleData[]).reverse();

		_candleListByDateTimeRecord = candleList.reduce((acc, item) => {
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
			$currentMarketCodeStore,
			_eChartCandleUnit,
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

	async function setAiInferenceByDateTime(market: string) {

		const responsesObject = await AiAnalyticsWebApi.getAiLatestInferenceList(
			'',
			market,
			_eChartCandleUnit,
			UPBitCandleTimeZones.utc,
			false
		);

		if (ResponseCode.success.code !== responsesObject.code) {
			LoggingUtils.error(
				'AiAnalyticsCandleEChartsComponent setAiInferenceByDateTime',
				responsesObject.message
			);
			_aiInferenceByDateTimeRecord = undefined;
			return;
		}

		const aiInferenceList = responsesObject.data as AiLatestInferenceData[];

		if (!aiInferenceList.length) {
			_aiInferenceByDateTimeRecord = undefined;
			return;
		}

		_aiInferenceByDateTimeRecord = aiInferenceList.reduce((acc, item) => {
			const dateTime = UPBitCandleTimeZones.utc === _eChartCandleTimeZone ?
				CurrentDateUtils.convertFormat(
					item.dateTime,
					_eChartDateTimeFormat
				) :
				CurrentDateUtils.addHoursByString(
					item.dateTime,
					9,
					_eChartDateTimeFormat
				);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, AiLatestInferenceData>);
	}

	async function setProphetInferenceByDateTime(market: string) {
		const responseObject = await ProphetAnalyticsWebApi.getLatestProphetAnalyticsResultItemList(
			market,
			_eChartCandleUnit,
			UPBitCandleTimeZones.utc,
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

		if (!resultItemList.length) {
			_prophetInferenceByDateTimeRecord = undefined;
			return;
		}

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

	async function initEChart() {

		if (_eCharts) {
			_eCharts.dispose();
			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
			_eCharts = undefined;
		}

		await tick();

		_eCharts = echarts.init(_eChartsElement, '', {
			renderer: 'canvas',
			width: 'auto',
			height: 'auto'
		});

		_eCharts.showLoading();

		await Promise.all([
			getCandleDataList(marketInfo.market),
			setAiInferenceByDateTime(marketInfo.market),
			setProphetInferenceByDateTime(marketInfo.market),
		]);

		window.addEventListener('resize', () => {
			_eCharts?.resize();
		});

		await setEChartsData(_eCharts);

		_eCharts.hideLoading();
	}

	async function setEChartsData(echarts: echarts.ECharts) {
		echarts.clear();

		_eChartSubtextList = [];

		const dateTimeList: string[] = await getDateTimeList();

		const seriesData = await getSeriesOptionList(dateTimeList);

		const gridOption = EChartsOptionUtils.getGridOption(_eChartCount);
		const xAxis = EChartsOptionUtils.getXAxisOption(dateTimeList, _eChartCount);
		const yAxis = EChartsOptionUtils.getYAxisOption(_eChartCount);

		const legend = EChartsOptionUtils.getLegentOption(seriesData.itemNameList);

		const visualMap = await getVisualMapOption();

		const eChartsOption = getEChartsOption(
			legend,
			visualMap,
			gridOption,
			xAxis,
			yAxis,
			seriesData.seriesList
		);

		echarts.setOption(eChartsOption);

		reflectColorTheme(_textColor);
	}

	async function getDateTimeList(): Promise<string[]> {

		const marketCandleDateTime = Object.keys(_candleListByDateTimeRecord)
			.sort((a, b) => {
				return a.localeCompare(b);
			});

		let startDateTime = marketCandleDateTime[0];
		let endDateTime = marketCandleDateTime[marketCandleDateTime.length - 1];

		if (_aiInferenceByDateTimeRecord) {
			const aiInferenceEndDate = Object.keys(_aiInferenceByDateTimeRecord)
				.reduce((acc, item) => {
					return acc.localeCompare(item) > 0 ? acc : item;
				});

			endDateTime = aiInferenceEndDate.localeCompare(endDateTime) > 0 ? aiInferenceEndDate : endDateTime;
		}

		if (_prophetInferenceByDateTimeRecord) {
			const prophetInferenceEndDate = Object.keys(_prophetInferenceByDateTimeRecord)
				.reduce((acc, item) => {
					return acc.localeCompare(item) > 0 ? acc : item;
				});

			endDateTime = prophetInferenceEndDate.localeCompare(endDateTime) > 0 ? prophetInferenceEndDate : endDateTime;
		}

		return CurrentDateUtils.getDateTimeList(
			startDateTime,
			endDateTime,
			_eChartCandleUnit
		);
	}

	async function getSeriesOptionList(dateTimeList: string[]) {

		let seriesIndex = 1;

		const seriesData: {
			itemNameList: string[],
			seriesList: echarts.SeriesOption[]
		} = {
			itemNameList: [],
			seriesList: []
		};

		let decimalDepth = 0;

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

			if (tradeDecimalDepth > decimalDepth) {
				decimalDepth = tradeDecimalDepth;
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

			seriesIndex += maSeriesOptionList.length;
		}

		if (_aiInferenceByDateTimeRecord) {

			const candleData: EChartCandlestickSeriesData[] = dateTimeList.map((dateTime) => {

				if (!_aiInferenceByDateTimeRecord || !_aiInferenceByDateTimeRecord[dateTime]) {
					return {
						openingPrice: NaN,
						highPrice: NaN,
						lowPrice: NaN,
						tradePrice: NaN
					};
				}

				const inference = _aiInferenceByDateTimeRecord[dateTime];

				return {
					openingPrice: inference.openPrice,
					highPrice: inference.highPrice,
					lowPrice: inference.lowPrice,
					tradePrice: inference.closePrice
				};
			});

			const inferenceCandleName = 'AI 예상';

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

			seriesIndex += 1;
		}

		if (_prophetInferenceByDateTimeRecord) {
			const itemName = '시계열 예측';

			const dataListUp = [];
			const dataList = [];
			const dataListLow = [];

			for (let dateTime of dateTimeList) {
				if (!_prophetInferenceByDateTimeRecord || !_prophetInferenceByDateTimeRecord[dateTime]) {
					dataListUp.push(NaN);
					dataList.push(NaN);
					dataListLow.push(NaN);
					continue;
				}

				dataListUp.push(CurrentNumberUtils.ceilPrice(
					_prophetInferenceByDateTimeRecord[dateTime].yhatUpper,
					decimalDepth
				));
				dataList.push(CurrentNumberUtils.ceilPrice(
					_prophetInferenceByDateTimeRecord[dateTime].yhat,
					decimalDepth
				));
				dataListLow.push(CurrentNumberUtils.ceilPrice(
					_prophetInferenceByDateTimeRecord[dateTime].yhatLower,
					decimalDepth
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

			seriesIndex += 1;

			if (_eChartProphetInferenceUpYn) {
				const itemNameUp = '시계열 예측 Up';
				const prophetInferenceSeriesOptionUp = EChartsOptionUtils.getLineSeriesOption(
					itemNameUp,
					dataListUp,
					0,
					0,
					'#FF0000'
				);

				seriesData.itemNameList.push(itemNameUp);
				seriesData.seriesList.push(prophetInferenceSeriesOptionUp);

				seriesIndex += 1;
			}

			if (_eChartProphetInferenceLowYn) {
				const itemNameLow = '시계열 예측 Low';
				const prophetInferenceSeriesOptionLow = EChartsOptionUtils.getLineSeriesOption(
					itemNameLow,
					dataListLow,
					0,
					0,
					'#0000FF'
				);

				seriesData.itemNameList.push(itemNameLow);
				seriesData.seriesList.push(prophetInferenceSeriesOptionLow);

				seriesIndex += 1;
			}
		}

		let axisIndex = 0;

		if (_eChartIndicator.Volume.openYn) {
			axisIndex += 1;

			_eChartIndicator.Volume.seriesIndex = seriesIndex;

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

			seriesIndex += 1;
		}

		if (_eChartIndicator.ATR.openYn) {
			axisIndex += 1;

			_eChartIndicator.ATR.seriesIndex = seriesIndex;

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

			const atrPeriod = 14;

			const atrSeriesOption = await EChartsOptionUtils.getATRSeriesOption(
				dataListInList,
				atrPeriod,
				axisIndex
			);

			seriesData.seriesList.push(atrSeriesOption);

			seriesIndex += 1;
		}

		if (_eChartIndicator.PriceRate.openYn) {
			axisIndex += 1;

			_eChartIndicator.PriceRate.seriesIndex = seriesIndex;

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

			seriesIndex += 1;
		}

		if (_eChartIndicator.MACD.openYn) {
			axisIndex += 1;

			_eChartIndicator.MACD.seriesIndex = seriesIndex;

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
				'#FF0000',
				'#0000FF'
			);

			seriesData.seriesList.push(...macdLineSeriesOption);

			seriesIndex += macdLineSeriesOption.length;
		}

		if (_eChartIndicator.RSI.openYn) {
			axisIndex += 1;

			_eChartIndicator.RSI.seriesIndex = seriesIndex;

			const tradePriceList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const rsiPeriod = 14;
			const signalPeriod = 9;
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

			seriesIndex += rsiSeriesOption.length;
		}

		if (_eChartIndicator.Stochastic.openYn) {
			axisIndex += 1;

			_eChartIndicator.Stochastic.seriesIndex = seriesIndex;

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

			seriesIndex += stochasticSeriesOption.length;
		}

		if (_eChartIndicator.StochasticRSI.openYn) {
			axisIndex += 1;

			_eChartIndicator.StochasticRSI.seriesIndex = seriesIndex;

			const dataList = dateTimeList.map((dateTime) => {
				const candleData = _candleListByDateTimeRecord[dateTime];

				if (!candleData) {
					return NaN;
				}

				return candleData.tradePrice;
			});

			const stochasticRSIItemName = 'RSI';
			const stochasticKItemName = '%K';
			const stochasticDItemName = '%D';
			const rsiPeriod = 14;
			const stochasticPeriod = 14;
			const kPeriod = 3;
			const dPeriod = 3;

			const stochasticSeriesOption = await EChartsOptionUtils.getStochasticRSISeriesOption(
				stochasticRSIItemName,
				stochasticKItemName,
				stochasticDItemName,
				dataList,
				rsiPeriod,
				stochasticPeriod,
				kPeriod,
				dPeriod,
				axisIndex
			);

			seriesData.seriesList.push(...stochasticSeriesOption);

			seriesIndex += stochasticSeriesOption.length;
		}

		return seriesData;
	}

	async function getVisualMapOption(): Promise<echarts.VisualMapComponentOption[]> {
		const visualMap: echarts.VisualMapComponentOption[] = [];

		if (_eChartIndicator.Volume.openYn && _eChartIndicator.Volume.seriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOption(_eChartIndicator.Volume.seriesIndex));
		}

		if (_eChartIndicator.PriceRate.openYn && _eChartIndicator.PriceRate.seriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOptionPriceRate(_eChartIndicator.PriceRate.seriesIndex));
		}

		if (_eChartIndicator.MACD.openYn && _eChartIndicator.MACD.seriesIndex > -1) {
			visualMap.push(EChartsOptionUtils.getVisualMapOptionByMACD(_eChartIndicator.MACD.seriesIndex));
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

	function onclickProphetInferenceUpYn() {
		_eChartProphetInferenceUpYn = !_eChartProphetInferenceUpYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickProphetInferenceLowYn() {
		_eChartProphetInferenceLowYn = !_eChartProphetInferenceLowYn;
		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickMaYn() {
		_eChartIndicator.MA.openYn = !_eChartIndicator.MA.openYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickAccTradeVolumeYn() {
		_eChartIndicator.Volume.openYn = !_eChartIndicator.Volume.openYn;
		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickATRYn() {
		_eChartIndicator.ATR.openYn = !_eChartIndicator.ATR.openYn;
		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickPriceRateYn() {
		_eChartIndicator.PriceRate.openYn = !_eChartIndicator.PriceRate.openYn;
		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickMACDYn() {
		_eChartIndicator.MACD.openYn = !_eChartIndicator.MACD.openYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickRSIYn() {
		_eChartIndicator.RSI.openYn = !_eChartIndicator.RSI.openYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickStochasticYn() {
		_eChartIndicator.Stochastic.openYn = !_eChartIndicator.Stochastic.openYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
	}

	function onclickStochasticRSIYn() {
		_eChartIndicator.StochasticRSI.openYn = !_eChartIndicator.StochasticRSI.openYn;

		if (_eCharts) {
			setEChartsData(_eCharts);
		}
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
			marketInfo.market,
			_eChartCandleUnit,
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
			const candleDateTime = UPBitCandleTimeZones.utc === _eChartCandleTimeZone ?
				item.candleDateTimeUtc :
				item.candleDateTimeKst;

			const dateTime = CurrentDateUtils.convertFormat(
				candleDateTime,
				_eChartDateTimeFormat
			);

			_candleListByDateTimeRecord[dateTime] = item;
		});

		if (_eCharts) {
			await setEChartsData(_eCharts);
		}
	}

	function onclickEChartCandleUnit(candleUnitEnum: UPBitCandleUnitCodeData) {
		_eChartCandleUnitDropdownOpenYn = !_eChartCandleUnitDropdownOpenYn;
		_eChartCandleUnit = candleUnitEnum.key;
		_eChartCandleUnitName = candleUnitEnum.name;

		mount();
	}
</script>


<div class="flex flex-col w-full h-full">
	<div class="flex w-full items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
		<ButtonGroup class="h-full px-2 py-0 gap-2 shadow-none"
								 color="none">
			<Button
				color="none"
				id="_eChartCandleUnit"
				class="p-0 focus:ring-0">
				<div class="text-[12px] leading-none">
					{_eChartCandleUnitName}
				</div>
				<ChevronDownIcon class="w-3 h-3 ml-1"
												 strokeWidth={3} />
			</Button>
			<Dropdown
				bind:open={_eChartCandleUnitDropdownOpenYn}>
				{#each Object.values(UPBitCandleUnitEnum) as item}
					<DropdownItem onclick={() => onclickEChartCandleUnit(item)}>
						<div class="w-full text-[12px] items-center text-start leading-none">
							{item.name}
						</div>
					</DropdownItem>
				{/each}
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
				<DropdownItem
					class={_eChartIndicator.MA.openYn ? 'border border-green-500' : ''}
					onclick={onclickMaYn}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						{_eChartIndicator.MA.chartName}
					</div>
				</DropdownItem>
				<DropdownItem
					class={_eChartProphetInferenceUpYn ? 'border border-green-500' : ''}
					onclick={onclickProphetInferenceUpYn}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						Prophet 예측 UP
					</div>
				</DropdownItem>
				<DropdownItem
					class={_eChartProphetInferenceLowYn ? 'border border-green-500' : ''}
					onclick={onclickProphetInferenceLowYn}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						Prophet 예측 Low
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
					class={_eChartIndicator.ATR.openYn ? 'border border-green-500' : ''}
					onclick={onclickATRYn}>
					<div class="w-full text-[12px] items-center text-start leading-none">
						{_eChartIndicator.ATR.chartName}
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
		</ButtonGroup>
		<div class="inline-flex items-center gap-2">
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