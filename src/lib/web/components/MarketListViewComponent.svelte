<script lang="ts">
	import { MarketCurrencyTypeUtils } from '$lib/common/enums/MarketCurrencyType';
	import { page } from '$app/state';
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
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		currentMarketCodeStore,
		tickerCalculationStore,
		tickerListStore
	} from '$lib/stores/MarketStore';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import {
		type TickerCalculationData,
		type TickerData,
		TickerDataUtils
	} from '$lib/common/models/TickerData';
	import { TickerWebApi } from '$lib/web/request/TickerWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import {
		SortHorizontalOutline,
		CaretSortSolid,
		CaretUpSolid,
		CaretDownSolid
	} from 'flowbite-svelte-icons';

	const sortTypeList = {
		tradePrice: 'tradePrice',
		diffRate: 'diffRate',
		accTradePrice24h: 'accTradePrice24h'
	};

	let {
		market,
		marketInfoData,
		marketInfoDataList,
		onChangeMarketInfoCallback
	}: {
		market: string,
		marketInfoData: MarketInfoData,
		marketInfoDataList: MarketInfoData[],
		onChangeMarketInfoCallback: (marketInfoData: MarketInfoData) => void
	} = $props();

	let _marketCurrencyType = $state('KRW');
	let _searchMarket = $state('');
	let _koreanNameYn = $state(true);
	let _tickerCalculationDataList: TickerCalculationData[] = $state.raw([]);
	let _sortType = $state(sortTypeList.diffRate);
	let _sortAscDesc = $state(false);
	let _tickerUpdateInterval: number = 1000 * 5;

	onMount(() => {
		if (marketInfoDataList.length > 0) {
			mountData();
		}
	});

	$effect(() => {
		const tickerUpdateInterval = setInterval(() => {
			updateTickDataList();
		}, _tickerUpdateInterval);

		return () => {
			clearInterval(tickerUpdateInterval);
		};
	});

	$inspect(_marketCurrencyType)
		.with(() => updateTickDataList());

	async function mountData() {
		const marketCurrencyType = MarketCurrencyTypeUtils.getMarketCurrencyType(market);

		if (marketCurrencyType) {
			_marketCurrencyType = marketCurrencyType.code;
		}

		await updateTickDataList();
	}

	function clickMarketItem(market: string) {
		if (marketInfoData.market === market) {
			return;
		}

		const _marketInfoData = marketInfoDataList.find((item) => item.market === market) || null;

		if (!_marketInfoData) {
			return;
		}

		const tickerCalculationData: TickerCalculationData | undefined =
			_tickerCalculationDataList.find((item) => item.market === market);

		if (tickerCalculationData) {
			tickerCalculationStore.set(tickerCalculationData);
		}

		currentMarketCodeStore.set(market);

		marketInfoData = _marketInfoData;

		onChangeMarketInfoCallback(_marketInfoData);
		const url = page.url.pathname + '?code=' + market;

		goto(url);
	}

	async function getTickerDataList() {
		const responseObject: ResponseObject<TickerData[]> =
			await TickerWebApi.getTickerAll(_marketCurrencyType);

		if (ResponseCode.success.code !== responseObject.code) {
			return [];
		}

		const tickerList = responseObject.data as TickerData[];

		tickerListStore.set(tickerList);

		return tickerList;
	}

	async function updateTickDataList() {

		if (!_marketCurrencyType) {
			_tickerCalculationDataList = [];
			return;
		}

		const tickerDataList: TickerData[] = await getTickerDataList();

		if (tickerDataList.length === 0) {
			_tickerCalculationDataList = [];
			return;
		}

		const marketInfoDataByMarketRecord: Record<string, MarketInfoData> = marketInfoDataList.reduce((acc, item) => {
			acc[item.market] = item;
			return acc;
		}, {} as Record<string, MarketInfoData>);

		_tickerCalculationDataList = tickerDataList.map((item) => {
			const marketInfoData = marketInfoDataByMarketRecord[item.market];
			return TickerDataUtils.toTickerCalculationData(marketInfoData, item);
		});

		sortTickerCalculationDataList(_tickerCalculationDataList);
	}

	function sortTickerCalculationDataList(tickerCalculationDataList: TickerCalculationData[]) {
		if (_tickerCalculationDataList.length === 0) {
			return;
		}

		_tickerCalculationDataList = tickerCalculationDataList
			.sort((a, b) => {
				if (_sortType === sortTypeList.tradePrice) {
					if (_sortAscDesc) {
						return a.tradePrice - b.tradePrice;
					} else {
						return b.tradePrice - a.tradePrice;
					}
				} else if (_sortType === sortTypeList.diffRate) {
					if (_sortAscDesc) {
						return a.diffRate - b.diffRate;
					} else {
						return b.diffRate - a.diffRate;
					}
				} else if (_sortType === sortTypeList.accTradePrice24h) {
					if (_sortAscDesc) {
						return a.accTradePrice24h - b.accTradePrice24h;
					} else {
						return b.accTradePrice24h - a.accTradePrice24h;
					}
				}

				return 0;
			});
	}

	function filterTickerCalculationDataList() {
		if (!_tickerCalculationDataList || _tickerCalculationDataList.length === 0) {
			return [];
		}

		if (!_searchMarket) {
			return _tickerCalculationDataList;
		}

		const regExp = new RegExp(_searchMarket, 'i');

		return _tickerCalculationDataList.filter((item) => {
			const target = item.market + item.koreanName + item.englishName;

			return regExp.exec(target);
		});
	}

	function onClickTradePrice() {
		if (_sortType === sortTypeList.tradePrice) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortType = sortTypeList.tradePrice;
			_sortAscDesc = false;
		}

		updateTickDataList();
	}

	function onClickDiffRate() {
		if (_sortType === sortTypeList.diffRate) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortType = sortTypeList.diffRate;
			_sortAscDesc = false;
		}

		updateTickDataList();
	}

	function onClickAccTradePrice24h() {
		if (_sortType === sortTypeList.accTradePrice24h) {
			_sortAscDesc = !_sortAscDesc;
		} else {
			_sortType = sortTypeList.accTradePrice24h;
			_sortAscDesc = false;
		}

		updateTickDataList();
	}
</script>

<Card class="md:flex md:w-full w-full h-full overflow-y-auto"
			padding="none"
			size="none">
	<Tabs class="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border-b border-gray-200 dark:border-gray-700  shadow-lg "
				contentClass="p-2 bg-gray-50 rounded-lg dark:bg-gray-800"
				tabStyle="underline">
		<div class="flex w-full">
			<Input id="search-navbar"
						 class="ps-10"
						 placeholder="Search..."
						 bind:value={_searchMarket} />
		</div>
		{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
			<TabItem title={currencyType.name}
							 onclick={() => _marketCurrencyType = currencyType.code}
							 open={_marketCurrencyType === currencyType.code}>
				<Table class="w-full table-fixed"
							 hoverable={true}>
					<TableHead class="h-10">
						<TableHeadCell class="p-0 items-center text-center"
													 onclick={() => _koreanNameYn  = !_koreanNameYn}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								{_koreanNameYn ? '한글명' : '영문명'}
								<SortHorizontalOutline class="ms-1 w-4 h-4" />
							</p>
						</TableHeadCell>
						<TableHeadCell class="p-0 items-center text-center"
													 onclick={onClickTradePrice}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								현재가
								{#if _sortType === sortTypeList.tradePrice}
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
						<TableHeadCell class="p-0 items-center text-center"
													 onclick={onClickDiffRate}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								전일대비
								{#if _sortType === sortTypeList.diffRate}
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
						<TableHeadCell class="p-0 items-center text-center"
													 onclick={onClickAccTradePrice24h}>
							<p class="inline-flex text-[11px] font-medium text-gray-500 dark:text-gray-400">
								거래대금
								{#if _sortType === sortTypeList.accTradePrice24h}
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
					</TableHead>
					<TableBody>
						{#each filterTickerCalculationDataList() as item (item.market)}
							{@const diffColor = item.diffPrice > 0 ?
								'text-red-500' :
								item.diffPrice < 0 ? 'text-blue-500' : 'text-gray-500'}
							<TableBodyRow
								class={marketInfoData.market === item.market ? 'bg-gray-100 dark:bg-gray-800' : ''}
								onclick={() => clickMarketItem(item.market)}>
								<TableBodyCell class="p-0">
									<p class="text-wrap text-[12px] font-medium text-gray-900 dark:text-white">
										{_koreanNameYn ? item.koreanName : item.englishName}
									</p>
									<p class="text-[11px] text-gray-500 dark:text-gray-400">
										{item.market}
									</p>
								</TableBodyCell>
								<TableBodyCell class="p-0 text-wrap text-end {diffColor}">
									<p class="text-[12px] font-medium">
										{CurrentNumberUtils.numberWithCommas(item.tradePrice, item.decimalDepth)}
									</p>
								</TableBodyCell>
								<TableBodyCell class="p-0 text-wrap text-end {diffColor}">
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
								<TableBodyCell class="p-0 text-wrap text-end">
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
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</TabItem>
		{/each}
	</Tabs>
</Card>