<script lang="ts">

	import { onMount } from 'svelte';
	import moment from 'moment/moment';
	import type { CandleData } from '$lib/common/models/CandleData';
	import { CandleWebApi } from '$lib/web/request/CandleWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { currentMarketCodeStore } from '$lib/stores/MarketStore';
	import {
		type UPBitCandleUnitCodeData,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import {
		Button,
		Dropdown,
		DropdownItem
	} from 'flowbite-svelte';
	import {
		ChevronDownOutline,
		PlayOutline,
		StopSolid
	} from 'flowbite-svelte-icons';
	import ChartsComponent from '$lib/web/components/EChartsComponent.svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';

	let { marketCode } = $props();

	const _chartCount: number = 200;

	let _initYn = false;
	let _CandleUnitCode: UPBitCandleUnitCodeData = $state.raw(UPBitCandleUnitEnum.minutes);
	let _chartDropOpenYn = $state(false);
	let _playYn = $state(false);

	let _seriesData: number[][] = $state([]);
	let _seriesBarData: number[][] = $state([]);
	let _xAxisData: string[] = $state([]);

	onMount(async () => {
		await setCandleData(marketCode);
		_initYn = true;
	});

	$inspect(marketCode)
		.with(async () => {
			if (_initYn) {
				await setCandleData(marketCode);
			}
		});

	$effect(() => {
		const interval = setInterval(async () => {
			if (_playYn) {
				await setCandleData(marketCode);
			}
		}, 5000);

		return () => {
			clearInterval(interval);
		};
	});

	async function setCandleData(marketCode: string) {
		const candleDatList: CandleData[] = await getCandleDataList(marketCode);

		_seriesData = candleDatList.map((candleData) => {
			return [
				candleData.openingPrice,
				candleData.tradePrice,
				candleData.lowPrice,
				candleData.highPrice
			];
		});

		_seriesBarData = candleDatList.map((candleData, index) => {
			return [
				index,
				candleData.candleAccTradePrice,
				candleData.openingPrice > candleData.tradePrice ? 1 : -1
			];
		});

		_xAxisData = candleDatList.map((candleData) => {
			return moment(candleData.timestamp)
				.format('HH:mm');
		});
	}

	async function getCandleDataList(marketCode: string) {

		const responseObject: ResponseObject<unknown> = await CandleWebApi.getCandleList(
			marketCode,
			_CandleUnitCode.key,
			_chartCount,
			''
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return [];
		}

		return (responseObject.data as CandleData[]).reverse();
	}

	async function clickChartDropItem(unit: UPBitCandleUnitCodeData) {

		_chartDropOpenYn = false;

		if (_CandleUnitCode.name === unit.name) {
			return;
		}

		_CandleUnitCode = unit;

		await setCandleData($currentMarketCodeStore);
	}
</script>

<div class="relative flex flex-col w-full h-full !bg-transparent gap-2">
	<div class="flex w-full items-center justify-between border-b border-gray-300 dark:border-gray-700">
		<Button color="light"
						pill
						id="candle-unit"
						size="sm"
						class="focus:ring-0">
			{_CandleUnitCode.name}
			<ChevronDownOutline class="w-5 h-5 ms-2" />
		</Button>
		<Dropdown placement="bottom"
							bind:open={_chartDropOpenYn}
							triggeredBy="#candle-unit">
			{#each Object.values(UPBitCandleUnitEnum) as item}
				<DropdownItem onclick={async () => clickChartDropItem(item)}>
					{item.name}
				</DropdownItem>
			{/each}
		</Dropdown>
		<button type="button"
						onclick={() => _playYn = !_playYn}
						class="rounded-full text-center inline-flex items-center p-2.5
						text-gray-500  dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
			{#if _playYn}
				<StopSolid />
			{:else}
				<PlayOutline />
			{/if}
		</button>
	</div>

	{#if _seriesData.length > 0 && _seriesBarData.length > 0 && _xAxisData.length > 0}
		<ChartsComponent bind:seriesData={_seriesData}
										 bind:seriesBarData={_seriesBarData}
										 bind:xAxisData={_xAxisData} />
	{/if}
</div>


