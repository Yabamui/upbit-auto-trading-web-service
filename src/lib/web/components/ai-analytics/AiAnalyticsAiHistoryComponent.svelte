<script lang="ts">
	import {
		Badge,
		Button,
		Card,
		Popover,
		Select,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import {
		ChartMixedOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import type {
		AiInferenceData,
		AiInferenceItemData
	} from '$lib/common/models/AiResponsesData';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import { onDestroy } from 'svelte';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import AiResponseDeleteModalComponent from '$lib/web/components/modals/AiResponseDeleteModalComponent.svelte';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import type {
		AiAnalyticsHistoryEChartInferenceItemData,
		AiAnalyticsHistoryEChartRequestData
	} from '$lib/common/models/AiAnalyticsData';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';
	import type { AiModelData } from '$lib/common/models/AiModelData';
	import AiAnalyticsAiHistoryEChartsComponent
		from '$lib/web/components/ai-analytics/AiAnalyticsAiHistoryEChartsComponent.svelte';
	import {
		ChevronDownIcon,
		ChevronUpIcon,
		InfoIcon
	} from 'lucide-svelte';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';

	let {
		marketInfo,
		aiModelList,
		aiResponsesDeleteCallback,
	}: {
		marketInfo: MarketInfoData;
		aiModelList: AiModelData[];
		aiResponsesDeleteCallback: () => void;
	} = $props();

	let _candleUnit: string = $state(UPBitCandleUnitEnum.days.key);
	let _candleTimeZone: string = $state(UPBitCandleTimeZones.utc);
	let _aiInferenceByCandleUnitRecord: Record<string, AiInferenceData[]> = $state({});
	let _aiResponsesItemTableIdList: number[] = $state.raw([]);
	let _aiResponsesRemoveModalOpenYn: boolean = $state(false);
	let _aiResponsesDeleteId: number = $state(0);

	let _alertMessage: string = $state('');
	let _chartClearYn: boolean = $state(false);

	let _aiResponsesIdList: number[] = $state([]);
	let _eChartRequestData: AiAnalyticsHistoryEChartRequestData | undefined = $state(undefined);

	$effect(() => {
		updateData(marketInfo);
	});

	onDestroy(() => {
		_aiResponsesItemTableIdList = [];
	});

	async function updateData(marketInfo: MarketInfoData) {
		if (!marketInfo) {
			return;
		}

		_aiResponsesIdList = [];
		_eChartRequestData = getDefaultEChartRequestData();

		Promise.all([
				getAiInferenceByCandleUnitRecord(marketInfo.market)
			])
			.then(() => {
				refreshInferenceData();
			});
	}

	function getDefaultEChartRequestData() {
		return {
			market: marketInfo.market,
			marketName: marketInfo.koreanName,
			candleUnit: _candleUnit,
			candleTimeZone: _candleTimeZone,
			dateTimeFormat: CurrentDateUtils.getFormat(_candleUnit),
			inferenceList: []
		};
	}

	async function getAiInferenceByCandleUnitRecord(market: string) {
		_aiInferenceByCandleUnitRecord = {};
		_aiResponsesItemTableIdList = [];

		const responseObject = await AiAnalyticsWebApi.getAiResponsesList(market);

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = responseObject.message;
			return;
		}

		const aiInferenceList = responseObject.data as AiInferenceData[];

		_aiInferenceByCandleUnitRecord = aiInferenceList.reduce((acc, aiInference) => {
			if (!acc[aiInference.candleUnit]) {
				acc[aiInference.candleUnit] = [];
			}

			acc[aiInference.candleUnit].push(aiInference);
			return acc;
		}, {} as Record<string, AiInferenceData[]>);
	}

	async function deleteAiResponses(id: number) {
		_aiResponsesDeleteId = id;
		_aiResponsesRemoveModalOpenYn = true;
	}

	async function deleteAiResponsesCallback(deletedAiResponsesId: number) {
		await getAiInferenceByCandleUnitRecord(marketInfo.market);

		await removeInferenceList(deletedAiResponsesId);

		aiResponsesDeleteCallback();
	}

	async function refreshInferenceData() {
		if (_aiInferenceByCandleUnitRecord && _aiInferenceByCandleUnitRecord[_candleUnit]) {
			const aiInference = _aiInferenceByCandleUnitRecord[_candleUnit][0];

			await onclickAiResponsesChart(aiInference);

		} else {
			_eChartRequestData = getDefaultEChartRequestData();
		}
	}

	function onchangeCandleUnit() {
		// getCandleList(marketInfo.market).then(() => {
		// 	refreshInferenceData();
		// })
	}

	async function onclickAiResponsesChart(aiInference: AiInferenceData) {

		if (!_eChartRequestData) {
			_eChartRequestData = getDefaultEChartRequestData();
		}

		if (_aiResponsesIdList.includes(aiInference.aiResponsesId)) {
			await removeInferenceList(aiInference.aiResponsesId);
			return;
		}

		_aiResponsesIdList = [..._aiResponsesIdList, aiInference.aiResponsesId];

		const dateTimeFormat = _eChartRequestData.dateTimeFormat;
		const timeZone = _eChartRequestData.candleTimeZone;

		const eChartInferenceItemDataByDateTimeRecord = aiInference.itemList.reduce((acc, item: AiInferenceItemData) => {
			const dateTime = UPBitCandleTimeZones.utc === timeZone ?
				CurrentDateUtils.convertFormat(item.dateTime, dateTimeFormat) :
				CurrentDateUtils.addHoursByString(item.dateTime, 9, dateTimeFormat);

			acc[dateTime] = {
				openingPrice: item.openPrice,
				tradePrice: item.closePrice,
				lowPrice: item.lowPrice,
				highPrice: item.highPrice
			};
			return acc;
		}, {} as Record<string, AiAnalyticsHistoryEChartInferenceItemData>);

		const aiModelName = aiModelList.find((item) => item.id === aiInference.aiModelId)?.modelName || '';

		const inferenceList = _eChartRequestData.inferenceList;

		inferenceList.push({
			id: aiInference.aiResponsesId,
			aiModelName: aiModelName,
			createdAt: aiInference.aiResponsesCreatedAt,
			inferenceItemByDateTimeRecord: eChartInferenceItemDataByDateTimeRecord
		});

		_eChartRequestData.inferenceList = inferenceList;
	}

	async function removeInferenceList(id: number) {
		if (_aiResponsesIdList.includes(id)) {
			_aiResponsesIdList = _aiResponsesIdList.filter((item) => item !== id);
		}

		if (_eChartRequestData) {
			_eChartRequestData.inferenceList = _eChartRequestData.inferenceList
				.filter((item) => item.id !== id);
		}
	}

	function onclickShowAiResponsesDetail(aiResponsesId: number) {
		if (_aiResponsesItemTableIdList.includes(aiResponsesId)) {
			_aiResponsesItemTableIdList = _aiResponsesItemTableIdList.filter((id) => id !== aiResponsesId);
		} else {
			_aiResponsesItemTableIdList = [..._aiResponsesItemTableIdList, aiResponsesId];
		}
	}
</script>


<div class="flex flex-row w-full gap-4">
	<Card class="flex min-w-[800px] h-[400px] p-4 overflow-hidden"
				padding="none"
				size="none">
		{#if _eChartRequestData}
			<AiAnalyticsAiHistoryEChartsComponent
				eChartRequestData={_eChartRequestData}
				bind:chartClearYn={_chartClearYn} />
		{/if}
	</Card>

	<Card class="flex-none w-[600px] h-[400px] px-4 pb-4 overflow-hidden"
				padding="none"
				size="none">
		<div class="flex w-full px-4 py-2 border-b items-center justify-between">
			<div class="text-[24px] font-bold">
				Ai Analytics Response History
			</div>
			<Select bind:value={_candleUnit}
							placeholder=""
							class="w-[80px] py-0.5 text-[12px]"
							onchange={onchangeCandleUnit}
							size="sm">
				<option class="text-[12px]"
								value={UPBitCandleUnitEnum.days.key}>
					{UPBitCandleUnitEnum.days.key}
				</option>
				<option class="text-[12px]"
								value={UPBitCandleUnitEnum.hours.key}>
					{UPBitCandleUnitEnum.hours.key}
				</option>
			</Select>
		</div>
		{#if _aiInferenceByCandleUnitRecord}
			<Table divClass="relative overflow-x-auto"
						 class="table-fixed">
				<TableBody>
					{#each _aiInferenceByCandleUnitRecord[_candleUnit] as item}
						{@const aiModelName = aiModelList.find((model) => model.id === item.aiModelId)?.modelName || ''}
						<TableBodyRow>
							<TableBodyCell class="px-0 py-1 items-center text-center">
								<Button
									color={_aiResponsesIdList.includes(item.aiResponsesId) ? 'green' : 'none'}
									class="text-[12px] p-2 focus:ring-1"
									onclick={() => onclickAiResponsesChart(item)}>
									<ChartMixedOutline class="w-4 h-4" />
								</Button>
							</TableBodyCell>
							<TableBodyCell class="px-0 py-1 text-[10px] font-bold items-center text-center text-wrap">
								{CurrentDateUtils.convertFormat(item.aiResponsesCreatedAt, 'YYYY-MM-DD')}
								<br />
								{CurrentDateUtils.convertFormat(item.aiResponsesCreatedAt, 'HH:mm')}
							</TableBodyCell>
							<TableBodyCell class="px-0 py-1 text-[10px] items-center text-center">
								<Button
									type="button"
									id={`total-judgement-${item.aiResponsesId}`}
									color="light"
									class="text-[10px] p-1 focus:ring-1">
									<InfoIcon class="w-4 h-4" />
								</Button>
								<Popover
									triggeredBy={`#total-judgement-${item.aiResponsesId}`}
									arrow={false}
									title="Total Judgement"
									placement="left"
									class="w-72 text-sm">
									<div class="p-2 text-left text-pretty">
										{item.totalJudgementKr}
									</div>
								</Popover>
							</TableBodyCell>
							<TableBodyCell class="px-0 py-1 text-[10px] font-bold items-center text-center text-wrap">
								{aiModelName}
							</TableBodyCell>
							<TableBodyCell class="px-0 py-1 items-center text-center">
								<Button color="none"
												class="text-[12px] p-2 focus:ring-0"
												onclick={() => deleteAiResponses(item.aiResponsesId)}>
									<TrashBinOutline class="w-4 h-4" />
								</Button>
							</TableBodyCell>
							<TableBodyCell class="px-0 py-1 items-center text-center">
								<Button color="none"
												class="p-2 focus:ring-0"
												onclick={() => onclickShowAiResponsesDetail(item.aiResponsesId)}>
									{#if _aiResponsesItemTableIdList.includes(item.aiResponsesId)}
										<ChevronUpIcon class="w-4 h-4" />
									{:else }
										<ChevronDownIcon class="w-4 h-4" />
									{/if}
								</Button>
							</TableBodyCell>
						</TableBodyRow>
						{#if _aiResponsesItemTableIdList.includes(item.aiResponsesId)}
							{#each item.itemList as aiInferenceItem}
								{@const diffPrice = CurrentNumberUtils.subtractPrice(
									aiInferenceItem.closePrice,
									aiInferenceItem.openPrice
								)}
								{@const priceColor = diffPrice > 0 ? 'text-red-500' : diffPrice < 0 ? 'text-blue-500' : ''}
								{@const evaluationColor = aiInferenceItem.evaluation === 'buy' ?
									'text-red-500' :
									aiInferenceItem.evaluation === 'cell' ? 'text-blue-500' : ''}
								<TableBodyRow class="text-xs">
									<TableBodyCell class="px-0 py-1 items-center text-center text-wrap">
										<Badge class={evaluationColor}>
											{aiInferenceItem.evaluation}
										</Badge>
									</TableBodyCell>
									<TableBodyCell class="px-0 py-1 text-[10px] items-center text-center whitespace-normal">
										{aiInferenceItem.dateTime}
									</TableBodyCell>
									<TableBodyCell class="col-span-3 px-0 py-1 items-center text-center text-wrap {priceColor}">
										OptionPrice {aiInferenceItem.openPrice || 0}
									</TableBodyCell>
									<TableBodyCell class="col-span-3 px-0 py-1 items-center text-center text-wrap {priceColor}">
										HighPrice {aiInferenceItem.highPrice}
									</TableBodyCell>
									<TableBodyCell class="col-span-3 px-0 py-1 items-center text-center text-wrap {priceColor}">
										LowPrice {aiInferenceItem.lowPrice}
									</TableBodyCell>
									<TableBodyCell class="col-span-3 px-0 py-1 items-center text-center text-wrap {priceColor}">
										ClosePrice {aiInferenceItem.closePrice || 0}
									</TableBodyCell>
								</TableBodyRow>
							{/each}
						{/if}
					{/each}
				</TableBody>
			</Table>
		{/if}
	</Card>
</div>

<AiResponseDeleteModalComponent
	bind:modalOpenYn={_aiResponsesRemoveModalOpenYn}
	bind:id={_aiResponsesDeleteId}
	{deleteAiResponsesCallback} />

<Popover>

</Popover>

<ToastAlertComponent
	alertMessage={_alertMessage} />
