<script lang="ts">

	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		MarketCurrencyCode,
		MarketCurrencyTypeUtils
	} from '$lib/common/enums/MarketCurrencyType';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import {
		Button,
		Input,
		TabItem,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Tabs
	} from 'flowbite-svelte';
	import { SettingsIcon } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import {
		tradeIndicatorTableIndicatorValueStore,
		tradeIndicatorTableSortValueStore
	} from '$lib/stores/ConfigStore';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type {
		TickerCalculationData,
		TickerData
	} from '$lib/common/models/TickerData';
	import { TickerWebApi } from '$lib/web/request/TickerWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		currentMarketCodeStore,
		tickerCalculationStore,
		tickerListStore
	} from '$lib/stores/MarketStore';
	import type { IndicatorAnalyzeData } from '$lib/common/models/TechnicalIndicatorData';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import Decimal from 'decimal.js';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import {
		CaretDownSolid,
		CaretSortSolid,
		CaretUpSolid,
		SortHorizontalOutline
	} from 'flowbite-svelte-icons';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { OrderBuyData } from '$lib/common/models/OrderData';
	import { orderBuyStore } from '$lib/stores/OrderStore';
	import {
		type NumberUnitEnum,
		NumberUnitEnumUtils
	} from '$lib/common/enums/NumberUnitEnum';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import moment from 'moment/moment';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';
	import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import type { AiLatestInferenceData } from '$lib/common/models/AiResponsesData';
	import type { TradeMarketPriceIndicatorData } from '$lib/common/models/TradeViewData';
	import TradeMarketPriceIndicatorConfigComponent
		from '$lib/web/components/trade/TradeMarketPriceIndicatorConfigComponent.svelte';

	interface MarketAndTradeData {
		market: string;
		searchTarget: string;
		tradeIndicator: TradeIndicatorData;
		prophetList: ProphetAnalyticsItemData[];
		aiList: AiAnalyticsItemData[];
	}

	interface TradeIndicatorData {
		market: string;
		koreanName: string;
		englishName: string;
		dateTime: string;
		decimalPlace: number;
		openingPrice: number;
		highPrice: number;
		lowPrice: number;
		closePrice: number;
		volume: number;
		volumePrice: number;
		diffRate: number;
		diffPrice: number;
		highOpeningRate: number;
		highOpeningPrice: number;
		indicatorFinalScore: number;
		indicatorAvgScore: number;
		maScore: number;
		rsiScore: number;
		macdScore: number;
		stochasticScore: number;
		stochasticRSIScore: number;
		bollingerBandScore: number;
		marketCondition: string;
		indicatorInterpretationSignal: string;
		indicatorInterpretationStrength: string;
		indicatorInterpretationRecommendation: string;
	}

	interface ProphetAnalyticsItemData {
		dateTime: string;
		inferencePrice: number;
		diffRate: number;
		errorRateAvg: number;
		positiveErrorRateAvg: number;
		negativeErrorRateAvg: number;
		scoreRate: number;
	}

	interface AiAnalyticsItemData {
		dateTime: string;
		price: number;
		diffRate: number;
		diffPrice: number;
	}

	const sortType = {
		tradePrice: 'tradePrice',
		diffRate: 'diffRate',
		volumePrice: 'volumePrice',
		highOpenRate: 'highOpenRate',
		prophet: 'prophet',
		ai: 'ai',
		technicalIndicatorFinalScore: 'technicalIndicatorFinalScore',
		maScore: 'maScore',
		macdScore: 'macdScore',
		rsiScore: 'rsiScore',
		stochasticScore: 'stochasticScore',
		stochasticRSIScore: 'stochasticRSIScore',
		bollingerBandScore: 'bollingerBandScore'
	};

	let {
		marketInfoList
	}: {
		marketInfoList: MarketInfoData[],
	} = $props();

	let _marketCurrencyCode: string = $state(MarketCurrencyCode.KRW.code);
	let _searchMarket: string = $state('');
	let _koreanNameYn: boolean = $state(true);
	let _onMountYn: boolean = $state(false);
	let _candleUnit: string = $state(UPBitCandleUnitEnum.days.key);

	let _sortValue: {
		type: string,
		acsDesc: boolean
	} = $state({
		type: sortType.diffRate,
		acsDesc: false
	});

	let _indicatorValue = $state({
		macd: {
			fastPeriod: 12,
			slowPeriod: 26,
			signalPeriod: 9
		},
		rsi: {
			period: 14,
			signalPeriod: 9
		},
		stochastic: {
			period: 14,
			signalPeriod: 3,
			maPeriod: 3
		},
		stochasticRSI: {
			rsiPeriod: 14,
			stochasticPeriod: 14,
			signalPeriod: 3,
			maPeriod: 3
		},
		prophetIndex: 2,
		aiIndex: 1,
		prophetDate: CurrentDateUtils.getNowDateString(),
		aiDate: CurrentDateUtils.getNowDateString()
	}) as TradeMarketPriceIndicatorData;

	let _marketInfoList: MarketInfoData[] = $state([]);
	let _tickerByMarketRecord: Record<string, TickerData> = $state({});
	let _candleIndicatorAnalyzeByMarketRecord: Record<string, IndicatorAnalyzeData> = $state({});
	let _prophetAnalyticsItemListByMarketRecord: Record<string, ProphetAnalyticsItemData[]> = $state({});
	let _aiAnalyticsItemListByMarketRecord: Record<string, AiAnalyticsItemData[]> = $state({});

	let _marketAndTradeDataList: MarketAndTradeData[] = $state([]);

	let _indicatorConfigModalOpenYn: boolean = $state(false);

	onMount(async () => {
		await restoreConfig();
		await initData();
	});

	$effect(() => {
		const tickerInterval = setInterval(() => {
			if (!_onMountYn) {
				return;
			}

			intervalUpdateByTickerList();
		}, 1000);

		return () => clearInterval(tickerInterval);
	});

	onDestroy(async () => {
		await clearPriceData();
	});

	async function clearPriceData() {
		_tickerByMarketRecord = {};
		_candleIndicatorAnalyzeByMarketRecord = {};
		_prophetAnalyticsItemListByMarketRecord = {};
		_aiAnalyticsItemListByMarketRecord = {};
		_marketAndTradeDataList = [];
	}

	async function initData() {
		await clearPriceData();

		await Promise.all([
			setMarketInfoList(),
			setTickerByMarketRecord(),
			setCandleTechnicalIndicatorAnalyze(),
			setProphetAnalyticsItemListByMarketRecord(),
			setAiAnalyticsItemListByMarketRecord(),
		]);

		await updateTradeIndicatorDataListByMarketList();
		await sortTradeIndicatorDataListByMarketList();

		_onMountYn = true;
	}

	async function restoreConfig() {
		if (!browser) {
			return;
		}

		if ($tradeIndicatorTableSortValueStore) {
			_sortValue = JSON.parse($tradeIndicatorTableSortValueStore);
		}

		if ($tradeIndicatorTableIndicatorValueStore) {
			_indicatorValue = JSON.parse($tradeIndicatorTableIndicatorValueStore);
		}
	}

	async function setMarketInfoList() {
		if (marketInfoList.length) {
			_marketInfoList = marketInfoList
				.filter(marketInfo => marketInfo.market.startsWith(_marketCurrencyCode));
		} else {
			_marketInfoList = [];
		}
	}

	async function setTickerByMarketRecord() {

		const responseObject: ResponseObject<TickerData[]> =
			await TickerWebApi.getTickerAll(_marketCurrencyCode);

		if (ResponseCode.success.code !== responseObject.code) {
			return {} as Record<string, TickerData>;
		}

		const tickerList: TickerData[] = responseObject.data as TickerData[];

		tickerListStore.set(tickerList);

		_tickerByMarketRecord = tickerList.reduce((acc, item) => {
			acc[item.market] = item;

			return acc;
		}, {} as Record<string, TickerData>);
	}

	async function setCandleTechnicalIndicatorAnalyze() {
		const responseObject: ResponseObject<unknown> =
			await CandleWebApi.getCandleTechnicalIndicatorAnalyze(
				_marketCurrencyCode
			);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const indicatorAnalyzeList: IndicatorAnalyzeData[] = responseObject.data as IndicatorAnalyzeData[];

		if (!indicatorAnalyzeList.length) {
			return;
		}

		_candleIndicatorAnalyzeByMarketRecord = indicatorAnalyzeList.reduce((acc, item) => {
			acc[item.market] = item;

			return acc;
		}, {} as Record<string, IndicatorAnalyzeData>);
	}

	async function setProphetAnalyticsItemListByMarketRecord() {
		const startDate = moment()
			.add(-1, 'days')
			.utc()
			.format(CurrentDateUtils.dateFormat);
		const filteredDate = moment()
			.utc()
			.format(CurrentDateUtils.dateFormat + ' 00:00:00');

		const responseObject: ResponseObject<unknown> =
			await ProphetAnalyticsWebApi.getLatestProphetAnalyticsResultList(
				_marketCurrencyCode,
				_candleUnit,
				UPBitCandleTimeZones.utc,
				ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key,
				startDate
			);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const resultAndItemList = responseObject.data as ProphetAnalyticsResultAndItemData[];

		if (!resultAndItemList.length) {
			return;
		}

		_prophetAnalyticsItemListByMarketRecord = resultAndItemList
			.filter((item) => item.resultItemList && item.resultItemList.length)
			.reduce((acc, item) => {

				const sortedResultItemList = item.resultItemList
					.sort((a, b) => a.ds.localeCompare(b.ds));

				let startPrice = sortedResultItemList[0].yhat;

				acc[item.result.market] = sortedResultItemList
					.filter((item) => item.ds.localeCompare(filteredDate) >= 0)
					.map((resultItem) => {
						const diffRate = CurrentNumberUtils.calculateRate(resultItem.yhat, startPrice);

						return {
							dateTime: moment(resultItem.ds)
								.format(CurrentDateUtils.dateFormat),
							inferencePrice: resultItem.yhat,
							diffRate: diffRate,
							errorRateAvg: item.result.errorRateAvg || 0,
							positiveErrorRateAvg: item.result.positiveErrorRateAvg || 0,
							negativeErrorRateAvg: item.result.negativeErrorRateAvg || 0,
							scoreRate: diffRate * (100 - (item.result.errorRateAvg || 0))
						};
					});

				return acc;
			}, {} as Record<string, ProphetAnalyticsItemData[]>);
	}

	async function setAiAnalyticsItemListByMarketRecord() {
		const responseObject: ResponseObject<unknown> = await AiAnalyticsWebApi.getAiLatestInferenceList(
			_marketCurrencyCode,
			'',
			_candleUnit,
			UPBitCandleTimeZones.utc,
			false
		);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const aiLatestInferenceList = responseObject.data as AiLatestInferenceData[];

		_aiAnalyticsItemListByMarketRecord = aiLatestInferenceList.reduce((acc, item) => {
			if (!acc[item.market]) {
				acc[item.market] = [];
			}

			acc[item.market].push({
				dateTime: moment(item.dateTime)
					.format(CurrentDateUtils.dateFormat),
				price: Number(item.closePrice),
				diffRate: CurrentNumberUtils.calculateRate(item.closePrice, item.openPrice),
				diffPrice: CurrentNumberUtils.subtractPrice(item.closePrice, item.openPrice)
			});

			acc[item.market].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

			return acc;
		}, {} as Record<string, AiAnalyticsItemData[]>);
	}

	async function updateTradeIndicatorDataListByMarketList() {

		const list = await Promise.all(
			_marketInfoList.map(async (marketInfo) => {
				const candleIndicatorAnalyze = _candleIndicatorAnalyzeByMarketRecord[marketInfo.market];
				const tickerData = _tickerByMarketRecord[marketInfo.market];

				if (!tickerData) {
					return null;
				}

				const tradeIndicatorData = await createTradeIndicatorDataList(
					marketInfo,
					tickerData,
					candleIndicatorAnalyze
				);

				return {
					market: marketInfo.market,
					searchTarget: marketInfo.market + marketInfo.koreanName + marketInfo.englishName,
					tradeIndicator: tradeIndicatorData,
					prophetList: _prophetAnalyticsItemListByMarketRecord[marketInfo.market] || [],
					aiList: _aiAnalyticsItemListByMarketRecord[marketInfo.market] || [],
				};
			}));

		_marketAndTradeDataList = list.filter(item => item) as MarketAndTradeData[];
	}

	async function createTradeIndicatorDataList(
		marketInfo: MarketInfoData,
		tickerData: TickerData,
		candleIndicatorAnalyze?: IndicatorAnalyzeData
	): Promise<TradeIndicatorData> {

		if (!tickerData.tradePrice) {
			return {
				market: marketInfo.market,
				koreanName: marketInfo.koreanName,
				englishName: marketInfo.englishName,
				dateTime: tickerData.tradeDateKst,
				decimalPlace: NaN,
				openingPrice: NaN,
				highPrice: NaN,
				lowPrice: NaN,
				closePrice: NaN,
				volume: NaN,
				volumePrice: NaN,
				diffRate: NaN,
				diffPrice: NaN,
				highOpeningRate: NaN,
				highOpeningPrice: NaN,
				indicatorFinalScore: NaN,
				indicatorAvgScore: NaN,
				maScore: NaN,
				rsiScore: NaN,
				macdScore: NaN,
				stochasticScore: NaN,
				stochasticRSIScore: NaN,
				bollingerBandScore: NaN,
				marketCondition: '',
				indicatorInterpretationSignal: '',
				indicatorInterpretationStrength: '',
				indicatorInterpretationRecommendation: ''
			};
		}

		const decimalPlace = new Decimal(tickerData.tradePrice).dp();

		const diffResult = await getDiffResultByTickerData(tickerData);

		return {
			market: marketInfo.market,
			koreanName: marketInfo.koreanName,
			englishName: marketInfo.englishName,
			dateTime: tickerData.tradeDateKst,
			decimalPlace: decimalPlace,
			openingPrice: tickerData.openingPrice,
			highPrice: tickerData.highPrice,
			lowPrice: tickerData.lowPrice,
			closePrice: tickerData.tradePrice,
			volume: tickerData.accTradeVolume,
			volumePrice: tickerData.accTradePrice,
			diffRate: diffResult.diffRate,
			diffPrice: diffResult.diffPrice,
			highOpeningRate: diffResult.highOpeningRate,
			highOpeningPrice: diffResult.highOpeningPrice,
			indicatorFinalScore: candleIndicatorAnalyze?.finalScore || 0,
			indicatorAvgScore: candleIndicatorAnalyze?.avgScore || 0,
			maScore: candleIndicatorAnalyze?.individualScore?.ma || NaN,
			rsiScore: candleIndicatorAnalyze?.individualScore?.rsi || NaN,
			macdScore: candleIndicatorAnalyze?.individualScore?.macd || NaN,
			stochasticScore: candleIndicatorAnalyze?.individualScore?.stochastic || NaN,
			stochasticRSIScore: candleIndicatorAnalyze?.individualScore?.stochasticRsi || NaN,
			bollingerBandScore: candleIndicatorAnalyze?.individualScore?.bollingerBand || NaN,
			marketCondition: candleIndicatorAnalyze?.marketCondition?.marketCondition || '',
			indicatorInterpretationSignal: candleIndicatorAnalyze?.interpretation?.signal || '',
			indicatorInterpretationStrength: candleIndicatorAnalyze?.interpretation?.strength || '',
			indicatorInterpretationRecommendation: candleIndicatorAnalyze?.interpretation?.recommendation || ''
		};
	}

	async function getDiffResultByTickerData(
		tickerData: TickerData
	) {
		const result = await Promise.all([
			CurrentNumberUtils.calculateRate(tickerData.tradePrice, tickerData.openingPrice),
			CurrentNumberUtils.subtractPrice(tickerData.tradePrice, tickerData.openingPrice),
			CurrentNumberUtils.calculateRate(tickerData.highPrice, tickerData.openingPrice),
			CurrentNumberUtils.subtractPrice(tickerData.highPrice, tickerData.openingPrice)
		]);

		return {
			diffRate: result[0],
			diffPrice: result[1],
			highOpeningRate: result[2],
			highOpeningPrice: result[3]
		};
	}

	async function sortTradeIndicatorDataListByMarketList() {
		_marketAndTradeDataList.sort((beforeItem: MarketAndTradeData, currentItem: MarketAndTradeData) => {
			switch (_sortValue.type) {
				case sortType.tradePrice: {
					const beforeTrade = beforeItem.tradeIndicator;
					const currentTrade = currentItem.tradeIndicator;

					return _sortValue.acsDesc ?
						beforeTrade.closePrice - currentTrade.closePrice :
						currentTrade.closePrice - beforeTrade.closePrice;
				}
				case sortType.diffRate: {
					const beforeTrade = beforeItem.tradeIndicator;
					const currentTrade = currentItem.tradeIndicator;

					return _sortValue.acsDesc ?
						beforeTrade.diffRate - currentTrade.diffRate :
						currentTrade.diffRate - beforeTrade.diffRate;
				}
				case sortType.volumePrice: {
					const beforeTrade = beforeItem.tradeIndicator;
					const currentTrade = currentItem.tradeIndicator;

					return _sortValue.acsDesc ?
						beforeTrade.volumePrice - currentTrade.volumePrice :
						currentTrade.volumePrice - beforeTrade.volumePrice;
				}
				case sortType.highOpenRate: {
					const beforeTrade = beforeItem.tradeIndicator;
					const currentTrade = currentItem.tradeIndicator;

					return _sortValue.acsDesc ?
						beforeTrade.highOpeningRate - currentTrade.highOpeningRate :
						currentTrade.highOpeningRate - beforeTrade.highOpeningRate;
				}
				case sortType.prophet: {
					const beforeProphet = beforeItem.prophetList.find((item) => item.dateTime === _indicatorValue.prophetDate);
					const currentProphet = currentItem.prophetList.find((item) => item.dateTime === _indicatorValue.prophetDate);

					if (!beforeProphet || !currentProphet) {
						return beforeProphet ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeProphet.scoreRate - currentProphet.scoreRate :
						currentProphet.scoreRate - beforeProphet.scoreRate;
				}
				case sortType.ai: {
					const beforeAi = beforeItem.aiList.find((item) => item.dateTime === _indicatorValue.aiDate);
					const currentAi = currentItem.aiList.find((item) => item.dateTime === _indicatorValue.aiDate);
					// const beforeAi = beforeItem.aiList[_indicatorValue.aiIndex];
					// const currentAi = currentItem.aiList[_indicatorValue.aiIndex];

					if (!beforeAi || !currentAi) {
						return beforeAi ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeAi.diffRate - currentAi.diffRate :
						currentAi.diffRate - beforeAi.diffRate;
				}
				case sortType.technicalIndicatorFinalScore: {
					const beforeMACD = beforeItem.tradeIndicator.indicatorFinalScore;
					const currentMACD = currentItem.tradeIndicator.indicatorFinalScore;

					if (!beforeMACD || !currentMACD) {
						return beforeMACD ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeMACD - currentMACD :
						currentMACD - beforeMACD;
				}
				case sortType.maScore: {
					const beforeMACD = beforeItem.tradeIndicator.maScore;
					const currentMACD = currentItem.tradeIndicator.maScore;

					if (!beforeMACD || !currentMACD) {
						return beforeMACD ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeMACD - currentMACD :
						currentMACD - beforeMACD;
				}
				case sortType.macdScore: {
					const beforeMACD = beforeItem.tradeIndicator.macdScore;
					const currentMACD = currentItem.tradeIndicator.macdScore;

					if (!beforeMACD || !currentMACD) {
						return beforeMACD ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeMACD - currentMACD :
						currentMACD - beforeMACD;
				}
				case sortType.rsiScore: {
					const beforeRSI = beforeItem.tradeIndicator.rsiScore;
					const currentRSI = currentItem.tradeIndicator.rsiScore;

					if (!beforeRSI || !currentRSI) {
						return beforeRSI ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeRSI - currentRSI :
						currentRSI - beforeRSI;
				}
				case sortType.stochasticScore: {
					const beforeStochastic = beforeItem.tradeIndicator.stochasticScore;
					const currentStochastic = currentItem.tradeIndicator.stochasticScore;

					if (!beforeStochastic || !currentStochastic) {
						return beforeStochastic ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeStochastic - currentStochastic :
						currentStochastic - beforeStochastic;
				}
				case sortType.stochasticRSIScore: {
					const beforeStochasticRSI = beforeItem.tradeIndicator.stochasticRSIScore;
					const currentStochasticRSI = currentItem.tradeIndicator.stochasticRSIScore;

					if (!beforeStochasticRSI || !currentStochasticRSI) {
						return beforeStochasticRSI ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeStochasticRSI - currentStochasticRSI :
						currentStochasticRSI - beforeStochasticRSI;
				}
				case sortType.bollingerBandScore: {
					const beforeBollingerBand = beforeItem.tradeIndicator.bollingerBandScore;
					const currentBollingerBand = currentItem.tradeIndicator.bollingerBandScore;

					if (!beforeBollingerBand || !currentBollingerBand) {
						return beforeBollingerBand ? -1 : 1;
					}

					return _sortValue.acsDesc ?
						beforeBollingerBand - currentBollingerBand :
						currentBollingerBand - beforeBollingerBand;
				}
				default:
					return 0;
			}
		});
	}

	async function intervalUpdateByTickerList() {
		if (!_onMountYn || !$tickerListStore) {
			return;
		}

		await Promise.all([
			await setTickerByMarketRecord(),
			await setCandleTechnicalIndicatorAnalyze()
		]);

		const marketInfoRecord = _marketInfoList.reduce((acc, item) => {
			acc[item.market] = item;
			return acc;
		}, {} as Record<string, MarketInfoData>);

		for (const item of _marketAndTradeDataList) {
			const marketInfo = marketInfoRecord[item.market];
			const candleIndicatorAnalyze = _candleIndicatorAnalyzeByMarketRecord[item.market];
			const tickerData = _tickerByMarketRecord[item.market];

			if (!tickerData) {
				continue;
			}

			const tradeIndicatorData = await createTradeIndicatorDataList(
				marketInfo,
				tickerData,
				candleIndicatorAnalyze
			);

			item.tradeIndicator = tradeIndicatorData;

			if ($currentMarketCodeStore === item.market) {
				await updateTickerCalculationStore(tradeIndicatorData);
			}
		}
	}

	async function onclickMarketCurrencyTab(marketCurrencyCode: string) {
		_marketCurrencyCode = marketCurrencyCode;

		await initData();
	}

	function onclickMarket(tradeIndicator: TradeIndicatorData) {

		updateOrderBuyStore(tradeIndicator);

		updateTickerCalculationStore(tradeIndicator)
			.then(() => {
				currentMarketCodeStore.set(tradeIndicator.market);

				const url = page.url.pathname + '?code=' + tradeIndicator.market;

				goto(url);
			});
	}

	function updateOrderBuyStore(tradeIndicator: TradeIndicatorData) {
		const orderBuyData: OrderBuyData = {
			market: tradeIndicator.market,
			orderBuyPrice: tradeIndicator.closePrice,
			orderBuyCount: 0,
			priceDecimalPlace: tradeIndicator.decimalPlace
		} as OrderBuyData;

		orderBuyStore.set(orderBuyData);
	}

	async function updateTickerCalculationStore(tradeIndicator: TradeIndicatorData) {
		const ticker: TickerData = _tickerByMarketRecord[tradeIndicator.market];

		const tickerCalculationData: TickerCalculationData = {
			market: tradeIndicator.market,
			koreanName: tradeIndicator.koreanName,
			englishName: tradeIndicator.englishName,
			decimalDepth: tradeIndicator.decimalPlace,
			openingPrice: ticker.openingPrice,
			highPrice: ticker.highPrice,
			lowPrice: ticker.lowPrice,
			tradePrice: ticker.tradePrice,
			diffRate: tradeIndicator.diffRate,
			diffPrice: tradeIndicator.diffPrice,
			accTradePrice: ticker.accTradePrice,
			accTradePrice24h: ticker.accTradePrice24h,
			accTradeVolume: ticker.accTradeVolume,
			accTradeVolume24h: ticker.accTradeVolume24h
		};

		tickerCalculationStore.set(tickerCalculationData);
	}

	function onclickKoreanName() {
		_koreanNameYn = !_koreanNameYn;
	}

	function onclickTradePriceSort() {
		if (_sortValue.type === sortType.tradePrice) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.tradePrice;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickDiffRateSort() {
		if (_sortValue.type === sortType.diffRate) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.diffRate;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickVolumePriceSort() {
		if (_sortValue.type === sortType.volumePrice) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.volumePrice;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickHighOpeningRateSort() {
		if (_sortValue.type === sortType.highOpenRate) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.highOpenRate;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickTechnicalIndicatorFinalScoreSort() {
		if (_sortValue.type === sortType.technicalIndicatorFinalScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.technicalIndicatorFinalScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickProphetAnalyticsInferenceSort() {
		if (_sortValue.type === sortType.prophet) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.prophet;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickAiAnalyticsSort() {
		if (_sortValue.type === sortType.ai) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.ai;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickMAScoreSort() {
		if (_sortValue.type === sortType.maScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.maScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickMACDScoreSort() {
		if (_sortValue.type === sortType.macdScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.macdScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickRSIScoreSort() {
		if (_sortValue.type === sortType.rsiScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.rsiScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickStochasticScoreSort() {
		if (_sortValue.type === sortType.stochasticScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.stochasticScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickStochasticRSIScoreSort() {
		if (_sortValue.type === sortType.stochasticRSIScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.stochasticRSIScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function onclickBollingerBandScoreSort() {
		if (_sortValue.type === sortType.bollingerBandScore) {
			_sortValue.acsDesc = !_sortValue.acsDesc;
		} else {
			_sortValue.acsDesc = false;
		}

		_sortValue.type = sortType.bollingerBandScore;

		sortTradeIndicatorDataListByMarketList();
	}

	function getFilteredMarketAndTradeList() {

		if (_marketAndTradeDataList.length === 0) {
			return [];
		}

		if (!_searchMarket) {
			return _marketAndTradeDataList;
		}

		const regExp = new RegExp(_searchMarket, 'i');

		return _marketAndTradeDataList.filter((item) => {
			return regExp.exec(item.searchTarget);
		});
	}

	function updateIndicatorValueCallback(indicatorValue: TradeMarketPriceIndicatorData) {
		_indicatorValue = indicatorValue;

		if (browser) {
			tradeIndicatorTableIndicatorValueStore.set(JSON.stringify(_indicatorValue));
		}

		sortTradeIndicatorDataListByMarketList();
	}

	// utils

	function cutVolume(volume: number) {
		const numberUnit: NumberUnitEnum = NumberUnitEnumUtils.getNumberUnitEnum(volume);

		return CurrentNumberUtils.numberWithCommas(
			CurrentNumberUtils.divideCeil(volume, Number(numberUnit.value)),
			2
		) + numberUnit.unit;
	}

	function getBorderByCurrentMarket(tradeIndicator: TradeIndicatorData) {
		return $currentMarketCodeStore === tradeIndicator.market ?
			'border-separate border-y border-primary-500 bg-primary-100 dark:bg-primary-800' :
			'bg-white dark:bg-gray-800';
	}

	function getColorByDiffRate(tradeIndicator: TradeIndicatorData) {
		return tradeIndicator.diffRate > 0 ?
			'text-red-500' :
			tradeIndicator.diffRate < 0 ? 'text-blue-500' : 'text-gray-500';
	}

	function getColorByTechnicalIndicatorFinalScore(tradeIndicator: TradeIndicatorData) {
		if (isNaN(tradeIndicator.indicatorFinalScore)) {
			return 'text-gray-500';
		}

		return tradeIndicator.indicatorFinalScore >= 60 ?
			'text-red-500' : 'text-blue-500';
	}

	function getColorByIndicatorScore(indicatorScore: number) {
		if (isNaN(indicatorScore)) {
			return 'text-gray-500';
		}

		return indicatorScore > 50 ?
			'text-red-500' :
			indicatorScore < 50 ? 'text-blue-500' : 'text-gray-500';
	}

	function getColorByInferenceDiffRate(inferenceDiffRate: number) {
		return inferenceDiffRate > 0 ? 'text-red-500' : inferenceDiffRate < 0 ? 'text-blue-500' : 'text-gray-500';
	}
</script>


<Tabs
	class=""
	tabStyle="underline">

	<div class="flex w-full">
		<Input
			id="search-market"
			type="text"
			class="ps-10"
			placeholder="Search Market"
			bind:value={_searchMarket} />
		<Button
			class="p-2 focus:ring-0"
			onclick={() => _indicatorConfigModalOpenYn = true}
			color="light">
			<SettingsIcon
				class="w-5 h-5" />
		</Button>
	</div>

	{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
		<TabItem
			title={currencyType.name}
			open={_marketCurrencyCode === currencyType.code}
			onclick={() => onclickMarketCurrencyTab(currencyType.code)}
			data-sveltekit-preload-data="hover">
			{#if _marketAndTradeDataList.length}
				<Table
					divClass="relative table-fixed w-full h-[550px] scrollbar-hide overflow-auto">
					<TableHead defaultRow={false}
										 class="h-[40px]">
						<TableHeadCell
							class="min-w-28 px-2 items-center text-start text-nowrap sticky top-0 left-0 z-10 left-shadow bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickKoreanName}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								{_koreanNameYn ? '한글명' : '영문명'}
								<SortHorizontalOutline class="ms-1 w-4 h-4" />
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0  bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickTradePriceSort}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								현재가(시작가)
								{#if _sortValue.type === sortType.tradePrice}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0 bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickDiffRateSort}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								시작가대비
								{#if _sortValue.type === sortType.diffRate}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0 bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickVolumePriceSort}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								거래대금(UTC)
								{#if _sortValue.type === sortType.volumePrice}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0 bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickHighOpeningRateSort}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								고시비율
								{#if _sortValue.type === sortType.highOpenRate}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-32 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							padding="none"
							onclick={onclickProphetAnalyticsInferenceSort}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								P 분석
								{#if _sortValue.type === sortType.prophet}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickAiAnalyticsSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								AI 분석
								{#if _sortValue.type === sortType.ai}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickTechnicalIndicatorFinalScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								Score
								{#if _sortValue.type === sortType.technicalIndicatorFinalScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickMAScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								MA(5,15,30)
								{#if _sortValue.type === sortType.maScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickMACDScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								MACD
								{#if _sortValue.type === sortType.macdScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickRSIScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								RSI
								{#if _sortValue.type === sortType.rsiScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickStochasticScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								Stoch Slow
								{#if _sortValue.type === sortType.stochasticScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickStochasticRSIScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								Stoch RSI
								{#if _sortValue.type === sortType.stochasticRSIScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
						<TableHeadCell
							class="min-w-24 px-2 items-center text-end text-nowrap sticky top-0   bg-white dark:bg-gray-800"
							onclick={onclickBollingerBandScoreSort}
							padding="none">
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								BB
								{#if _sortValue.type === sortType.bollingerBandScore}
									{#if _sortValue.acsDesc}
										<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
									{:else}
										<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
									{/if}
								{:else}
									<CaretSortSolid class="ms-1 w-4 h-4" />
								{/if}
							</p>
						</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each getFilteredMarketAndTradeList() as item}
							{@const targetItem = item.tradeIndicator}
							{@const currentMarketBorder = getBorderByCurrentMarket(targetItem)}
							{@const diffColor = getColorByDiffRate(targetItem)}
							{@const finalScoreColor = getColorByTechnicalIndicatorFinalScore(targetItem)}
							{@const maColor = getColorByIndicatorScore(targetItem.maScore)}
							{@const macdColor = getColorByIndicatorScore(targetItem.macdScore)}
							{@const rsiColor = getColorByIndicatorScore(targetItem.rsiScore)}
							{@const stochColor = getColorByIndicatorScore(targetItem.stochasticScore)}
							{@const stochRSIColor = getColorByIndicatorScore(targetItem.stochasticRSIScore)}
							{@const prophet = item.prophetList.find((item) => item.dateTime === _indicatorValue.prophetDate)}
							{@const ai = item.aiList.find((item) => item.dateTime === _indicatorValue.aiDate)}
							<TableBodyRow class='h-[45px]'
														onclick={() => onclickMarket(targetItem)}>
								<TableBodyCell class="px-2 py-0 items-center sticky left-0 left-shadow {currentMarketBorder}">
									<p class="text-pretty text-[12px] font-medium leading-tight">
										{_koreanNameYn ? targetItem.koreanName : targetItem.englishName}
									</p>
									<p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
										{targetItem.market}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {diffColor} {currentMarketBorder}">
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.closePrice)}
											-
										{:else}
											{CurrentNumberUtils.numberWithCommas(targetItem.closePrice, targetItem.decimalPlace)}
										{/if}
									</p>
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.openingPrice)}
											-
										{:else}
											({CurrentNumberUtils.numberWithCommas(targetItem.openingPrice, targetItem.decimalPlace)})
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {diffColor} {currentMarketBorder}">
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.diffRate)}
											-
										{:else}
											{CurrentNumberUtils.ceilPrice(targetItem.diffRate, 2)}%
										{/if}
									</p>
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.diffPrice)}
											-
										{:else}
											{CurrentNumberUtils.numberWithCommas(targetItem.diffPrice, targetItem.decimalPlace)}
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {diffColor} {currentMarketBorder}">
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.volumePrice)}
											v: -
										{:else}
											v: {cutVolume(targetItem.volume)}
										{/if}
									</p>
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.volumePrice)}
											vp: -
										{:else}
											vp: {cutVolume(targetItem.volumePrice)}
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {currentMarketBorder}">
									<p class="text-[12px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.highOpeningRate)}
											-
										{:else}
											{CurrentNumberUtils.ceilPrice(targetItem.highOpeningRate, 2)}%
										{/if}
									</p>
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if isNaN(targetItem.highOpeningPrice)}
											-
										{:else}
											{CurrentNumberUtils.numberWithCommas(targetItem.highOpeningPrice, targetItem.decimalPlace)}
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {currentMarketBorder}">
									{#if prophet}
										{@const inferenceColor = getColorByInferenceDiffRate(prophet.diffRate)}
										<p class="text-[12px] text-wrap text-end font-semibold {inferenceColor}">
											{CurrentNumberUtils.numberWithCommas(prophet.inferencePrice, targetItem.decimalPlace)}
										</p>
										<p class="text-[11px] text-wrap text-end font-semibold {inferenceColor}">
											{CurrentNumberUtils.numberWithCommas(prophet.errorRateAvg, 2)}% /
											{CurrentNumberUtils.numberWithCommas(prophet.diffRate, 2)}%
										</p>
									{:else}
										<p class="text-[12px] text-wrap text-end font-semibold">
											-
										</p>
										<p class="text-[11px] text-wrap text-end font-semibold">
											-
										</p>
									{/if}
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {currentMarketBorder}">
									{#if ai}
										{@const inferenceColor = getColorByInferenceDiffRate(ai.diffRate)}
										<p class="text-[12px] text-wrap text-end font-semibold {inferenceColor}">
											{ai.price}
										</p>
										<p class="text-[11px] text-wrap text-end font-semibold {inferenceColor}">
											{CurrentNumberUtils.numberWithCommas(ai.diffRate, 2)}%
										</p>
									{:else}
										<p class="text-[12px] text-wrap text-end font-semibold">
											-
										</p>
										<p class="text-[11px] text-wrap text-end font-semibold">
											-
										</p>
									{/if}
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {finalScoreColor} {currentMarketBorder}">
									{#if targetItem.indicatorFinalScore}
										<p class="text-[11px] text-wrap text-end font-semibold">
											{CurrentNumberUtils.numberWithCommas(targetItem.indicatorFinalScore, 2)}
										</p>
										<p class="text-[11px] text-wrap text-end font-semibold">
											{CurrentNumberUtils.numberWithCommas(targetItem.indicatorAvgScore, 2)}%
										</p>
									{:else }
										-
									{/if}
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {maColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.maScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.maScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {macdColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.macdScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.macdScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {rsiColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.rsiScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.rsiScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {stochColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.stochasticScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.stochasticScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {stochRSIColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.stochasticRSIScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.stochasticRSIScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
								<TableBodyCell class="px-2 py-0  items-center {stochRSIColor} {currentMarketBorder}">
									<p class="text-[11px] text-wrap text-end font-semibold">
										{#if targetItem.bollingerBandScore}
											{CurrentNumberUtils.numberWithCommas(targetItem.bollingerBandScore, 2)}
										{:else }
											-
										{/if}
									</p>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</TabItem>
	{/each}
</Tabs>

<TradeMarketPriceIndicatorConfigComponent
	bind:openModalYn={_indicatorConfigModalOpenYn}
	indicatorValue={_indicatorValue}
	updateIndicatorValueCallback={updateIndicatorValueCallback}
/>