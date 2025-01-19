<script lang="ts">
	export const prerender = true;

	import type { PageData } from './$types';
	import {
		Card,
		Listgroup,
		ListgroupItem,
		TabItem,
		Tabs
	} from 'flowbite-svelte';
	import { currentMarketCodeStore } from '$lib/stores/MarketStore';
	import {
		MarketCurrencyCode,
		MarketCurrencyTypeUtils
	} from '$lib/common/enums/MarketCurrencyType';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { TickerWebApi } from '$lib/web/api/TickerWebApi';
	import type { TickerData } from '$lib/common/models/TickerData';
	import { page } from '$app/state';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import TickerCandleChartComponent from '$lib/web/components/TickerCandleChartComponent.svelte';

	let { data }: {
		data: PageData
	} = $props();

	let initYn = false;
	let currentMarketCurrencyType: string = $state(MarketCurrencyCode.KRW.code);
	let marketInfoRecord: Record<string, MarketInfoData[]> = $state({});
	let codeByTickerRecord: Record<string, TickerData> = $state({});
	let currentMarketInfoData: MarketInfoData | undefined = $state(undefined);
	let currentTickerData: TickerData | undefined = $state(undefined);

	let milliseconds = $state(10000);

	onDestroy(() => {
		console.log('onDestroy');
	});

	onMount(async () => {
		console.log('onMount');

		await setMarketInfoRecord();

		await updateTickDataList();

		initYn = true;

		await updateCurrentData($currentMarketCodeStore);
	});

	$effect(() => {
		currentMarketInfoData = data.marketInfo;
	});

	// $effect(() => {
	// 	const interval = setInterval(async () => {
	// 		await updateTickDataList();
	// 	}, milliseconds);
	//
	// 	return () => {
	// 		clearInterval(interval);
	// 	};
	// });

	$inspect(currentMarketCurrencyType)
		.with(async () => {
			await updateTickDataList();

			await updateCurrentData($currentMarketCodeStore);
		});

	async function setMarketInfoRecord() {
		marketInfoRecord = data.marketInfoList.reduce((acc, item) => {
			const key = MarketCurrencyTypeUtils.getMarketCurrencyType(item.market);

			if (!key) {
				return acc;
			}

			if (!acc[key.code]) {
				acc[key.code] = [];
			}

			acc[key.code].push(item);

			return acc;
		}, {} as Record<string, MarketInfoData[]>);
	}

	async function updateTickDataList() {

		const responseObject: ResponseObject<TickerData[]> = await TickerWebApi.getTickerAll(currentMarketCurrencyType);

		if (ResponseCode.success.code !== responseObject.code) {
			// alert(responseObject.message);
			codeByTickerRecord = {};
			return;
		}

		const tickerDataList = responseObject.data as TickerData[];

		codeByTickerRecord = tickerDataList.reduce((acc, item) => {
			if (!acc[item.market]) {
				acc[item.market] = item;
			}

			return acc;
		}, {} as Record<string, TickerData>);
	}

	async function updateCurrentData(marketCode: string) {
		if (initYn) {
			currentTickerData = codeByTickerRecord[marketCode];
		}
	}

	function updateCurrentMarketCode(marketCode: string) {
		currentMarketCodeStore.set(marketCode);
	}

	function calculateRate(a: number, b: number) {
		return (((a - b) / b) * 100).toFixed(2);
	}

	function calculateMillion(a: number) {
		return formatNumber(Math.ceil(a / 1000000), 0);
	}

	function formatNumber(num: number, digits: number) {
		return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits }).format(num);
	}
</script>

<main class="flex flex-auto w-full h-full p-4 gap-4 overflow-x-auto overflow-y-hidden">
	<Card class="hidden md:flex w-full min-w-[900px] h-full bg-white dark:bg-black text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700"
				padding="none"
				size="none">

		{#if currentMarketInfoData && Object.keys(codeByTickerRecord).length > 0}
			{@const tickerData = codeByTickerRecord[currentMarketInfoData.market]}
			<Card class="flex w-full"
						size="none">
				<div class="flex w-full">
					{currentMarketInfoData.koreanName}
					{currentMarketInfoData.market}
				</div>
				<div class="col-span-1 min-w-0 text-start">
					<p class="text-[12px] font-medium text-gray-900 dark:text-white">
						{tickerData.tradePrice}
					</p>
					<p class="text-[11px] text-gray-500 dark:text-gray-400">
						{calculateRate(
							tickerData.tradePrice,
							tickerData.prevClosingPrice
						)}%
						{(tickerData.tradePrice - tickerData.prevClosingPrice).toFixed(0)}
					</p>
				</div>
			</Card>
		{/if}

		<Card class="flex w-full h-full"
					size="none">
			{#if currentMarketInfoData}
				<TickerCandleChartComponent marketCode={currentMarketInfoData.market}/>
			{/if}
		</Card>
	</Card>

	<Card class="flex min-w-[500px] w-full max-h-[1024px] bg-white dark:bg-black text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 overflow-hidden"
				size="md">
		<div class="flex flex-col w-full h-full overflow-y-auto">
			<Tabs class=""
						contentClass="p-2 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4"
						tabStyle="underline">
				{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
					<TabItem title={currencyType.name}
									 on:click={() => currentMarketCurrencyType = currencyType.code}
									 open={currentMarketCurrencyType === currencyType.code}>
						<Listgroup class="border-0 dark:!bg-transparent"
											 active={true}>
							{#each marketInfoRecord[currencyType.code] as item}
								{@const tickerData = codeByTickerRecord[item.market]}
								<ListgroupItem
									itemDefaultClass="py-2 px-4 w-full text-sm font-medium list-none first:rounded-t-lg last:rounded-b-lg"
									hoverClass="hover:bg-gray-100 dark:hover:bg-gray-700"
									href={page.url.pathname + '?code=' + item.market}
									on:click={() => updateCurrentMarketCode(item.market)}>
									<div class="grid grid-cols-5 w-full items-center gap-2">
										<div class="col-span-2 min-w-0">
											<p class="text-[12px] font-medium text-gray-900 dark:text-white">
												{item.koreanName}
											</p>
											<p class="text-[11px] text-gray-500 dark:text-gray-400">
												{item.market}
											</p>
										</div>
										<div class="col-span-1 items-center text-[12px] text-end font-semibold text-gray-900 dark:text-white">
											{tickerData?.tradePrice}
										</div>
										<div class="col-span-1 min-w-0 text-end">
											<p class="text-[12px] text-end font-medium text-gray-900 dark:text-white">
												{calculateRate(tickerData?.tradePrice, tickerData?.prevClosingPrice)}%
											</p>
											<p class="text-[11px] text-end text-gray-500 dark:text-gray-400">
												{(tickerData?.tradePrice - tickerData?.prevClosingPrice).toFixed(0)}
											</p>
										</div>
										<div class="col-span-1 items-center text-[12px] text-end font-semibold text-gray-900 dark:text-white">
											{calculateMillion(tickerData?.accTradePrice24h)}백만
										</div>
									</div>
								</ListgroupItem>
							{/each}
						</Listgroup>
					</TabItem>
				{/each}
			</Tabs>
		</div>
	</Card>
</main>