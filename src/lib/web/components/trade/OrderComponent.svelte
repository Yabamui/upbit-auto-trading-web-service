<script lang="ts">
	import { userStore } from '$lib/stores/UserStore';
	import type { UserInfoData } from '$lib/common/models/UserInfoData';
	import {
		TabItem,
		Tabs
	} from 'flowbite-svelte';
	import OrderBuyComponent from '$lib/web/components/trade/OrderBuyComponent.svelte';
	import OrderSellComponent from '$lib/web/components/trade/OrderSellComponent.svelte';
	import OrderHistoryComponent from '$lib/web/components/trade/OrderHistoryComponent.svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';

	const orderTabEnum = {
		BUY: {
			key: 'BUY',
			value: '매수'
		},
		SELL: {
			key: 'SELL',
			value: '매도'
		},
		HISTORY: {
			key: 'HISTORY',
			value: '거래내역'
		}
	};

	let {
		marketInfo
	}: {
		marketInfo: MarketInfoData
	} = $props();

	let userInfo: UserInfoData | undefined = $derived.by(() => {
		if ($userStore) {
			return $userStore;
		} else {
			return undefined;
		}
	});

	let orderTabKey = $state(orderTabEnum.BUY.key);

</script>

{#key marketInfo.market}
	<div class="relative w-full h-full">
		<Tabs
			contentClass="flex-none w-full h-full bg-gray-50 rounded-lg dark:bg-gray-800"
			tabStyle="underline">
			{#each Object.values(orderTabEnum) as orderTab}
				<TabItem
					title={orderTab.value}
					open={orderTab.key === orderTabKey}>
					{#if orderTab.key === orderTabEnum.BUY.key}
						<OrderBuyComponent
							marketInfo={marketInfo} />
					{:else if orderTab.key === orderTabEnum.SELL.key}
						<OrderSellComponent />
					{:else if orderTab.key === orderTabEnum.HISTORY.key}
						<OrderHistoryComponent />
					{/if}
				</TabItem>
			{/each}
		</Tabs>
	</div>
{/key}