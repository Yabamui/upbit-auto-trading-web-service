<script lang="ts">

	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
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
		tickerCalculationStore,
		tickerListStore
	} from '$lib/stores/MarketStore';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { TickerWebApi } from '$lib/web/request/TickerWebApi';
	import Decimal from 'decimal.js';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';
	import moment from 'moment/moment';

	const sortType = {
		tradePrice: 'tradePrice',
		diffRate: 'diffRate',
		accTradePrice24h: 'accTradePrice24h',
		resultPrice: 'resultPrice',
		resultDiffPrice: 'resultDiffPrice',
		resultDiffRate: 'resultDiffRate'
	};

	interface TickerAndProphetAnalyticsResultData {
		market: string;
		koreanName: string;
		englishName: string;
		tradePrice: number;
		decimalDepth: number;
		diffRate: number;
		diffPrice: number;
		accTradePrice24h: number;
		priceList: (TickerAndProphetAnalyticsResultPriceData | null)[];
	}

	interface TickerAndProphetAnalyticsResultPriceData {
		price: number;
		diffRate: number;
		diffPrice: number;
	}

	let {
		reloadYn = $bindable(),
		marketInfo,
		marketInfoList,
		onChangeMarketInfoCallback
	}: {
		reloadYn: boolean,
		marketInfo: MarketInfoData
		marketInfoList: MarketInfoData[],
		onChangeMarketInfoCallback: (
			marketInfoData: MarketInfoData,
		) => Promise<void>
	} = $props();

	let _initYn: boolean = $state(false);
	let _marketCurrencyType: string = $state(MarketCurrencyCode.KRW.code);
	let _candleUnit: string = $state(UPBitCandleUnitEnum.days.key);
	let _candleTimeZone: string = $state(UPBitCandleTimeZones.utc);
	let _priceType: string = $state(ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key);
	let _koreanNameYn: boolean = $state(true);
	let _sortTargetIndex: number = $state(-1);
	let _sortType: string = $state(sortType.diffRate);
	let _sortAscDesc: boolean = $state(false);
	let _dateTimeList: string[] = $state([]);
	let _tickerByMarketRecord: Record<string, TickerData> = $state({});
	let _tickerAndProphetAnalyticsResultList: TickerAndProphetAnalyticsResultData[] = $state.raw([]);
	let _prophetResultPriceDataByDateTimeRecordByMarket: Record<string, Record<string, TickerAndProphetAnalyticsResultPriceData>> = $state({});
	let _searchMarket: string = $state('');
	let _searchExp = $derived.by(() => new RegExp(_searchMarket, 'i'));

	onDestroy(() => {
		_marketCurrencyType = MarketCurrencyCode.KRW.code;
		_candleUnit = UPBitCandleUnitEnum.days.key;
		_candleTimeZone = UPBitCandleTimeZones.utc;
		_koreanNameYn = true;
		_sortTargetIndex = -1;
		_sortType = sortType.diffRate;
		_sortAscDesc = false;
		_dateTimeList = [];
		_tickerByMarketRecord = {};
		_tickerAndProphetAnalyticsResultList = [];
		_searchMarket = '';
	});

	onMount(async () => {
		await initData();

		_initYn = true;
	});

	$effect(() => {
		const tickerUpdateInterval = setInterval(async () => {
			if (!_initYn) {
				return;
			}

			await getTickerDataList();
			await updateTickerAndProphetAnalyticsResultList();
		}, 1000);

		return () => {
			clearInterval(tickerUpdateInterval);
		};
	});

	async function initData() {
		const marketCurrencyType = MarketCurrencyTypeUtils.getMarketCurrencyType(marketInfo.market);

		if (marketCurrencyType) {
			_marketCurrencyType = marketCurrencyType.code;
		}

		await Promise.all([
			getTickerDataList(),
			getLatestProphetAnalyticsResultAndItemList()
		]);

		await updateTickerAndProphetAnalyticsResultList();

		if (!_tickerAndProphetAnalyticsResultList.length) {
			return;
		}

		const tickerAndProphetAnalyticsResult = _tickerAndProphetAnalyticsResultList.find((item) => item.market ===
			marketInfo.market);

		if (tickerAndProphetAnalyticsResult) {
			updateTickerCalculationStore(marketInfo, tickerAndProphetAnalyticsResult);
		}
	}

	async function getTickerDataList() {
		const responseObject: ResponseObject<TickerData[]> =
			await TickerWebApi.getTickerAll(_marketCurrencyType);

		if (ResponseCode.success.code !== responseObject.code) {
			_tickerByMarketRecord = {};
			return;
		}

		const tickerList: TickerData[] = responseObject.data as TickerData[];

		tickerListStore.set(tickerList);

		_tickerByMarketRecord = tickerList.reduce((acc, item) => {
			acc[item.market] = item;
			return acc;
		}, {} as Record<string, TickerData>);
	}

	async function getLatestProphetAnalyticsResultAndItemList() {

		const startDate = moment().add(-1, 'days').utc().format(CurrentDateUtils.dateFormat);

		const responseObject: ResponseObject<unknown> =
			await ProphetAnalyticsWebApi.getLatestProphetAnalyticsResultList(
				_marketCurrencyType,
				_candleUnit,
				_candleTimeZone,
				_priceType,
				startDate
			);

		if (ResponseCode.success.code !== responseObject.code) {
			_dateTimeList = [];
			return;
		}

		const resultAndItemList = responseObject.data as ProphetAnalyticsResultAndItemData[];

		const dateTimeFormat = CurrentDateUtils.getFormat(_candleUnit);

		_prophetResultPriceDataByDateTimeRecordByMarket = resultAndItemList
			.filter((item) => item.resultItemList && item.resultItemList.length)
			.reduce((acc, item) => {
			const sortedResultItemList = item.resultItemList.sort((a, b) => a.ds.localeCompare(b.ds));

			const startPrice = sortedResultItemList[0].yhat;

			acc[item.result.market] = sortedResultItemList
				.reduce((acc, subItem) => {
					const dateTime = CurrentDateUtils.addHoursByString(subItem.ds, 9, dateTimeFormat);
					const diffPrice = CurrentNumberUtils.subtractPrice(subItem.yhat, startPrice);
					const diffRate = CurrentNumberUtils.calculateRate(subItem.yhat, startPrice);
					acc[dateTime] = {
						price: subItem.yhat,
						diffRate: diffRate,
						diffPrice: diffPrice
					};
					return acc;
				}, {} as Record<string, TickerAndProphetAnalyticsResultPriceData>);
			return acc;
		}, {} as Record<string, Record<string, TickerAndProphetAnalyticsResultPriceData>>);
	}

	async function updateTickerAndProphetAnalyticsResultList() {
		await Promise.all([getDateTimeList(), getMarketListByCurrencyType()])
			.then((resolve) => {
				const filteredMarketList = resolve[1];

				_tickerAndProphetAnalyticsResultList = filteredMarketList.map((item) => {
						const tickerData: TickerData = _tickerByMarketRecord[item.market];

						if (!tickerData) {
							return null;
						}

						const priceDecimal = new Decimal(tickerData.tradePrice);
						const prevClosingPriceDecimal = new Decimal(tickerData.prevClosingPrice);

						const decimalDepth = priceDecimal.dp() > prevClosingPriceDecimal.dp() ?
							priceDecimal.dp() :
							prevClosingPriceDecimal.dp();

						const prophetResultPriceDataByDateTime =_prophetResultPriceDataByDateTimeRecordByMarket[item.market];

						if (!prophetResultPriceDataByDateTime) {
							return {
								market: item.market,
								koreanName: item.koreanName,
								englishName: item.englishName,
								tradePrice: tickerData.tradePrice,
								decimalDepth: decimalDepth,
								diffRate: CurrentNumberUtils.calculateRate(
									tickerData.tradePrice,
									tickerData.prevClosingPrice
								),
								diffPrice: CurrentNumberUtils.subtractPrice(
									tickerData.tradePrice,
									tickerData.prevClosingPrice
								),
								accTradePrice24h: tickerData.accTradePrice24h,
								priceList: []
							};
						}

						const priceList = _dateTimeList.map((dateTime) => {
							if (!prophetResultPriceDataByDateTime[dateTime]) {
								return null;
							}

							return prophetResultPriceDataByDateTime[dateTime];
						});

						return {
							market: item.market,
							koreanName: item.koreanName,
							englishName: item.englishName,
							tradePrice: tickerData.tradePrice,
							decimalDepth: decimalDepth,
							diffRate: CurrentNumberUtils.calculateRate(
								tickerData?.tradePrice,
								tickerData?.prevClosingPrice
							),
							diffPrice: CurrentNumberUtils.subtractPrice(
								tickerData.tradePrice,
								tickerData.prevClosingPrice
							),
							accTradePrice24h: tickerData.accTradePrice24h,
							priceList: priceList
						};
					})
					.filter((item) => item !== null);

				sortResultAndItemTableData();
			});
	}

	async function getDateTimeList() {

		const maxDateTime = Object.values(_prophetResultPriceDataByDateTimeRecordByMarket).map((item) => {
			return Object.keys(item)
		})
			.flatMap((item) => item)
			.reduce((acc, item) => {
				return acc.localeCompare(item) > 0 ? acc : item;
			});

		if (!maxDateTime) {
			_dateTimeList = [];
			return;
		}

		const startDatetime = CurrentDateUtils.getNowDateTimeString();
		const endDatetime = CurrentDateUtils.toKSTStringByUTCString(
			maxDateTime,
			_candleTimeZone
		);

		_dateTimeList = CurrentDateUtils.getDateTimeList(startDatetime, endDatetime, _candleUnit);
	}

	async function getMarketListByCurrencyType() {
		return marketInfoList
			.filter((item) => item.market.startsWith(_marketCurrencyType))
			.filter((item) => {
				if (_searchMarket) {
					return matchedMarket(item.market + item.koreanName + item.englishName);
				}

				return true;
			});
	}

	async function onclickMarketCurrency(currencyType: string) {
		_marketCurrencyType = currencyType;

		await getTickerDataList();
		await getLatestProphetAnalyticsResultAndItemList();
		await updateTickerAndProphetAnalyticsResultList();
	}

	function onclickMarketItem(resultAnItemTableData: TickerAndProphetAnalyticsResultData) {
		if (marketInfo.market === resultAnItemTableData.market) {
			return;
		}

		const marketInfoData = marketInfoList
			.find((item) => item.market === resultAnItemTableData.market) || undefined;

		if (!marketInfoData) {
			return;
		}

		updateTickerCalculationStore(marketInfoData, resultAnItemTableData);

		currentMarketCodeStore.set(marketInfoData.market);

		onChangeMarketInfoCallback(marketInfoData);

		const url = page.url.pathname + '?code=' + marketInfoData.market;

		goto(url);
	}

	function updateTickerCalculationStore(
		marketInfoData: MarketInfoData,
		resultAndItemData: TickerAndProphetAnalyticsResultData
	) {

		const ticker: TickerData = _tickerByMarketRecord[marketInfoData.market];

		const tickerCalculationData: TickerCalculationData = {
			market: marketInfoData.market,
			koreanName: marketInfoData.koreanName,
			englishName: marketInfoData.englishName,
			decimalDepth: resultAndItemData.decimalDepth,
			openingPrice: ticker.openingPrice,
			highPrice: ticker.highPrice,
			lowPrice: ticker.lowPrice,
			tradePrice: ticker.tradePrice,
			diffRate: resultAndItemData.diffRate,
			diffPrice: resultAndItemData.diffPrice,
			accTradePrice: ticker.accTradePrice,
			accTradePrice24h: ticker.accTradePrice24h,
			accTradeVolume: ticker.accTradeVolume,
			accTradeVolume24h: ticker.accTradeVolume24h
		};

		tickerCalculationStore.set(tickerCalculationData);
	}

	function onchangeSearchMarket() {
		console.log('onchangeSearchMarket');

		if (!_tickerAndProphetAnalyticsResultList || _tickerAndProphetAnalyticsResultList.length === 0 || !_searchMarket) {
			return;
		}

		_tickerAndProphetAnalyticsResultList = _tickerAndProphetAnalyticsResultList.filter((item) => {
			return matchedMarket(item.market + item.koreanName + item.englishName);
		});
	}

	function matchedMarket(target: string) {
		return _searchExp.exec(target);
	}

	function sortResultAndItemTableData() {
		_tickerAndProphetAnalyticsResultList.sort((a, b) => {
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
				if (a.priceList.length === 0 || b.priceList.length === 0) {
					return a.priceList.length === 0 ? 1 : -1;
				}

				const aItem = a.priceList[_sortTargetIndex];
				const bItem = b.priceList[_sortTargetIndex];

				if (aItem === null || bItem === null) {
					return aItem === null ? 1 : -1;
				}

				const aPrice = aItem.price;
				const bPrice = bItem.price;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else if (_sortType === sortType.resultDiffRate) {
				if (a.priceList.length === 0 || b.priceList.length === 0) {
					return a.priceList.length === 0 ? 1 : -1;
				}

				const aItem = a.priceList[_sortTargetIndex];
				const bItem = b.priceList[_sortTargetIndex];

				if (aItem === null || bItem === null) {
					return aItem === null ? 1 : -1;
				}

				const aPrice = aItem.diffRate;
				const bPrice = bItem.diffRate;

				return _sortAscDesc ? aPrice - bPrice : bPrice - aPrice;
			} else {
				return 0;
			}
		});
	}

	function onclickTradePriceSort() {
		if (_sortType === sortType.tradePrice) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.tradePrice;

		sortResultAndItemTableData();
	}

	function onclickDiffRateSort() {
		if (_sortType === sortType.diffRate) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.diffRate;

		sortResultAndItemTableData();
	}

	function onclickAccTradePrice24hSort() {
		if (_sortType === sortType.accTradePrice24h) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortAscDesc = false;
		}

		_sortType = sortType.accTradePrice24h;

		sortResultAndItemTableData();
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

		sortResultAndItemTableData();
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

		sortResultAndItemTableData();
	}
</script>

<Card class="flex w-full h-full"
			padding="none"
			size="none">
	<Tabs class=""
				tabStyle="underline">
		<div class="flex w-full">
			<Input id="search-navbar"
						 class="ps-10"
						 placeholder="Search..."
						 onchange={() => onchangeSearchMarket()}
						 bind:value={_searchMarket} />
		</div>
		{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
			<TabItem title={currencyType.name}
							 onclick={() => onclickMarketCurrency(currencyType.code)}
							 open={_marketCurrencyType === currencyType.code}>
				<Table divClass="relative table-fixed w-full h-[550px] overflow-auto">
					<TableHead defaultRow={false}
										 class="h-[40px]">
						<tr>
							<TableHeadCell class="min-w-[100px] text-start text-[12px] text-nowrap sticky top-0 left-0 left-shadow z-10 bg-white dark:bg-gray-800"
														 padding="none"
														 rowspan={2}
														 onclick={() => _koreanNameYn  = !_koreanNameYn}>
								<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
									{_koreanNameYn ? '한글명' : '영문명'}
									<SortHorizontalOutline class="ms-1 w-4 h-4" />
								</p>
							</TableHeadCell>
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 bg-white dark:bg-gray-800"
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
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 bg-white dark:bg-gray-800"
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
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 bg-white dark:bg-gray-800"
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
								<TableHeadCell colspan={2}
															 class="min-w-40 h-[20px] items-center text-center text-nowrap sticky top-0 bg-white dark:bg-gray-800"
															 padding="none">
									<p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
										{dateTime}
									</p>
								</TableHeadCell>
							{/each}
						</tr>
						<tr>
							{#each _dateTimeList as dateTime, index}
								<TableHeadCell class="min-w-20 h-[20px] p-0 items-center text-center text-nowrap sticky top-5 bg-white dark:bg-gray-800"
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
								<TableHeadCell class="min-w-20 h-[16px] p-0 items-center text-center text-nowrap sticky top-5 bg-white dark:bg-gray-800"
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
							{/each}
						</tr>
					</TableHead>
					{#if _tickerAndProphetAnalyticsResultList.length > 0}
						<TableBody>
							{#each _tickerAndProphetAnalyticsResultList as tableData}
								{@const currentMarketBorder = marketInfo.market === tableData.market ?
									'border-separate border-y border-primary-500 bg-primary-100 dark:bg-primary-800' :
									''}
								{@const diffColor = tableData.diffPrice > 0 ?
									'text-red-500' :
									tableData.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
								<TableBodyRow
									class="h-[42px] {currentMarketBorder}"
									onclick={() => onclickMarketItem(tableData)}>
									<TableBodyCell class="text-start text-[12px] p-0 sticky left-0 left-shadow bg-white dark:bg-gray-800 {currentMarketBorder}">
										<p class="text-wrap text-[12px] font-medium leading-none">
											{_koreanNameYn ? tableData.koreanName : tableData.englishName}
										</p>
										<p class="text-[11px] text-gray-500 dark:text-gray-400">
											{tableData.market}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
										<p class="text-[12px] font-medium">
											{CurrentNumberUtils.numberWithCommas(tableData.tradePrice, tableData.decimalDepth)}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
										<p class="items-center text-[12px] text-end font-semibold">
											{CurrentNumberUtils.ceilPrice(tableData.diffRate, 2)}%
										</p>
										<p class="text-[11px] text-end">

											{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
												tableData.diffPrice,
												tableData.decimalDepth
											), tableData.decimalDepth)}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
										{#if tableData.accTradePrice24h > 1000000}
											<p class="items-center text-[12px] text-end font-semibold text-gray-900 dark:text-white">
												{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.divideCeil(
													tableData.accTradePrice24h,
													1000000
												), 0)}
											</p>
											<p class="text-[11px] text-gray-500 dark:text-gray-400">
												백만
											</p>
										{:else }
											<p class="items-center text-[12px] text-end font-semibold">
												{CurrentNumberUtils.numberWithCommas(tableData.accTradePrice24h, 0)}
											</p>
										{/if}
									</TableBodyCell>
									{#if tableData.priceList.length > 0}
										{#each tableData.priceList as item}
											{#if item !== null}
												{@const diffColor = item.diffPrice > 0 ?
													'text-red-500' :
													item.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
												<TableBodyCell class="p-0 text-end text-[12px] {diffColor} {currentMarketBorder}">
													{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
														item.price,
														tableData.decimalDepth
													), tableData.decimalDepth)}
												</TableBodyCell>
												<TableBodyCell class="p-0 text-end text-[12px] {diffColor} {currentMarketBorder}">
													<p class="items-center text-[12px] text-end font-semibold">
														{CurrentNumberUtils.ceilPrice(item.diffRate, 2)}%
													</p>
													<p class="text-[11px] text-end">
														{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
															item.diffPrice,
															tableData.decimalDepth
														), tableData.decimalDepth)}
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