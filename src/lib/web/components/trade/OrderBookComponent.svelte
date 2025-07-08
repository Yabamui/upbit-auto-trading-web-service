<script lang="ts">
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { OrderBookWebApi } from '$lib/web/request/OrderBookWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type {
		OrderBookData,
		OrderBookSupportedLevelData
	} from '$lib/common/models/OrderBookData';
	import {
		Button,
		Dropdown,
		DropdownItem,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { tickerCalculationStore } from '$lib/stores/MarketStore';
	import type { TickerCalculationData } from '$lib/common/models/TickerData';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import { ChevronDownIcon } from 'lucide-svelte';
	import type { OrderBuyData } from '$lib/common/models/OrderData';
	import { orderBuyStore } from '$lib/stores/OrderStore';

	interface OrderBookTableData {
		askSize: number;
		askSizePercent: number;
		price: number;
		rate: number;
		bidSize: number;
		bidSizePercent: number;
	}

	let {
		marketInfo
	}: {
		marketInfo: MarketInfoData
	} = $props();

	let _initYn: boolean = $state(false);
	let _marketInfo: MarketInfoData | undefined = $state(undefined);
	let _supportedLevel: number = $state(0);
	let _supportedLevelList: number[] = $state([]);
	let _orderBookTableData: OrderBookTableData[] = $state([]);
	let _totalAskSize: number = $state(0);
	let _totalBidSize: number = $state(0);
	let _supportedLevelDropdownOpenYn = $state(false);
	let _priceDecimalPlace: number = $state(0);

	onMount(async () => {
		if (marketInfo) {
			_marketInfo = marketInfo;

			await mount(_marketInfo.market);

			_initYn = true;
		}
	});

	$effect(() => {
		if (_initYn && marketInfo && marketInfo.market !== _marketInfo?.market) {

			_marketInfo = marketInfo;
			mount(_marketInfo.market);
		}
	});

	$effect(() => {
		const orderBookInterval = setInterval(async () => {
			if (_marketInfo) {
				await setOrderBook(_marketInfo.market, _supportedLevel);
			}
		}, 1000);

		return () => {
			clearInterval(orderBookInterval);
		};
	});

	async function mount(market: string) {

		await setOrderBookSupportedLevel(market);

		await setOrderBook(market, _supportedLevelList[0]);
	}

	async function setOrderBookSupportedLevel(market: string) {
		_supportedLevel = 0;
		_supportedLevelList = [];
		const responseObject: ResponseObject<unknown> =
			await OrderBookWebApi.getOrderBookSupportedLevel(market);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const orderBookSupportedLevelList = responseObject.data as OrderBookSupportedLevelData[];

		_supportedLevelList = orderBookSupportedLevelList.find((item) => item.market === market)?.supportedLevelList || [];
	}

	async function setOrderBook(market: string, supportedLevel: number) {

		if (!$tickerCalculationStore) {
			return;
		}

		const tickerCalculation: TickerCalculationData = JSON.parse($tickerCalculationStore);

		const responseObject: ResponseObject<unknown> =
			await OrderBookWebApi.getOrderBook(market, supportedLevel);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const orderBook = responseObject.data as OrderBookData;

		_totalAskSize = orderBook.totalAskSize;
		_totalBidSize = orderBook.totalBidSize;
		_priceDecimalPlace = tickerCalculation.decimalDepth;

		const maxSize = orderBook.orderBookUnitList.reduce((max, item) => {
			return Math.max(max, item.askSize, item.bidSize);
		}, 0);

		const result = await Promise.all([
			orderBook.orderBookUnitList
				.filter((item) => item.askSize > 0)
				.map(item => {
					const rate = CurrentNumberUtils.calculateRate(item.askPrice, tickerCalculation.openingPrice);

					return {
						askSize: item.askSize,
						askSizePercent: CurrentNumberUtils.calculatePercent(item.askSize, maxSize),
						price: item.askPrice,
						rate: rate,
						bidSize: NaN,
						bidSizePercent: NaN
					};
				}),

			orderBook.orderBookUnitList
				.filter((item) => item.bidSize > 0)
				.map(item => {
					const rate = CurrentNumberUtils.calculateRate(item.bidPrice, tickerCalculation.openingPrice);

					return {
						askSize: NaN,
						askSizePercent: NaN,
						price: item.bidPrice,
						rate: rate,
						bidSize: item.bidSize,
						bidSizePercent: CurrentNumberUtils.calculatePercent(item.bidSize, maxSize)
					};
				})
		]);

		_orderBookTableData = [...result[0], ...result[1]].sort((a, b) => b.price - a.price);
	}

	async function onclickSupportedLevel(level: number) {
		if (_marketInfo) {
			_supportedLevel = level;
			_supportedLevelDropdownOpenYn = false;
			await setOrderBook(_marketInfo.market, _supportedLevel);
		}
	}

	async function onclickOrderBook(price: number, size: number = 0) {
		const orderBuyData: OrderBuyData = {
			market: marketInfo.market,
			orderBuyPrice: price,
			orderBuyCount: size,
			priceDecimalPlace: _priceDecimalPlace
		} as OrderBuyData;

		orderBuyStore.set(orderBuyData);
	}

</script>

{#if _orderBookTableData && _orderBookTableData.length > 0}
	<caption>
		<div class="flex w-full items-center justify-end p-2">
			<Button
				color="none"
				disabled={_supportedLevelList.length < 2}
				class="p-0 pb-2 focus:ring-0">
				<div class="text-[12px] leading-none">
					{#if _supportedLevel > 0}
						{_supportedLevel}
					{:else}
						모아보기
					{/if}
				</div>
				<ChevronDownIcon class="w-3 h-3 ml-1"
												 strokeWidth={3} />
			</Button>
			<Dropdown
				bind:open={_supportedLevelDropdownOpenYn}>
				{#each _supportedLevelList as item}
					<DropdownItem onclick={() => onclickSupportedLevel(item)}>
						<div class="w-full text-[12px] items-center text-start leading-none">
							{item}
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>
	</caption>
	<Table
		divClass="relative overflow-x-auto scrollbar-hide"
		class="relative table-fixed w-full h-[550px]">
		<TableBody>
			{#each _orderBookTableData as item}
				{@const textColor = item.rate < 0 ? 'text-blue-500 dark:text-blue-200' : 'text-red-500 dark:text-red-400'}
				{@const cellColor = item.askSize ? 'bg-blue-100 dark:bg-blue-900' : 'bg-primary-100 dark:bg-primary-900'}
				<TableBodyRow>
					{#if item.askSize}
						<TableBodyCell
							class="flex items-center justify-end py-2 pr-2 border border-white dark:border-gray-700 {cellColor}">
							<div class="relative flex items-center justify-end w-full">
								<button
									class="flex items-center justify-end w-full"
									onclick={() => onclickOrderBook(item.price, item.askSize)}
								>
								<span
									class="bg-blue-300 inline-block h-full absolute right-0"
									style="width: {item.askSizePercent}%">
								</span>
									<span class="text-[12px] relative z-10">
									{CurrentNumberUtils.numberWithCommas(item.askSize, 3)}
								</span>
								</button>
							</div>
						</TableBodyCell>
					{:else}
						<TableBodyCell class="border border-white dark:border-gray-700"></TableBodyCell>
					{/if}
					<TableBodyCell
						class="w-[100px] py-2 pr-2 border border-white dark:border-gray-700 {cellColor}"
						onclick={() => onclickOrderBook(item.price)}>
						<p class="text-[12px] text-end {textColor}">
							{CurrentNumberUtils.numberWithCommas(item.price, _priceDecimalPlace)}
						</p>
					</TableBodyCell>
					<TableBodyCell class="w-[80px] py-2 pl-2 border border-white dark:border-gray-700 {cellColor}">
						<p class="text-[12px] text-start {textColor}">
							{CurrentNumberUtils.numberWithCommas(item.rate, 2)}
						</p>
					</TableBodyCell>
					{#if item.bidSize}
						<TableBodyCell
							class="flex items-center py-2 pl-2 border border-white dark:border-gray-700 {cellColor}">
							<div class="relative flex items-center w-full">
								<button
									class="flex items-center w-full"
									onclick={() => onclickOrderBook(item.price, item.bidSize)}
								>
								<span
									class="bg-primary-300 inline-block h-full absolute left-0"
									style="width: {item.bidSizePercent}%">
								</span>
									<span class="text-[12px] relative z-10">
									{CurrentNumberUtils.numberWithCommas(item.bidSize, 3)}
								</span>
								</button>
							</div>
						</TableBodyCell>
					{:else}
						<TableBodyCell class="border border-white dark:border-gray-700"></TableBodyCell>
					{/if}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
	<caption>
		<Table>
			<TableBody>
				<TableBodyRow>
					<TableBodyCell class=" py-2 pr-2">
						<p class="text-[12px] text-end">
							{CurrentNumberUtils.numberWithCommas(_totalAskSize, 3)}
						</p>
					</TableBodyCell>
					<TableBodyCell class="w-[180px] col-span-2 p-2">
						<p class="text-[12px] text-center">
							수량({marketInfo.market})
						</p>
					</TableBodyCell>
					<TableBodyCell class="py-2 pl-2">
						<p class="text-[12px] text-start">
							{CurrentNumberUtils.numberWithCommas(_totalBidSize, 3)}
						</p>
					</TableBodyCell>
				</TableBodyRow>
			</TableBody>
		</Table>
	</caption>
{/if}


