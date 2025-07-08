<script lang="ts">

	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		Card,
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
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		CaretDownSolid,
		CaretSortSolid,
		CaretUpSolid,
		SortHorizontalOutline
	} from 'flowbite-svelte-icons';
	import {
		MarketCurrencyCode,
		MarketCurrencyTypeUtils
	} from '$lib/common/enums/MarketCurrencyType';
	import type {
		TickerCalculationData,
		TickerData
	} from '$lib/common/models/TickerData';
	import {
		currentMarketCodeStore,
		tickerCalculationStore
	} from '$lib/stores/MarketStore';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { TickerWebApi } from '$lib/web/request/TickerWebApi';
	import Decimal from 'decimal.js';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';
	import { type AiLatestInferenceData } from '$lib/common/models/AiResponsesData';
	import type { AiAnalyticsCandleEChartRequestData } from '$lib/common/models/AiAnalyticsData';
	import AiAnalyticsCandleEChartsComponent
		from '$lib/web/components/ai-analytics/AiAnalyticsCandleEChartsComponent.svelte';
	import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';

	const sortType = {
		tradePrice: 'tradePrice',
		diffRate: 'diffRate',
		accTradePrice24h: 'accTradePrice24h',
		resultPrice: 'resultPrice',
		resultDiffPrice: 'resultDiffPrice',
		resultDiffRate: 'resultDiffRate',
		resultAccDiffPrice: 'resultAccDiffPrice'
	};

	interface TickerAndInferencePriceData {
		market: string;
		koreanName: string;
		englishName: string;
		tradePrice: number;
		decimalDepth: number;
		decimalAdd: number;
		diffRate: number;
		diffPrice: number;
		accTradePrice24h: number;
		inferencePriceList: (AiLatestInferencePriceData | null)[];
	}

	interface AiLatestInferencePriceData {
		price: number;
		diffRate: number;
		diffPrice: number;
		accDiffRate: number;
		accDiffPrice: number;
	}

	let {
		reloadYn = $bindable(),
		marketInfo = $bindable(),
		marketInfoList,
		candleUnit,
		candleTimeZone
	}: {
		reloadYn: boolean,
		marketInfo: MarketInfoData
		marketInfoList: MarketInfoData[],
		candleUnit: string,
		candleTimeZone: string,
	} = $props();

	const _tickerUpdateInterval: number = 1000 * 5;

	let _marketCurrencyType: string = $state(MarketCurrencyCode.KRW.code);
	let _koreanNameYn: boolean = $state(true);
	let _sortTargetIndex: number = $state(-1);
	let _sortType: string = $state(sortType.diffRate);
	let _sortAscDesc: boolean = $state(false);

	let _searchMarket: string = $state('');
	let _alertMessage: string = $state('');

	let _eChartRequestData: AiAnalyticsCandleEChartRequestData | undefined = $state(undefined);
	let _eChartClearYn: boolean = $state(false);

	let _dateTimeList: string[] = $state([]);
	let _tickerAndInferencePriceList: TickerAndInferencePriceData[] = $state([]);
	let _inferenceByDateTimeByMarket: Record<string, Record<string, AiLatestInferenceData>> = $state({});

	onDestroy(() => {
		_marketCurrencyType = MarketCurrencyCode.KRW.code;
		_koreanNameYn = true;
		_sortTargetIndex = -1;
		_sortType = sortType.diffRate;
		_sortAscDesc = false;
		_dateTimeList = [];
		_tickerAndInferencePriceList = [];
		_searchMarket = '';
		_alertMessage = '';
	});

	onMount(async () => {
		await initData();
	});

	$effect(() => {
		if (reloadYn) {
			reloadYn = false;
			initData();
		}
	});

	$effect(() => {
		const tickerUpdateInterval = setInterval(async () => {
			const tickerByMarketRecord = await getTickerDataList();
			await updateTickerAndAiResponsesData(
				tickerByMarketRecord,
				_inferenceByDateTimeByMarket
			);
		}, _tickerUpdateInterval);

		return () => {
			clearInterval(tickerUpdateInterval);
		};
	});

	async function initData() {
		const marketCurrencyType = MarketCurrencyTypeUtils.getMarketCurrencyType(marketInfo.market);

		if (marketCurrencyType) {
			_marketCurrencyType = marketCurrencyType.code;
		}

		const result = await Promise.all([getTickerDataList(), getAiLatestInferenceList()]);

		await updateTickerAndAiResponsesData(result[0], _inferenceByDateTimeByMarket);

		if (_tickerAndInferencePriceList.length > 0) {
			const tickerAndAiResponses = _tickerAndInferencePriceList
				.find((item) => item.market === marketInfo.market);

			if (tickerAndAiResponses) {
				updateTickerCalculationStore(marketInfo, tickerAndAiResponses);
			}
		}

		const inferenceByDateTime = _inferenceByDateTimeByMarket[marketInfo.market];

		setECartReqeustData(marketInfo, inferenceByDateTime);
	}

	async function getTickerDataList(): Promise<Record<string, TickerData>> {
		const responseObject: ResponseObject<TickerData[]> =
			await TickerWebApi.getTickerAll(_marketCurrencyType);

		if (ResponseCode.success.code !== responseObject.code) {
			return {} as Record<string, TickerData>;
		}

		const tickerData: TickerData[] = responseObject.data as TickerData[];

		return tickerData.reduce((acc, item) => {
			acc[item.market] = item;
			return acc;
		}, {} as Record<string, TickerData>);
	}

	async function getAiLatestInferenceList() {

		const judgementYn = false;
		_inferenceByDateTimeByMarket = {};

		const responseObject: ResponseObject<unknown> =
			await AiAnalyticsWebApi.getAiLatestInferenceList(
				_marketCurrencyType,
				candleUnit,
				candleTimeZone,
				judgementYn
			);

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = responseObject.message;
			return {};
		}

		const aiLatestInferenceList = responseObject.data as AiLatestInferenceData[];
		const dateTimeFormat = CurrentDateUtils.getFormat(candleUnit);

		_inferenceByDateTimeByMarket = aiLatestInferenceList.reduce((acc, item) => {
			if (!acc[item.market]) {
				acc[item.market] = {};
			}

			const dateTime = UPBitCandleTimeZones.utc === candleTimeZone ?
				CurrentDateUtils.convertFormat(
					item.dateTime,
					dateTimeFormat
				) :
				CurrentDateUtils.addHoursByString(
					item.dateTime,
					9,
					dateTimeFormat
				);

			acc[item.market][dateTime] = item;

			return acc;
		}, {} as Record<string, Record<string, AiLatestInferenceData>>);
	}

	async function updateTickerAndAiResponsesData(
		tickerByMarketRecord: Record<string, TickerData>,
		inferenceByDateTimeByMarket: Record<string, Record<string, AiLatestInferenceData>>
	) {

		const result = await Promise.all([getDateTimeList(inferenceByDateTimeByMarket), getMarketListByCurrencyType()]);

		await setTickerAndAiResponsesDataListWithAiResponses(
			result[1],
			tickerByMarketRecord,
			_inferenceByDateTimeByMarket
		);

		sortTickerAndAiResponsesList();
	}

	async function getDateTimeList(inferenceByDateTimeByMarket: Record<string, Record<string, AiLatestInferenceData>>) {

		const dateTimeSet = new Set<string>();

		Object.values(inferenceByDateTimeByMarket)
			.forEach((item) => {
				const dateTimeList = Object.keys(item);

				dateTimeList.forEach((dateTime) => dateTimeSet.add(dateTime));
			});

		if (dateTimeSet.size === 0) {
			_dateTimeList = [];
		} else {
			_dateTimeList = Array.from(dateTimeSet)
				.sort((a, b) => a.localeCompare(b));
		}
	}

	async function getMarketListByCurrencyType() {
		return marketInfoList
			.filter((item) => item.market.startsWith(_marketCurrencyType));
	}

	async function setTickerAndAiResponsesDataListWithAiResponses(
		filteredMarketList: MarketInfoData[],
		tickerByMarketRecord: Record<string, TickerData>,
		inferenceByDateTimeByMarket: Record<string, Record<string, AiLatestInferenceData>>
	) {

		_tickerAndInferencePriceList = filteredMarketList.map((marketInfo) => {
				const tickerData: TickerData = tickerByMarketRecord[marketInfo.market];

				if (!tickerData) {
					return null;
				}

				const priceDecimal = new Decimal(tickerData.tradePrice);
				const prevClosingPriceDecimal = new Decimal(tickerData.prevClosingPrice);

				const decimalDepth = priceDecimal.dp() > prevClosingPriceDecimal.dp() ?
					priceDecimal.dp() :
					prevClosingPriceDecimal.dp();

				const decimalAdd = 10 ** decimalDepth;

				const inferenceByDateTime = inferenceByDateTimeByMarket[marketInfo.market];

				if (!inferenceByDateTime) {
					return {
						market: marketInfo.market,
						koreanName: marketInfo.koreanName,
						englishName: marketInfo.englishName,
						tradePrice: tickerData.tradePrice,
						decimalDepth: decimalDepth,
						decimalAdd: decimalAdd,
						diffRate: CurrentNumberUtils.calculateRate(
							tickerData.tradePrice,
							tickerData.prevClosingPrice
						),
						diffPrice: CurrentNumberUtils.subtractPrice(
							tickerData.tradePrice,
							tickerData.prevClosingPrice
						),
						accTradePrice24h: tickerData.accTradePrice24h,
						inferencePriceList: []
					};
				}

				const priceList: (AiLatestInferencePriceData | null)[] = _dateTimeList.map((dateTime) => {
					const inference = inferenceByDateTime[dateTime];
					if (!inference) {
						return null;
					}

					return {
						price: inference.closePrice,
						diffRate: CurrentNumberUtils.calculateRate(
							inference.closePrice,
							inference.openPrice
						),
						diffPrice: CurrentNumberUtils.subtractPrice(
							inference.closePrice,
							inference.openPrice
						),
						accDiffRate: CurrentNumberUtils.calculateRate(
							inference.closePrice,
							tickerData.tradePrice
						),
						accDiffPrice: CurrentNumberUtils.subtractPrice(
							inference.closePrice,
							tickerData.tradePrice
						)
					};
				});

				return {
					market: marketInfo.market,
					koreanName: marketInfo.koreanName,
					englishName: marketInfo.englishName,
					tradePrice: tickerData.tradePrice,
					decimalDepth: decimalDepth,
					decimalAdd: decimalAdd,
					diffRate: CurrentNumberUtils.calculateRate(
						tickerData?.tradePrice,
						tickerData?.prevClosingPrice
					),
					diffPrice: CurrentNumberUtils.subtractPrice(
						tickerData.tradePrice,
						tickerData.prevClosingPrice
					),
					accTradePrice24h: tickerData.accTradePrice24h,
					inferencePriceList: priceList
				};
			})
			.filter((item) => item !== null);
	}

	function sortTickerAndAiResponsesList() {
		_tickerAndInferencePriceList.sort((a, b) => {
			if (_sortType === sortType.tradePrice) {

				const aPrice = a.tradePrice;
				const bPrice = b.tradePrice;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.diffRate) {
				const aPrice = a.diffRate;
				const bPrice = b.diffRate;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.accTradePrice24h) {
				const aPrice = a.accTradePrice24h;
				const bPrice = b.accTradePrice24h;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.resultPrice) {
				if (a.inferencePriceList.length === 0 || b.inferencePriceList.length === 0) {
					return a.inferencePriceList.length === 0 ? 1 : -1;
				}

				const aItem = a.inferencePriceList[_sortTargetIndex];
				const bItem = b.inferencePriceList[_sortTargetIndex];

				if (aItem === null || bItem === null) {
					return aItem === null ? 1 : -1;
				}

				const aPrice = aItem.price;
				const bPrice = bItem.price;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.resultDiffRate) {
				if (a.inferencePriceList.length === 0 || b.inferencePriceList.length === 0) {
					return a.inferencePriceList.length === 0 ? 1 : -1;
				}

				const aItem = a.inferencePriceList[_sortTargetIndex];
				const bItem = b.inferencePriceList[_sortTargetIndex];

				if (aItem === null || bItem === null) {
					return aItem === null ? 1 : -1;
				}

				const aPrice = aItem.diffRate;
				const bPrice = bItem.diffRate;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.resultAccDiffPrice) {
				if (a.inferencePriceList.length === 0 || b.inferencePriceList.length === 0) {
					return a.inferencePriceList.length === 0 ? 1 : -1;
				}

				const aItem = a.inferencePriceList[_sortTargetIndex];
				const bItem = b.inferencePriceList[_sortTargetIndex];

				if (aItem === null || bItem === null) {
					return aItem === null ? 1 : -1;
				}

				const aPrice = aItem.accDiffRate;
				const bPrice = bItem.accDiffRate;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else {
				return 0;
			}
		});
	}

	function getTickerAndAiResponsesDataListBySearchMarket() {

		if (_tickerAndInferencePriceList.length === 0) {
			return [];
		}

		if (!_searchMarket) {
			return _tickerAndInferencePriceList;
		}

		const regExp = new RegExp(_searchMarket, 'i');

		return _tickerAndInferencePriceList.filter((item) => {
			const target = item.market + item.koreanName + item.englishName;

			return regExp.exec(target);
		});
	}

	async function onclickMarketCurrency(currencyType: string) {
		_marketCurrencyType = currencyType;

		const result = await Promise.all([getTickerDataList(), getAiLatestInferenceList()]);

		await updateTickerAndAiResponsesData(
			result[0],
			_inferenceByDateTimeByMarket
		);
	}

	function onclickMarketItem(tickerAndInferencePrice: TickerAndInferencePriceData) {
		if (marketInfo.market === tickerAndInferencePrice.market) {
			return;
		}

		const marketInfoData = marketInfoList
			.find((item) => item.market === tickerAndInferencePrice.market) || undefined;

		if (!marketInfoData) {
			return;
		}

		updateTickerCalculationStore(marketInfoData, tickerAndInferencePrice);
		marketInfo = marketInfoData;

		currentMarketCodeStore.set(marketInfoData.market);

		setECartReqeustData(
			marketInfoData,
			_inferenceByDateTimeByMarket[marketInfoData.market]
		);

		const url = page.url.pathname + '?code=' + marketInfoData.market;

		goto(url);
	}

	function updateTickerCalculationStore(
		marketInfoData: MarketInfoData,
		tickerAndInferencePrice: TickerAndInferencePriceData
	) {

		const tickerCalculationData: TickerCalculationData = {
			market: marketInfoData.market,
			koreanName: marketInfoData.koreanName,
			englishName: marketInfoData.englishName,
			tradePrice: tickerAndInferencePrice.tradePrice,
			diffRate: tickerAndInferencePrice.diffRate,
			diffPrice: tickerAndInferencePrice.diffPrice,
			accTradePrice24h: tickerAndInferencePrice.accTradePrice24h,
			decimalDepth: tickerAndInferencePrice.decimalDepth
		};

		tickerCalculationStore.set(tickerCalculationData);
	}

	function setECartReqeustData(
		marketInfo: MarketInfoData,
		inferenceByDateTime: Record<string, AiLatestInferenceData> | undefined
	) {

		_eChartRequestData = {
			market: marketInfo.market,
			marketName: marketInfo.koreanName,
			candleUnit: candleUnit,
			candleTimeZone: candleTimeZone,
			dateTimeFormat: CurrentDateUtils.getFormat(candleUnit),
			inferenceByDateTime: inferenceByDateTime
		};
	}

	function onclickTradePriceSort() {
		if (_sortType === sortType.tradePrice) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.tradePrice;

		sortTickerAndAiResponsesList();
	}

	function onclickDiffRateSort() {
		if (_sortType === sortType.diffRate) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.diffRate;

		sortTickerAndAiResponsesList();
	}

	function onclickAccTradePrice24hSort() {
		if (_sortType === sortType.accTradePrice24h) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.accTradePrice24h;

		sortTickerAndAiResponsesList();
	}

	function onclickResultPriceSort(index: number) {
		if (_sortTargetIndex === index) {
			if (_sortType === sortType.resultPrice) {
				_sortAscDesc = !_sortAscDesc;
			} else {
				_sortAscDesc = false;
			}
		} else {
			_sortTargetIndex = index;
			_sortAscDesc = false;
		}

		_sortType = sortType.resultPrice;

		sortTickerAndAiResponsesList();
	}

	function onclickResultDiffRateSort(index: number) {
		if (_sortTargetIndex === index) {
			if (_sortType === sortType.resultDiffRate) {
				_sortAscDesc = !_sortAscDesc;
			} else {
				_sortAscDesc = false;
			}
		} else {
			_sortTargetIndex = index;
			_sortAscDesc = false;
		}

		_sortType = sortType.resultDiffRate;

		sortTickerAndAiResponsesList();
	}

	function onclickResultAccDiffRateSort(index: number) {
		if (_sortTargetIndex === index) {
			if (_sortType === sortType.resultAccDiffPrice) {
				_sortAscDesc = !_sortAscDesc;
			} else {
				_sortAscDesc = false;
			}
		} else {
			_sortTargetIndex = index;
			_sortAscDesc = false;
		}

		_sortType = sortType.resultAccDiffPrice;

		sortTickerAndAiResponsesList();
	}
</script>

<div class="flex flex-row w-full gap-4">
	<Card class="flex flex-grow min-w-[800px] h-[650px] overflow-hidden"
				size="none">
		{#if _eChartRequestData}
			<AiAnalyticsCandleEChartsComponent
				eChartRequestData={_eChartRequestData}
				chartClearYn={_eChartClearYn} />
		{/if}
	</Card>

	<Card class="flex-none w-[600px] h-[650px] overflow-hidden"
				padding="none"
				size="none">
		<Tabs class=""
					tabStyle="underline">
			<div class="flex w-full">
				<Input id="search-navbar"
							 class="ps-10"
							 placeholder="Search..."
							 bind:value={_searchMarket} />
			</div>
			{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
				<TabItem title={currencyType.name}
								 onclick={() => onclickMarketCurrency(currencyType.code)}
								 open={_marketCurrencyType === currencyType.code}>
					<Table divClass="relative table-fixed w-full h-[500px] overflow-auto">
						<TableHead defaultRow={false}
											 class="h-[40px]">
							<tr>
								<TableHeadCell class="min-w-[100px] text-start text-[12px] text-nowrap sticky top-0 left-0 z-[17] left-shadow bg-white dark:bg-gray-800"
															 padding="none"
															 rowspan={2}
															 onclick={() => _koreanNameYn  = !_koreanNameYn}>
									<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
										{_koreanNameYn ? '한글명' : '영문명'}
										<SortHorizontalOutline class="ms-1 w-4 h-4" />
									</p>
								</TableHeadCell>
								<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[50px] z-[16] left-shadow bg-white dark:bg-gray-800"
															 padding="none"
															 rowspan={2}
															 onclick={onclickTradePriceSort}>
									<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
										현재가
										{#if _sortType === sortType.tradePrice}
											{#if _sortAscDesc}
												<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
											{:else}
												<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
											{/if}
										{:else}
											<CaretSortSolid class="ms-1 w-4 h-4" />
										{/if}
									</p>
								</TableHeadCell>
								<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[100px] z-[15] left-shadow bg-white dark:bg-gray-800"
															 padding="none"
															 rowspan={2}
															 onclick={onclickDiffRateSort}>
									<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
										전일대비
										{#if _sortType === sortType.diffRate}
											{#if _sortAscDesc}
												<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
											{:else}
												<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
											{/if}
										{:else}
											<CaretSortSolid class="ms-1 w-4 h-4" />
										{/if}
									</p>
								</TableHeadCell>
								<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[150px] z-[14] left-shadow bg-white dark:bg-gray-800"
															 padding="none"
															 rowspan={2}
															 onclick={onclickAccTradePrice24hSort}>
									<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
										거래대금
										{#if _sortType === sortType.accTradePrice24h}
											{#if _sortAscDesc}
												<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
											{:else}
												<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
											{/if}
										{:else}
											<CaretSortSolid class="ms-1 w-4 h-4" />
										{/if}
									</p>
								</TableHeadCell>
								{#each _dateTimeList as dateTime}
									<TableHeadCell colspan={3}
																 class="min-w-40 h-[20px] items-center text-center sticky top-0 bg-white dark:bg-gray-800"
																 padding="none">
										<p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
											{dateTime}
										</p>
									</TableHeadCell>
								{/each}
							</tr>
							<tr>
								{#each _dateTimeList as dateTime, index}
									<TableHeadCell class="min-w-20 h-[20px] p-0 items-center text-center sticky top-5 bg-white dark:bg-gray-800"
																 onclick={() => onclickResultPriceSort(index)}>
										<p class="inline-flex text-[11px] font-medium text-nowrap text-gray-500 dark:text-gray-400">
											예상금액
											{#if _sortType === sortType.resultPrice && _sortTargetIndex === index}
												{#if _sortAscDesc}
													<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
												{:else}
													<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
												{/if}
											{:else}
												<CaretSortSolid class="ms-1 w-4 h-4" />
											{/if}
										</p>
									</TableHeadCell>
									<TableHeadCell class="min-w-20 h-[16px] p-0 items-center text-center sticky top-5 bg-white dark:bg-gray-800"
																 onclick={() => onclickResultDiffRateSort(index)}>
										<p class="inline-flex text-[11px] font-medium text-nowrap text-gray-500 dark:text-gray-400">
											예상 대비
											{#if _sortType === sortType.resultDiffRate && _sortTargetIndex === index}
												{#if _sortAscDesc}
													<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
												{:else}
													<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
												{/if}
											{:else}
												<CaretSortSolid class="ms-1 w-4 h-4" />
											{/if}
										</p>
									</TableHeadCell>
									<TableHeadCell class="min-w-20 h-[16px] p-0 items-center text-center sticky top-5 bg-white dark:bg-gray-800"
																 onclick={() => onclickResultAccDiffRateSort(index)}>
										<p class="inline-flex text-[11px] font-medium text-nowrap text-gray-500 dark:text-gray-400">
											누적 대비
											{#if _sortType === sortType.resultAccDiffPrice && _sortTargetIndex === index}
												{#if _sortAscDesc}
													<CaretUpSolid class="ms-1 w-4 h-4 text-blue-500" />
												{:else}
													<CaretDownSolid class="ms-1 w-4 h-4 text-red-500" />
												{/if}
											{:else}
												<CaretSortSolid class="ms-1 w-4 h-4" />
											{/if}
										</p>
									</TableHeadCell>
								{/each}
							</tr>
						</TableHead>
						{#if _tickerAndInferencePriceList.length > 0}
							<TableBody>
								{#each getTickerAndAiResponsesDataListBySearchMarket() as item}
									{@const currentMarketBorder = marketInfo.market === item.market ?
										'border-separate border-y border-primary-500 bg-primary-100 dark:bg-primary-800' :
										''}
									{@const diffColor = item.diffPrice > 0 ?
										'text-red-500' :
										item.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
									<TableBodyRow
										class="h-[42px] {currentMarketBorder}"
										onclick={() => onclickMarketItem(item)}>
										<TableBodyCell class="text-start text-[12px] p-0 sticky left-0 z-[13] left-shadow bg-white dark:bg-gray-800 {currentMarketBorder}">
											<p class="text-wrap text-[12px] font-medium leading-none">
												{_koreanNameYn ? item.koreanName : item.englishName}
											</p>
											<p class="text-[11px] text-gray-500 dark:text-gray-400">
												{item.market}
											</p>
										</TableBodyCell>
										<TableBodyCell class="p-0 text-wrap text-end sticky left-[50px] z-[12] left-shadow bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
											<p class="text-[12px] font-medium">
												{CurrentNumberUtils.numberWithCommas(item.tradePrice, item.decimalDepth)}
											</p>
										</TableBodyCell>
										<TableBodyCell class="p-0 text-wrap text-end sticky left-[100px] z-[11] left-shadow bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
											<p class="items-center text-[12px] text-end font-semibold">
												{CurrentNumberUtils.ceilPrice(item.diffRate, 2)}%
											</p>
											<p class="text-[11px] text-end">

												{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
													item.diffPrice,
													item.decimalDepth
												), item.decimalDepth)}
											</p>
										</TableBodyCell>
										<TableBodyCell class="p-0 text-wrap text-end sticky left-[150px] z-10 left-shadow bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
											{#if item.accTradePrice24h > 1000000}
												<p class="items-center text-[12px] text-end font-semibold text-gray-900 dark:text-white">
													{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.divideCeil(
														item.accTradePrice24h,
														1000000
													), 0)}
												</p>
												<p class="text-[11px] text-gray-500 dark:text-gray-400">
													백만
												</p>
											{:else }
												<p class="items-center text-[12px] text-end font-semibold">
													{CurrentNumberUtils.numberWithCommas(item.accTradePrice24h, 0)}
												</p>
											{/if}
										</TableBodyCell>
										{#if item.inferencePriceList.length > 0}
											{#each item.inferencePriceList as priceItem}
												{#if priceItem !== null}
													{@const diffColor = priceItem.diffPrice > 0 ?
														'text-red-500' :
														priceItem.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
													{@const accDiffColor = priceItem.accDiffPrice > 0 ?
														'text-red-500' :
														priceItem.accDiffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
													<TableBodyCell class="p-0 text-end text-[12px] {diffColor} {currentMarketBorder}">
														{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
															priceItem.price,
															item.decimalDepth
														), item.decimalDepth)}
													</TableBodyCell>
													<TableBodyCell class="p-0 text-end text-[12px] {diffColor} {currentMarketBorder}">
														<p class="items-center text-[12px] text-end font-semibold">
															{CurrentNumberUtils.ceilPrice(priceItem.diffRate, 2)}%
														</p>
														<p class="text-[11px] text-end">
															{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
																priceItem.diffPrice,
																item.decimalDepth
															), item.decimalDepth)}
														</p>
													</TableBodyCell>
													<TableBodyCell class="p-0 text-end text-[12px] {accDiffColor} {currentMarketBorder}">
														<p class="items-center text-[12px] text-end font-semibold">
															{CurrentNumberUtils.ceilPrice(priceItem.accDiffRate, 2)}%
														</p>
														<p class="text-[11px] text-end">
															{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
																priceItem.accDiffPrice,
																item.decimalDepth
															), item.decimalDepth)}
														</p>
													</TableBodyCell>
												{:else }
													<TableBodyCell class="p-0 text-end text-[12px] {currentMarketBorder}">
														-
													</TableBodyCell>
													<TableBodyCell class="p-0 text-end text-[12px] {currentMarketBorder}">
														-
													</TableBodyCell>
													<TableBodyCell class="p-0 text-end text-[12px] {currentMarketBorder}">
														-
													</TableBodyCell>
												{/if}
											{/each}
										{/if}
									</TableBodyRow>
								{/each}
							</TableBody>
						{/if}
					</Table>
				</TabItem>
			{/each}
		</Tabs>
	</Card>
</div>

<ToastAlertComponent
	alertMessage={_alertMessage} />