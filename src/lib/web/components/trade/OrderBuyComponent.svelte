<script lang="ts">

	import {
		Button,
		ButtonGroup,
		Input,
		Label,
		Radio
	} from 'flowbite-svelte';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		MinusIcon,
		PlusIcon,
		RotateCcwIcon
	} from 'lucide-svelte';
	import type { OrderBuyData } from '$lib/common/models/OrderData';
	import { orderBuyStore } from '$lib/stores/OrderStore';
	import Decimal from 'decimal.js';

	const orderBuyTypeEnum = {
		FIXED_PRICE: { key: 'FIXED_PRICE', value: '지정가' },
		MARKET_PRICE: { key: 'MARKET_PRICE', value: '시장가' },
		RESERVED_PRICE: { key: 'RESERVED_PRICE', value: '예약지정가' }
	};

	let {
		marketInfo
	}: {
		marketInfo: MarketInfoData,
	} = $props();

	let marketCode: string = $derived.by(() => {
		if (marketInfo) {
			const splitMarket = marketInfo.market.split('-');

			return splitMarket[1];
		} else {
			return '';
		}
	});

	let orderBuyTypeKey = $state(orderBuyTypeEnum.FIXED_PRICE.key);
	let maxOrderBuyPrice = $state(0);
	let orderBuyPrice = $state('0');
	let orderBuyCount = $state('0');
	let orderBuyTotalAmount = $state('0');

	let orderBuyPriceDecimalPlace: number = $state(0);
	let orderBuyPriceDecimalPlaceValue = $state(1);

	$effect(() => {
		if ($orderBuyStore) {
			setOrderBuyData($orderBuyStore);
		}
	});

	function setOrderBuyData(orderBuyData: OrderBuyData | undefined) {

		if (orderBuyData && orderBuyData.market === marketInfo.market) {
			orderBuyPrice = orderBuyData.orderBuyPrice.toString();

			orderBuyCount = orderBuyData.orderBuyCount.toString();
			orderBuyPriceDecimalPlace = orderBuyData.priceDecimalPlace;

			orderBuyPriceDecimalPlaceValue = CurrentNumberUtils.getDecimalPlaceValue(orderBuyData.priceDecimalPlace);

			if (orderBuyData.orderBuyPrice && orderBuyData.orderBuyPrice) {
				orderBuyTotalAmount = calculateOrderBuyTotalAmount(
					orderBuyData.orderBuyPrice.toString(),
					orderBuyData.orderBuyCount.toString()
				);
			}
		}
	}

	function onclickOrderBuyPricePlus() {
		const priceDecimal = new Decimal(orderBuyPrice);
		const priceDecimalPlaceValue = new Decimal(orderBuyPriceDecimalPlaceValue);

		const plusPriceDecimal = priceDecimal.plus(priceDecimalPlaceValue);

		orderBuyPrice = plusPriceDecimal.toString();

		if (orderBuyCount) {
			orderBuyTotalAmount = calculateOrderBuyTotalAmount(orderBuyPrice, orderBuyCount);
		}
	}

	function onclickOrderBuyPriceMinus() {
		const priceDecimal = new Decimal(orderBuyPrice);
		const priceDecimalPlaceValue = new Decimal(orderBuyPriceDecimalPlaceValue);

		const minusPriceDecimal = priceDecimal.minus(priceDecimalPlaceValue);

		orderBuyPrice = minusPriceDecimal.toString();

		if (orderBuyCount) {
			orderBuyTotalAmount = calculateOrderBuyTotalAmount(orderBuyPrice, orderBuyCount);
		}
	}

	function inputOrderBuyPrice() {
		orderBuyTotalAmount = calculateOrderBuyTotalAmount(orderBuyPrice, orderBuyCount);
	}

	function oninputOrderBuyCount() {
		orderBuyTotalAmount = calculateOrderBuyTotalAmount(orderBuyPrice, orderBuyCount);
	}

	function calculateOrderBuyTotalAmount(price: string, count: string) {
		const priceDecimal = new Decimal(price);
		const countDecimal = new Decimal(count);

		return CurrentNumberUtils.numberWithCommas(
			priceDecimal.mul(countDecimal).ceil().toNumber(),
			0
		);

	}

	function inputOrderBuyTotalAmount() {
		const cleared = orderBuyTotalAmount.replaceAll(',', '');

		if (!cleared) {
			orderBuyTotalAmount = '0';
			return;
		}

		const totalAmountDecimal = new Decimal(cleared);

		orderBuyTotalAmount = CurrentNumberUtils.numberWithCommas(totalAmountDecimal.toNumber(), 0);

		if (orderBuyPrice) {
			const priceDecimal = new Decimal(orderBuyPrice);

			const decimalValue = 100000000;

			orderBuyCount = totalAmountDecimal.div(priceDecimal).mul(decimalValue).floor().div(decimalValue).toString();
		}
	}
</script>


<div class="flex flex-col w-full h-[450px] justify-items-stretch divide-y">
	<div class="flex flex-col w-full h-full gap-4 p-4">
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				주문 유형
			</div>

			<div class="flex gap-2 items-center">
				{#each Object.values(orderBuyTypeEnum) as orderBuyType}
					<Radio
						bind:group={orderBuyTypeKey}
						value={orderBuyType.key}
					>
						{orderBuyType.value}
					</Radio>
				{/each}
			</div>
		</Label>

		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				주문 가능
			</div>

			<div class="w-[300px] gap-2 items-center text-end">
				{CurrentNumberUtils.numberWithCommas(maxOrderBuyPrice, 0)} KRW
			</div>
		</Label>

		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				매수가격 (KRW)
			</div>

			<div class="w-[300px] gap-2 items-center">
				<ButtonGroup class="w-full">
					<Input
						type="number"
						bind:value={orderBuyPrice}
						oninput={inputOrderBuyPrice}
						step={orderBuyPriceDecimalPlaceValue}
						class="w-full text-end p-2"
					/>
					<Button
						class="py-0 px-2 border-r border-y focus:ring-1 focus:ring-primary-500"
						onclick={onclickOrderBuyPriceMinus}
						color="none">
						<MinusIcon />
					</Button>
					<Button
						class="py-0 px-2 border-r border-y focus:ring-1 focus:ring-primary-500"
						onclick={onclickOrderBuyPricePlus}
						color="none">
						<PlusIcon />
					</Button>
				</ButtonGroup>
			</div>
		</Label>

		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				주문수량 ({marketCode})
			</div>

			<div class="w-[300px] gap-2 items-center">
				<Input
					type="number"
					bind:value={orderBuyCount}
					oninput={oninputOrderBuyCount}
					maxlength={0.0000001}
					class="w-full text-end p-2"
				/>
			</div>
		</Label>

		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				주문총액 (KRW)
			</div>

			<div class="w-[300px] gap-2 items-center">
				<Input
					type="text"
					bind:value={orderBuyTotalAmount}
					oninput={() => inputOrderBuyTotalAmount()}
					class="w-full text-end p-2"
				/>
			</div>
		</Label>
	</div>

	<div class="flex w-full items-center justify-between p-4">
		<Button
			color="light"
			class="w-[100px] p-2"
		>
			초기화
			<RotateCcwIcon class="w-4 h-4 ml-2" />
		</Button>
		<Button
			color="primary"
			class="w-[300px] p-2"
		>
			주문하기
		</Button>
	</div>
</div>