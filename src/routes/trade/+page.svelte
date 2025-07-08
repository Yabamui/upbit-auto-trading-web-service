<script lang="ts">
	import type { PageData } from './$types';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import type { TickerCalculationData } from '$lib/common/models/TickerData';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import {
		currentMarketCodeStore,
		tickerCalculationStore
	} from '$lib/stores/MarketStore';
	import { Card } from 'flowbite-svelte';
	import TradeInferenceEChartsComponent from '$lib/web/components/trade/TradeInferenceEChartsComponent.svelte';
	import OrderBookComponent from '$lib/web/components/trade/OrderBookComponent.svelte';
	import OrderComponent from '$lib/web/components/trade/OrderComponent.svelte';
	import TradeMarketPriceComponent from '$lib/web/components/trade/TradeMarketPriceComponent.svelte';
	import NewsFeedScrapResultComponent from '$lib/web/components/trade/NewsFeedScrapResultComponent.svelte';

	let { data }: {
		data: PageData
	} = $props();

	let _tickerCalculationData: TickerCalculationData | undefined = $state(undefined);

	onDestroy(() => {});

	onMount(() => {
		if (data.marketInfo) {
			currentMarketCodeStore.set(data.marketInfo.market);
		}
	});

	$effect(() => {
		if ($tickerCalculationStore) {
			_tickerCalculationData = JSON.parse($tickerCalculationStore);
		}
	});
</script>

<header class="relative grid grid-cols-2 gap-2 w-full h-20 px-4 py-2 items-center border-b-2 overflow-y-hidden overflow-x-auto">
	<div class="col-span-2 grid grid-flow-col gap-4 w-full items-center justify-center">
		{#if _tickerCalculationData}
			{@const priceColor = _tickerCalculationData.diffPrice > 0 ?
				'text-red-500' :
				_tickerCalculationData.diffPrice < 0 ? 'text-blue-500' : ''}
			<div class="min-w-0 text-end">
				<p class="text-[24px] font-bold">
					{_tickerCalculationData.koreanName}
				</p>
				<p class="text-[12px]">
					{_tickerCalculationData.market}
				</p>
			</div>
			<div class="min-w-0 text-start">
				<p class="text-[22px] text-nowrap font-medium {priceColor}">
					{CurrentNumberUtils.numberWithCommas(
						_tickerCalculationData.tradePrice,
						_tickerCalculationData.decimalDepth
					)}
					<span class="text-[12px]">
						KRW
					</span>
				</p>
				<p class="text-[11px] priceColor {priceColor}">
					{_tickerCalculationData.diffRate.toFixed(2)}%
					{CurrentNumberUtils.numberWithCommas(
						_tickerCalculationData.diffPrice,
						_tickerCalculationData.decimalDepth
					)}
				</p>
			</div>
			<div class="min-w-[70px] content-around">
				<p class="text-[12px] text-nowrap font-medium">
					고가 :
					<span class="text-red-500">
						{CurrentNumberUtils.numberWithCommas(
							_tickerCalculationData.highPrice,
							_tickerCalculationData.decimalDepth
						)}
					</span>
				</p>
				<p class="text-[12px] text-nowrap font-medium">
					저가 :
					<span class="text-blue-500">
						{CurrentNumberUtils.numberWithCommas(
							_tickerCalculationData.lowPrice,
							_tickerCalculationData.decimalDepth
						)}
					</span>
				</p>
			</div>
			<div class="w-[200px] content-around">
				<p class="inline-flex w-full text-[12px] text-nowrap font-medium justify-between">
					<span class="">
						거래량(24H):
					</span>
					<span class="">
						{CurrentNumberUtils.numberWithCommas(_tickerCalculationData.accTradeVolume24h, 0)}
					</span>
				</p>
				<p class="inline-flex w-full text-[12px] text-nowrap font-medium justify-between">
					<span>
						거래금액(24H):
					</span>
					<span>
						{CurrentNumberUtils.numberWithCommas(_tickerCalculationData.accTradePrice24h, 0)}
					</span>
				</p>
			</div>
		{/if}
	</div>
</header>

<main class="relative grid grid-flow-col w-full h-full p-4 gap-4 items-center justify-center overflow-y-auto">
	<div class="grid grid-flow-col w-[1000px] h-full gap-4 overflow-hidden">
		<div class="grid w-full gap-4 scrollbar-hide overflow-y-auto">
			<Card class="flex w-full h-[700px] overflow-hidden"
						padding="none"
						size="none">
				{#if data.marketInfo}
					<TradeInferenceEChartsComponent
						marketInfo={data.marketInfo} />
				{/if}
			</Card>
			<div class="grid grid-flow-col w-full gap-4 justify-between">
				<Card class="flex w-[480px] h-[500px] overflow-hidden"
							padding="none"
							size="none">
					<OrderBookComponent
						marketInfo={data.marketInfo}
					/>
				</Card>

				<Card class="flex w-[480px] h-[500px] overflow-hidden"
							padding="none"
							size="none">
					<OrderComponent
						marketInfo={data.marketInfo} />
				</Card>
			</div>
			<Card class="flex w-full h-[400px] overflow-hidden"
						padding="none"
						size="none">
				<NewsFeedScrapResultComponent
					marketInfo={data.marketInfo} />
			</Card>
		</div>
	</div>
	<div class="grid grid-flow-row w-[600px] h-full gap-4 scrollbar-hide overflow-x-hidden overflow-y-auto">
		<Card class="flex w-[600px] h-[700px] overflow-hidden"
					padding="none"
					size="none">
			<TradeMarketPriceComponent
				marketInfoList={data.marketInfoList} />
		</Card>
	</div>
</main>