<script lang="ts">
	import {
		AiResponseModelDataUtils,
		type AiResponseModelPropertyItem
	} from '$lib/common/models/AiResponseModelsData';
	import {
		Button,
		ButtonGroup,
		Card,
		Dropdown,
		DropdownItem,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Toast
	} from 'flowbite-svelte';
	import {
		ArrowUpDownOutline,
		ChartMixedOutline,
		CheckPlusCircleOutline,
		ChevronDownOutline,
		CloseCircleSolid,
		RefreshOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import type { CandleData } from '$lib/common/models/CandleData';
	import type { AiResponsesData } from '$lib/common/models/AiResponsesData';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { CandleWebApi } from '$lib/web/api/CandleWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { AiAnalyticsWebApi } from '$lib/web/api/AiAnalyticsWebApi';
	import { onDestroy } from 'svelte';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import AiResponseDeleteModalComponent from '$lib/web/components/modals/AiResponseDeleteModalComponent.svelte';
	import {
		type UPBitCandleUnitCodeData,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import type {
		AiAnalyticsCandleData,
		AiAnalyticsCandleItemData
	} from '$lib/common/models/AiAnalyticsData';
	import AnalyticsEChartsComponent2 from '$lib/web/components/AnalyticsEChartsComponent2.svelte';

	let { marketInfo } = $props();

	let _candleDataList: CandleData[] = $state.raw([]);
	let _aiResponsesDataList: AiResponsesData[] = $state.raw([]);
	let _aiResponsesItemTableIdList: number[] = $state.raw([]);
	let _aiResponsesRemoveModalOpenYn: boolean = $state(false);
	let _aiResponsesDeleteId: number = $state(0);
	let _candleDataListRefreshYn: boolean = $state(false);
	let _showMarkPoint: boolean = $state(false);
	let _showMarkLine: boolean = $state(false);
	let _candleUnitCode: UPBitCandleUnitCodeData = $state(UPBitCandleUnitEnum.days);
	let _chartDropOpenYn: boolean = $state(false);
	let _chartViewCount: number = $state(200);
	let _alertMessageList: string[] = $state([]);
	let _marketCandleData: AiAnalyticsCandleData | undefined = $state(undefined);
	let _inferenceCandleData: AiAnalyticsCandleData | undefined = $state(undefined);
	let _candleAccTradePriceData: number[][] = $state([]);
	let _xAxisData: string[] = $state([]);
	let _dataZoomStart = $state(70);
	let _chartClearYn: boolean = $state(false);

	$effect(() => {
		updateData(marketInfo);
	});

	onDestroy(() => {
		clearData();
	});

	async function clearData() {
		_candleDataList = [];
		_aiResponsesDataList = [];
		_aiResponsesItemTableIdList = [];
	}

	async function updateData(marketInfo: MarketInfoData) {
		if (!marketInfo) {
			return;
		}

		_chartClearYn = true;

		await clearData();

		await getMarketCandleDaysList(marketInfo.market);

		await getAiAnalyticsAiResponses(marketInfo.market);

		await refreshInferenceData();
	}

	async function refreshCandleDataList() {
		_candleDataListRefreshYn = true;
		await CandleWebApi.updateCandleDays(marketInfo.market);
		await updateData(marketInfo);
		_candleDataListRefreshYn = false;
	}

	async function getMarketCandleDaysList(market: string) {

		_candleDataList = [];

		const responseObject = await CandleWebApi.getCandleList(
			market,
			_candleUnitCode.key,
			_chartViewCount,
			''
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alertTrigger(responseObject.message);
			return;
		}

		_candleDataList = (responseObject.data as CandleData[]).reverse();
	}

	async function getAiAnalyticsAiResponses(market: string) {
		_aiResponsesDataList = [];
		_aiResponsesItemTableIdList = [];

		const responseObject = await AiAnalyticsWebApi.getAiResponsesList(market);

		if (ResponseCode.success.code !== responseObject.code) {
			alertTrigger(responseObject.message);
			return;
		}

		_aiResponsesDataList = responseObject.data as AiResponsesData[];
	}

	async function addInferenceData(aiResponseData: AiResponsesData | undefined = undefined) {
		_marketCandleData = undefined;
		_inferenceCandleData = undefined;
		_candleAccTradePriceData = [];
		_xAxisData = [];

		if (!aiResponseData || _candleUnitCode.key !== aiResponseData.candleType) {
			await setMarketCandleItem();
			return;
		}

		await setMarketCandleItemWithInference(aiResponseData);
	}

	async function setMarketCandleItem() {
		const formatString = CurrentDateUtils.getFormat(_candleUnitCode.key);

		const candleRecord = _candleDataList.reduce((acc, item) => {
			const dateTime: string = CurrentDateUtils.convertFormat(item.candleDateTimeKst, formatString);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, CandleData>);

		const dateTimeSet = new Set([
			...Object.keys(candleRecord)
		]);

		const marketCandleItemList: AiAnalyticsCandleItemData[] = [];

		for (let string of dateTimeSet) {

			const marketCandleItem = candleRecord[string];

			marketCandleItemList.push({
				openingPrice: marketCandleItem?.openingPrice || undefined,
				tradePrice: marketCandleItem?.tradePrice || undefined,
				lowPrice: marketCandleItem?.lowPrice || undefined,
				highPrice: marketCandleItem?.highPrice || undefined,
				candleAccTradePrice: marketCandleItem?.candleAccTradePrice || undefined,
				candleDateTimeKst: string
			});

			_xAxisData.push(string);

			_candleAccTradePriceData.push([
				_candleAccTradePriceData.length,
				candleRecord[string]?.candleAccTradePrice || 0,
				candleRecord[string]?.openingPrice > candleRecord[string]?.tradePrice ? 1 : -1
			]);
		}

		_marketCandleData = {
			candleName: marketInfo.koreanName,
			itemList: marketCandleItemList,
			highColor: '#FF0000',
			lowColor: '#0000FF',
			highBorderColor: '#FF0000',
			lowBorderColor: '#0000FF'
		};

		_inferenceCandleData = undefined;
	}

	async function setMarketCandleItemWithInference(aiResponseData: AiResponsesData) {
		const formatString = CurrentDateUtils.getFormat(_candleUnitCode.key);

		const candleRecord = _candleDataList.reduce((acc, item) => {
			const dateTime: string = CurrentDateUtils.convertFormat(
				item.candleDateTimeKst,
				formatString
			);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, CandleData>);

		const responseProperty = AiResponseModelDataUtils.toAiResponseModelProperty(aiResponseData.response);

		let inferenceRecord = responseProperty.items.reduce((acc, item) => {
			const dateTimeString = item.date + ' ' + item.time;

			const dateTime: string = CurrentDateUtils.convertFormatWithTimeZone(
				dateTimeString, formatString, aiResponseData.candleTimeZone);

			acc[dateTime] = item;
			return acc;
		}, {} as Record<string, AiResponseModelPropertyItem>);

		const dateTimeSet = new Set([
			...Object.keys(candleRecord),
			...Object.keys(inferenceRecord)
		]);

		const marketCandleItemList: AiAnalyticsCandleItemData[] = [];
		const inferenceItemList: AiAnalyticsCandleItemData[] = [];

		for (let string of dateTimeSet) {

			const marketCandleItem = candleRecord[string];
			const inferenceItem = inferenceRecord[string];

			marketCandleItemList.push({
				openingPrice: marketCandleItem?.openingPrice || undefined,
				tradePrice: marketCandleItem?.tradePrice || undefined,
				lowPrice: marketCandleItem?.lowPrice || undefined,
				highPrice: marketCandleItem?.highPrice || undefined,
				candleAccTradePrice: marketCandleItem?.candleAccTradePrice || undefined,
				candleDateTimeKst: string
			});

			inferenceItemList.push({
				openingPrice: inferenceItem?.openPrice || undefined,
				tradePrice: inferenceItem?.closePrice || undefined,
				lowPrice: inferenceItem?.lowPrice || undefined,
				highPrice: inferenceItem?.highPrice || undefined,
				candleAccTradePrice: 0,
				candleDateTimeKst: string
			});

			_xAxisData.push(string);

			_candleAccTradePriceData.push([
				_candleAccTradePriceData.length,
				candleRecord[string]?.candleAccTradePrice || 0,
				candleRecord[string]?.openingPrice > candleRecord[string]?.tradePrice ? 1 : -1
			]);
		}

		_marketCandleData = {
			candleName: marketInfo.koreanName,
			itemList: marketCandleItemList,
			highColor: '#FF0000',
			lowColor: '#0000FF',
			highBorderColor: '#FF0000',
			lowBorderColor: '#0000FF'
		};

		_inferenceCandleData = {
			candleName: aiResponseData.createdAt,
			itemList: inferenceItemList,
			highColor: undefined,
			lowColor: undefined,
			highBorderColor: '#FF0000',
			lowBorderColor: '#0000FF'
		};
	}

	async function deleteAiResponses(id: number) {
		_aiResponsesDeleteId = id;
		_aiResponsesRemoveModalOpenYn = true;
	}

	async function deleteAiResponsesCallback() {
		await getAiAnalyticsAiResponses(marketInfo.market);

		await refreshInferenceData();
	}

	async function clickCandleUnitDropItem(item: UPBitCandleUnitCodeData) {
		_candleUnitCode = item;
		_chartDropOpenYn = false;

		_candleDataList = [];
		_chartClearYn = true;

		await getMarketCandleDaysList(marketInfo.market);

		await refreshInferenceData();
	}

	async function refreshInferenceData() {
		if (_aiResponsesDataList.length > 0) {
			const aiResponseData = _aiResponsesDataList.find((item) => {
				return item.candleType === _candleUnitCode.key;
			});

			await addInferenceData(aiResponseData);
		} else {
			await addInferenceData();
		}
	}

	function alertTrigger(alertMessage: string) {
		_toastStatus = true;
		_alertMessageList.push(alertMessage);

		setTimeout(() => {
			_toastStatus = false;
			_alertMessageList = [];
		}, 3000);
	}

	let _toastStatus = $state(false);
</script>


<div class="flex flex-col w-full">
	<Card class="flex w-full"
				size="none">
		<div class="flex w-full items-center justify-between">
			<ButtonGroup>
				<Button color="light"
								pill
								id="candle-unit"
								size="sm"
								class="focus:ring-0">
					{_candleUnitCode.name}
					<ChevronDownOutline class="w-5 h-5 ms-2" />
				</Button>
				<Dropdown placement="bottom"
									bind:open={_chartDropOpenYn}
									triggeredBy="#candle-unit">
					{#each Object.values(UPBitCandleUnitEnum) as item}
						<DropdownItem onclick={async () => clickCandleUnitDropItem(item)}>
							{item.name}
						</DropdownItem>
					{/each}
				</Dropdown>
			</ButtonGroup>
			<ButtonGroup class="*:!ring-0">
				<Button
					on:click={refreshCandleDataList}
					disabled={_candleDataListRefreshYn}>
					{#if _candleDataListRefreshYn}
						<Spinner class="w-5 h-5"
										 size="4" />
					{:else}
						<RefreshOutline />
					{/if}
				</Button>
				<Button
					color={_showMarkPoint ? 'green' : 'light'}
					onclick={() => _showMarkPoint = !_showMarkPoint}>
					<CheckPlusCircleOutline class="w-5 h-5" />
				</Button>
				<Button
					color={_showMarkLine ? 'green' : 'light'}
					onclick={() => _showMarkLine = !_showMarkLine}>
					<ArrowUpDownOutline class="w-5 h-5" />
				</Button>
			</ButtonGroup>
		</div>
		{#if _marketCandleData}
			<div class="relative flex flex-col w-full h-full !bg-transparent gap-2">
				<AnalyticsEChartsComponent2 bind:marketCandleData={_marketCandleData}
																		bind:candleAccTradePriceData={_candleAccTradePriceData}
																		bind:xAxisData={_xAxisData}
																		bind:inferenceCandleData={_inferenceCandleData}
																		bind:showMarkPoint={_showMarkPoint}
																		bind:showMarkLine={_showMarkLine}
																		bind:dataZoomStart={_dataZoomStart}
																		bind:chartClearYn={_chartClearYn} />
			</div>
		{/if}
	</Card>


	<Card class="flex w-full"
				size="none">
		{#if _aiResponsesDataList.length > 0}
			{#each _aiResponsesDataList as item}
				{#if item.candleType === _candleUnitCode.key}
					{@const property = AiResponseModelDataUtils.toAiResponseModelProperty(item.response)}
					<Table divClass="relative overflow-x-auto">
						<TableHead>
							<TableHeadCell class="!px-3">
								<Button color="none"
												onclick={() => addInferenceData(item)}
												data-collapse-toggle="mobile-menu-3"
												aria-controls="mobile-menu-3"
												aria-expanded="false"
												class="rounded-lg text-sm p-2.5 me-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-0">
									<ChartMixedOutline />
								</Button>
							</TableHeadCell>
							<TableHeadCell class="p-3">
								{item.createdAt}
							</TableHeadCell>
							<TableHeadCell class="whitespace-nowrap p-3">
								{item.aiModelName}
							</TableHeadCell>
							<TableHeadCell class="p-3">
								{property.totalJudgementKr}
							</TableHeadCell>
							<TableHeadCell class="!px-3">
								<Button color="none"
												onclick={() => deleteAiResponses(item.id)}
												data-collapse-toggle="mobile-menu-3"
												aria-controls="mobile-menu-3"
												aria-expanded="false"
												class="rounded-lg text-sm p-2.5 me-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
									<TrashBinOutline />
								</Button>
							</TableHeadCell>
							<TableHeadCell class="!px-3">
								<Button color="none"
												onclick={() => {
														_aiResponsesItemTableIdList = _aiResponsesItemTableIdList.includes(item.id)
															? _aiResponsesItemTableIdList.filter((id) => id !== item.id)
															: [..._aiResponsesItemTableIdList, item.id];
													}}
												data-collapse-toggle="mobile-menu-3"
												aria-controls="mobile-menu-3"
												aria-expanded="false"
												class="rounded-lg text-sm p-2.5 me-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
									<ChevronDownOutline />
								</Button>
							</TableHeadCell>
						</TableHead>
					</Table>

					{#if _aiResponsesItemTableIdList.includes(item.id)}
						<Table divClass="relative overflow-x-auto">
							<TableHead>
								<TableHeadCell class="p-3">
									Day
								</TableHeadCell>
								<TableHeadCell class="p-3">
									Evaluation
								</TableHeadCell>
								<TableHeadCell class="p-3">
									Judgement Basis
								</TableHeadCell>
								<TableHeadCell class="p-3">
									Open Price
								</TableHeadCell>
								<TableHeadCell class="p-3">
									High Price
								</TableHeadCell>
								<TableHeadCell class="p-3">
									Low Price
								</TableHeadCell>
								<TableHeadCell class="p-3">
									Close Price
								</TableHeadCell>
							</TableHead>
							<TableBody>
								{#each property.items as propertyItem}
									<TableBodyRow class="text-xs whitespace-normal">
										<TableBodyCell tdClass="p-2">
											{propertyItem.date} {propertyItem.time}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.evaluation}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.judgementBasisKr ? propertyItem.judgementBasisKr : propertyItem.judgementBasis}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.openPrice || 0}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.highPrice}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.lowPrice}
										</TableBodyCell>
										<TableBodyCell tdClass="p-2">
											{propertyItem.closePrice || 0}
										</TableBodyCell>
									</TableBodyRow>
								{/each}
							</TableBody>
						</Table>
					{/if}
				{/if}
			{/each}
		{/if}
	</Card>
</div>

<AiResponseDeleteModalComponent
	bind:modalOpenYn={_aiResponsesRemoveModalOpenYn}
	bind:id={_aiResponsesDeleteId}
	{deleteAiResponsesCallback} />

<Toast color="red"
			 align={false}
			 dismissable={false}
			 position="bottom-right"
			 class="fixed"
			 bind:toastStatus={_toastStatus}>
	<svelte:fragment slot="icon">
		<CloseCircleSolid class="w-5 h-5" />
		<span class="sr-only">Error icon</span>
	</svelte:fragment>
	<div class="ms-3 text-sm font-normal">
		{#each _alertMessageList as _alertMessage}
			<div class="mb-2 text-sm font-normal">
				{_alertMessage}
			</div>
		{/each}
	</div>
</Toast>
