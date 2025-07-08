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
	import moment from 'moment/moment';
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
	import type { ProphetAnalyticsResultData } from '$lib/common/models/ProphetAnalyticsResultData';
	import Decimal from 'decimal.js';

	const sortType = {
		tradePrice: 'tradePrice',
		diffRate: 'diffRate',
		accTradePrice24h: 'accTradePrice24h',
		resultPrice: 'resultPrice',
		resultDiffPrice: 'resultDiffPrice',
		resultDiffRate: 'resultDiffRate'
	};

	interface ProphetAnalyticsResultAndItemTableData {
		market: string;
		koreanName: string;
		englishName: string;
		tradePrice: number;
		decimal: number;
		decimalAdd: number;
		diffRate: number;
		diffPrice: number;
		accTradePrice24h: number;
		priceList: (ProphetAnalyticsResultAndItemPriceData | null)[];
	}

	interface ProphetAnalyticsResultAndItemPriceData {
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
			prophetAnalyticsResultData?: ProphetAnalyticsResultData | undefined
		) => Promise<void>
	} = $props();

	let _marketCurrencyType: string = $state(MarketCurrencyCode.KRW.code);
	let _candleType: string = $state(UPBitCandleUnitEnum.days.key);
	let _candleTimeZone: string = $state(UPBitCandleTimeZones.utc);
	let _startDate: string = $state(CurrentDateUtils.getNowDateString());
	let _endDate: string = $state('');
	let _resultAnItemList: ProphetAnalyticsResultAndItemData[] = $state([]);
	let _koreanNameYn: boolean = $state(true);
	let _sortTargetIndex: number = $state(-1);
	let _sortType: string = $state(sortType.diffRate);
	let _sortAscDesc: boolean = $state(false);
	let _dateTimeList: string[] = $state([]);
	let _tickerDataByMarketRecord: Record<string, TickerData> = $state({});
	let _resultAnItemTableDataList: ProphetAnalyticsResultAndItemTableData[] = $state([]);
	// let _excludeMarketList: string[] = $state([
	// 	'KRW-VIRTUAL',
	// 	'KRW-VTHO',
	// 	'KRW-ANIME'
	// ]);
	let _searchMarket: string = $state('');
	let _tickerUpdateInterval: number = 1000 * 2;

	onDestroy(() => {});

	onMount(async () => {
		await initData();
	});

	$effect(() => {
		if (reloadYn) {
			reloadYn = false;
			console.log('reload prophet analytics result table');
			initData();
		}
	});

	$effect(() => {
		const tickerUpdateInterval = setInterval(async () => {
			await getTickerDataList();
			await updateProphetAnalyticsResultAndItemTableData();
		}, _tickerUpdateInterval);

		return () => {
			clearInterval(tickerUpdateInterval);
		};
	});

	async function initData() {
		await getTickerDataList();
		await getLatestProphetAnalyticsResultAndItemList();
		await updateProphetAnalyticsResultAndItemTableData();

		if (_resultAnItemTableDataList.length > 0) {
			const resultAndItemTableData = _resultAnItemTableDataList.find((item) => item.market === marketInfo.market);

			if (resultAndItemTableData) {
				updateTickerCalculationStore(marketInfo, resultAndItemTableData);
			}
		}
	}

	function onclickMarketItem(resultAnItemTableData: ProphetAnalyticsResultAndItemTableData) {
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

		const resultAndItemData = _resultAnItemList
			.find((item) => item.result.market === marketInfoData.market);

		if (resultAndItemData) {
			onChangeMarketInfoCallback(marketInfoData, resultAndItemData.result);
		} else {
			onChangeMarketInfoCallback(marketInfoData, undefined);
		}

		const url = page.url.pathname + '?code=' + marketInfoData.market;

		goto(url);
	}

	function updateTickerCalculationStore(
		marketInfoData: MarketInfoData,
		resultAndItemData: ProphetAnalyticsResultAndItemTableData
	) {

		const tickerCalculationData: TickerCalculationData = {
			market: marketInfoData.market,
			koreanName: marketInfoData.koreanName,
			englishName: marketInfoData.englishName,
			tradePrice: resultAndItemData.tradePrice,
			diffRate: resultAndItemData.diffRate,
			diffPrice: resultAndItemData.diffPrice,
			accTradePrice24h: resultAndItemData.accTradePrice24h
		};

		tickerCalculationStore.set(tickerCalculationData);
	}

	async function getTickerDataList() {
		const responseObject: ResponseObject<TickerData[]> =
			await TickerWebApi.getTickerAll(_marketCurrencyType);

		if (ResponseCode.success.code !== responseObject.code) {
			_tickerDataByMarketRecord = {};
			return;
		}

		const tickerData: TickerData[] = responseObject.data as TickerData[];

		_tickerDataByMarketRecord = tickerData.reduce((acc, item) => {
			acc[item.market] = item;
			return acc;
		}, {} as Record<string, TickerData>);
	}

	async function getLatestProphetAnalyticsResultAndItemList() {

		const convertedDate = CurrentDateUtils.convertFormatWithTimeZone(_startDate, 'YYYY-MM-DD', _candleTimeZone);

		const responseObject: ResponseObject<unknown> =
			await ProphetAnalyticsWebApi.getProphetAnalyticsResultLatestList(
				_marketCurrencyType,
				_candleType,
				_candleTimeZone,
				convertedDate
			);

		if (ResponseCode.success.code !== responseObject.code) {
			_resultAnItemList = [];
			_dateTimeList = [];
			return;
		}

		_resultAnItemList = responseObject.data as ProphetAnalyticsResultAndItemData[];
	}

	async function updateProphetAnalyticsResultAndItemTableData() {
		getDateTimeList();

		const filteredMarketList = marketInfoList
			.filter((item) => item.market.startsWith(_marketCurrencyType));

		if (_resultAnItemList.length === 0 || _dateTimeList.length === 0) {
			_resultAnItemTableDataList = filteredMarketList.map((item) => {
					const tickerData: TickerData = _tickerDataByMarketRecord[item.market];

					if (!tickerData) {
						return null;
					}

					const priceDecimal = new Decimal(tickerData.tradePrice);
					const prevClosingPriceDecimal = new Decimal(tickerData.prevClosingPrice);

					const decimal = priceDecimal.dp() > prevClosingPriceDecimal.dp() ?
						priceDecimal.dp() :
						prevClosingPriceDecimal.dp();

					const decimalAdd = 10 ** decimal;

					return {
						market: item.market,
						koreanName: item.koreanName,
						englishName: item.englishName,
						tradePrice: tickerData.tradePrice,
						decimal: decimal,
						decimalAdd: decimalAdd,
						diffRate: calculateRate(tickerData.tradePrice, tickerData.prevClosingPrice),
						diffPrice: subtractionPrice(tickerData.tradePrice, tickerData.prevClosingPrice),
						accTradePrice24h: tickerData.accTradePrice24h,
						priceList: []
					};
				})
				.filter((item) => item !== null);

			sortResultAndItemTableData();
		}

		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _candleType) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		const resultAndItemByMarketRecord = _resultAnItemList
			.reduce((acc, item) => {
				acc[item.result.market] = item;
				return acc;
			}, {} as Record<string, ProphetAnalyticsResultAndItemData>);

		_resultAnItemTableDataList = filteredMarketList.map((item) => {
				const tickerData: TickerData = _tickerDataByMarketRecord[item.market];

				if (!tickerData) {
					return null;
				}

				const priceDecimal = new Decimal(tickerData.tradePrice);
				const prevClosingPriceDecimal = new Decimal(tickerData.prevClosingPrice);

				const decimal = priceDecimal.dp() > prevClosingPriceDecimal.dp() ?
					priceDecimal.dp() :
					prevClosingPriceDecimal.dp();

				const decimalAdd = 10 ** decimal;

				const resultAnItem = resultAndItemByMarketRecord[item.market];

				if (!resultAnItem) {
					return {
						market: item.market,
						koreanName: item.koreanName,
						englishName: item.englishName,
						tradePrice: tickerData.tradePrice,
						decimal: decimal,
						decimalAdd: decimalAdd,
						diffRate: calculateRate(tickerData.tradePrice, tickerData.prevClosingPrice),
						diffPrice: subtractionPrice(tickerData.tradePrice, tickerData.prevClosingPrice),
						accTradePrice24h: tickerData.accTradePrice24h,
						priceList: []
					};
				}

				const priceDataListByDateTimeRecord: Record<string, ProphetAnalyticsResultAndItemPriceData> =
					resultAnItem.resultItemList.reduce((acc, item) => {
						const dateTime = CurrentDateUtils.convertFormat(item.ds, dateTimeFormat);

						if (acc[dateTime]) {
							return acc;
						}

						const diffPrice = subtractionPrice(item.yhat, tickerData.tradePrice);
						const diffRate = calculateRate(item.yhat, tickerData.tradePrice);

						acc[dateTime] = {
							price: item.yhat,
							diffRate: diffRate,
							diffPrice: diffPrice
						};
						return acc;
					}, {} as Record<string, ProphetAnalyticsResultAndItemPriceData>);

				const priceList = _dateTimeList.map((dateTime) => {
					if (!priceDataListByDateTimeRecord[dateTime]) {
						return null;
					}

					return priceDataListByDateTimeRecord[dateTime];
				});

				return {
					market: item.market,
					koreanName: item.koreanName,
					englishName: item.englishName,
					tradePrice: tickerData.tradePrice,
					decimal: decimal,
					decimalAdd: decimalAdd,
					diffRate: calculateRate(tickerData?.tradePrice, tickerData?.prevClosingPrice),
					diffPrice: subtractionPrice(tickerData.tradePrice, tickerData.prevClosingPrice),
					accTradePrice24h: tickerData.accTradePrice24h,
					priceList: priceList
				};
			})
			.filter((item) => item !== null);

		sortResultAndItemTableData();
	}

	function subtractionPrice(price: number, basePrice: number): number {
		const priceDecimal = new Decimal(price);
		const basePriceDecimal = new Decimal(basePrice);

		return priceDecimal.minus(basePriceDecimal)
			.toNumber();
	}

	function calculateRate(price: number, basePrice: number): number {
		const priceDecimal = new Decimal(price);
		const basePriceDecimal = new Decimal(basePrice);

		return priceDecimal.minus(basePriceDecimal)
			.dividedBy(basePriceDecimal)
			.times(100)
			.toNumber();
	}

	function getDateTimeList() {
		let dateTimeFormat = 'YYYY-MM-DD HH';

		if (UPBitCandleUnitEnum.days.key === _candleType) {
			dateTimeFormat = 'YYYY-MM-DD';
		}

		if (_resultAnItemList.length === 0) {
			_endDate = CurrentDateUtils.addDaysISOString(30);
		} else {
			_endDate = _resultAnItemList
				.reduce((prev, current) => {
					const date = current.resultItemList.reduce((p, c) => {
						return p > c.ds ? p : c.ds;
					}, '');

					return prev > date ? prev : date;
				}, '');
		}

		const startDate = moment(_startDate);
		const endDateMoment = moment(_endDate);
		const dateArray: string[] = [];
		const addType = UPBitCandleUnitEnum.days.key === _candleType ? 'days' : 'hours';

		while (startDate.isBefore(endDateMoment) || startDate.isSame(endDateMoment)) {
			dateArray.push(CurrentDateUtils.convertFormat(startDate.format(), dateTimeFormat));
			startDate.add(1, addType);
		}

		_dateTimeList = dateArray;
	}

	function sortResultAndItemTableData() {
		_resultAnItemTableDataList.sort((a, b) => {
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

	function onclickMarketCurrency(currencyType: string) {
		_marketCurrencyType = currencyType;

		initData();
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
						 bind:value={_searchMarket} />
		</div>
		{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
			<TabItem title={currencyType.name}
							 onclick={() => onclickMarketCurrency(currencyType.code)}
							 open={_marketCurrencyType === currencyType.code}>
				<Table divClass="relative table-fixed w-full h-[750px] overflow-auto">
					<TableHead defaultRow={false}
										 class="h-[40px]">
						<tr>
							<TableHeadCell class="min-w-[100px] text-start text-[12px] text-nowrap sticky top-0 left-0 z-10 bg-white dark:bg-gray-800"
														 padding="none"
														 rowspan={2}
														 onclick={() => _koreanNameYn  = !_koreanNameYn}>
								<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
									{_koreanNameYn ? '한글명' : '영문명'}
									<SortHorizontalOutline class="ms-1 w-4 h-4" />
								</p>
							</TableHeadCell>
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[100px] z-10 bg-white dark:bg-gray-800"
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
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[180px] z-10 bg-white dark:bg-gray-800"
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
							<TableHeadCell class="min-w-[80px] items-center text-center text-nowrap sticky top-0 left-[260px] z-10 left-shadow bg-white dark:bg-gray-800"
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
							{/each}
						</tr>
					</TableHead>
					{#if _resultAnItemTableDataList.length > 0}
						<TableBody>
							{#each _resultAnItemTableDataList as tableData}
								{@const currentMarketBorder = marketInfo.market === tableData.market ?
									'border-separate border-y border-primary-500 bg-primary-100 dark:bg-primary-800' :
									''}
								{@const diffColor = tableData.diffPrice > 0 ?
									'text-red-500' :
									tableData.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
								<TableBodyRow
									class="h-[42px] {currentMarketBorder}"
									onclick={() => onclickMarketItem(tableData)}>
									<TableBodyCell class="text-start text-[12px] p-0 sticky left-0 bg-white dark:bg-gray-800 {currentMarketBorder}">
										<p class="text-wrap text-[12px] font-medium leading-none">
											{_koreanNameYn ? tableData.koreanName : tableData.englishName}
										</p>
										<p class="text-[11px] text-gray-500 dark:text-gray-400">
											{tableData.market}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end sticky left-[100px] bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
										<p class="text-[12px] font-medium">
											{CurrentNumberUtils.numberWithCommas(tableData.tradePrice, tableData.decimal)}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end sticky left-[180px] bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
										<p class="items-center text-[12px] text-end font-semibold">
											{CurrentNumberUtils.ceilPrice(tableData.diffRate, 2)}%
										</p>
										<p class="text-[11px] text-end">

											{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
												tableData.diffPrice,
												tableData.decimal
											), tableData.decimal)}
										</p>
									</TableBodyCell>
									<TableBodyCell class="p-0 text-wrap text-end sticky left-[260px] left-shadow bg-white dark:bg-gray-800 {diffColor} {currentMarketBorder}">
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
														tableData.decimal
													), tableData.decimal)}
												</TableBodyCell>
												<TableBodyCell class="p-0 text-end text-[12px] {diffColor} {currentMarketBorder}">
													<p class="items-center text-[12px] text-end font-semibold">
														{CurrentNumberUtils.ceilPrice(item.diffRate, 2)}%
													</p>
													<p class="text-[11px] text-end">
														{CurrentNumberUtils.numberWithCommas(CurrentNumberUtils.ceilPrice(
															item.diffPrice,
															tableData.decimal
														), tableData.decimal)}
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