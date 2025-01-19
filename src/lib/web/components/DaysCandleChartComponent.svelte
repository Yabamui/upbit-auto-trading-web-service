<script lang="ts">

	import type { CandleData } from '$lib/common/models/CandleData';
	import AnalyticsEChartsComponent from '$lib/web/components/AnalyticsEChartsComponent.svelte';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

	let { candleDataList, inferenceDataList, showMarkPoint, showMarkLine } = $props();

	const _dataZoomStart = 70;

	let _candleData: number[][] = $state([]);
	let _candleAccTradePriceData: number[][] = $state([]);
	let _xAxisData: string[] = $state([]);
	let _inferenceCandleData: {
		name: string;
		data: (string | number)[][];
	}[] = $state([]);

	$effect(() => {
		if (candleDataList.length > 0 || inferenceDataList.length > 0) {
			setData(candleDataList, inferenceDataList);
		}
	});

	function setData(candleDataList: CandleData[], inferenceDataList: CandleData[]) {

		_candleData = candleDataList.map((candleData) => {
			return [
				candleData.openingPrice,
				candleData.tradePrice,
				candleData.lowPrice,
				candleData.highPrice
			];
		});

		if (inferenceDataList.length > 0) {
			_inferenceCandleData = [
				{
					name: 'inferenceCandle',
					data: inferenceDataList.map((candleData) => {
						return [
							candleData.openingPrice,
							candleData.tradePrice,
							candleData.lowPrice,
							candleData.highPrice
						];
					})
				}
			];

			_candleAccTradePriceData = inferenceDataList.map((candleData, index) => {
				return [
					index,
					candleData.candleAccTradePrice,
					candleData.openingPrice > candleData.tradePrice ? 1 : -1
				];
			});

			_xAxisData = inferenceDataList.map((candleData) => {
				return CurrentDateUtils.convertFormat(candleData.candleDateTimeKst, CurrentDateUtils.dateFormat);
			});
		} else {

			_candleAccTradePriceData = candleDataList.map((candleData, index) => {
				return [
					index,
					candleData.candleAccTradePrice,
					candleData.openingPrice > candleData.tradePrice ? 1 : -1
				];
			});

			_xAxisData = candleDataList.map((candleData) => {
				return CurrentDateUtils.convertFormat(candleData.candleDateTimeKst, CurrentDateUtils.dateFormat);
			});
		}
	}
</script>

{#if _candleData.length > 0 && _candleAccTradePriceData.length > 0 && _xAxisData.length > 0}
	<div class="relative flex flex-col w-full h-full !bg-transparent gap-2">
		<AnalyticsEChartsComponent bind:candleData={_candleData}
															 bind:candleAccTradePriceData={_candleAccTradePriceData}
															 bind:xAxisData={_xAxisData}
															 bind:inferenceCandleData={_inferenceCandleData}
															 bind:showMarkPoint={showMarkPoint}
															 bind:showMarkLine={showMarkLine}
															 dataZoomStart={_dataZoomStart} />
	</div>
{/if}


