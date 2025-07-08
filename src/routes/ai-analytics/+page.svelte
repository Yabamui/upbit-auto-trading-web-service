<script lang="ts">

	import type { PageData } from './$types';
	import {
		Button,
		Li,
		List,
		Popover,
		Spinner
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import AiPromptModalComponent from '$lib/web/components/modals/AiPromptModalComponent.svelte';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import AiAnalyticsRequestSchedulerModalComponent
		from '$lib/web/components/ai-analytics/AiAnalyticsRequestSchedulerModalComponent.svelte';
	import {
		CheckIcon,
		TimerIcon
	} from 'lucide-svelte';
	import type { TickerCalculationData } from '$lib/common/models/TickerData';
	import { tickerCalculationStore } from '$lib/stores/MarketStore';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import AiAnalyticsRequestConfigModalComponent
		from '$lib/web/components/ai-analytics/AiAnalyticsRequestConfigModalComponent.svelte';
	import type { AiAnalyticsRequestFormData } from '$lib/common/models/AiAnalyticsRequestData';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import {
		type AiResponsesCreateRequestData,
		AiResponsesDataUtils
	} from '$lib/common/models/AiResponsesData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { AiPromptsData } from '$lib/common/models/AiPromptsData';
	import AiAnalyticsAiInferenceComponent
		from '$lib/web/components/ai-analytics/AiAnalyticsAiInferenceComponent.svelte';
	import AiAnalyticsAiHistoryComponent from '$lib/web/components/ai-analytics/AiAnalyticsAiHistoryComponent.svelte';

	let { data }: {
		data: PageData
	} = $props();

	let _promptConfigModalOpenYn: boolean = $state(false);
	let _marketInfo: MarketInfoData = $state(data.marketInfoData);
	let _aiPromptsDataList: AiPromptsData[] = $state(data.aiPromptsDataList);
	let _aiAnalyticsRequestLoadingYn = $state(false);
	let _candleUnit: string = $state(UPBitCandleUnitEnum.days.key);
	let _candleTimeZone: string = $state(UPBitCandleTimeZones.utc);
	let _tickerCalculationData: TickerCalculationData | undefined = $state(undefined);
	let _aiAnalyticsHistoryOpenYn: boolean = $state(false);

	let _alertMessage: string = $state('');
	let _requestConfigModalOpenYn: boolean = $state(false);
	let _aiAnalyticsRequestFormData: AiAnalyticsRequestFormData | undefined = $state.raw(undefined);
	let _schedulerModalOpenYn: boolean = $state(false);
	let _reloadYn: boolean = $state(false);

	onMount(async () => {
		await mount();
	});

	$effect(() => {
		if ($tickerCalculationStore) {
			_tickerCalculationData = JSON.parse($tickerCalculationStore);
		}
	});

	async function mount() {}

	async function requestAiAnalytics() {
		if (!_aiAnalyticsRequestFormData) {
			_alertMessage = 'No Request Config';
			return;
		}

		_aiAnalyticsRequestLoadingYn = true;

		const createRequestData = {
			market: _marketInfo.market,
			aiCode: _aiAnalyticsRequestFormData.ai,
			aiModelId: Number(_aiAnalyticsRequestFormData.aiModelId),
			aiPromptsId: Number(_aiAnalyticsRequestFormData.aiPromptsId),
			candleUnit: _aiAnalyticsRequestFormData.candleUnit,
			candleCount: _aiAnalyticsRequestFormData.candleCount,
			candleTimeZone: _aiAnalyticsRequestFormData.candleTimeZone
		} as AiResponsesCreateRequestData;

		const validResult = AiResponsesDataUtils.validCreateData(createRequestData);

		if (!validResult.valid) {
			_alertMessage = validResult.message;
			_aiAnalyticsRequestLoadingYn = false;
			return;
		}

		const responseObject = await AiAnalyticsWebApi.createAiResponses(createRequestData);

		await new Promise((resolve) => setTimeout(resolve, 500));

		_aiAnalyticsRequestLoadingYn = false;

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = responseObject.message;
			return;
		}

		if (!responseObject.data) {
			_alertMessage = 'Ai Analysis Request Failed';
			return;
		}

		_reloadYn = true;
	}

	function aiPromptsConfigModalCallback() {
		_aiAnalyticsRequestFormData = undefined;
	}

	function aiResponsesDeleteCallback() {
		_reloadYn = true;
	}

	function onclickOpenPromptsModal() {
		_promptConfigModalOpenYn = !_promptConfigModalOpenYn;
	}

	function onclickAiAnalyticsRequestConfigModal() {
		_requestConfigModalOpenYn = !_requestConfigModalOpenYn;
	}

	function onclickAiAnalyticsRequestSchedulerModal() {
		_schedulerModalOpenYn = !_schedulerModalOpenYn;
	}

	function onclickAiAnalyticsHistory() {
		_aiAnalyticsHistoryOpenYn = !_aiAnalyticsHistoryOpenYn;
	}
</script>


<header class="relative grid grid-cols-2 gap-2 w-full h-20 px-4 py-2 items-center border-b-2 overflow-y-hidden overflow-x-auto">
	<div class="grid grid-flow-col gap-2 w-full justify-end">
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
		{/if}
	</div>
	<div class="grid grid-flow-col gap-2 items-center justify-around w-full">
		<div class="">
			<Button color="primary"
							class="p-2 focus:ring-0"
							onclick={onclickOpenPromptsModal}>
				<p class="text-[12px] leading-none">
					Prompts Config
				</p>
			</Button>

			<Button color="primary"
							class="p-2 focus:ring-0"
							onclick={onclickAiAnalyticsRequestConfigModal}>
				<p class="text-[12px] leading-none">
					Request Config
				</p>
			</Button>

			<Button color='green'
							id="_aiAnalyticsRequestButton"
							class="p-2 focus:ring-0"
							disabled={!_aiAnalyticsRequestFormData}
							onclick={requestAiAnalytics}>
				<p class="text-[12px] leading-none">
					Gen
				</p>
				{#if _aiAnalyticsRequestLoadingYn}
					<Spinner class="w-4 h-4 ml-2" />
				{/if}
			</Button>
		</div>
		<div class="">
			<Button color="primary"
							class="rounded-lg p-2 focus:ring-0"
							onclick={onclickAiAnalyticsRequestSchedulerModal}>
				<p class="text-[12px] leading-none">
					Scheduler
				</p>
				<TimerIcon class="ml-2 w-3 h-3" />
			</Button>
			<Button
				type="button"
				color="alternative"
				class="rounded-lg p-2 focus:ring-0"
				onclick={onclickAiAnalyticsHistory}>
				<p class="text-[12px] leading-none">
					History
				</p>
			</Button>
		</div>
	</div>
</header>

<main class="relative grid auto-rows-min w-full h-full p-4 gap-4 justify-center overflow-y-auto">
	<!--	Ai Analytics History -->
	<div class="flex flex-row w-full">
		{#if _aiAnalyticsHistoryOpenYn}
			<AiAnalyticsAiHistoryComponent
				marketInfo={_marketInfo}
				aiModelList={data.aiModelDataList}
				{aiResponsesDeleteCallback}/>
		{/if}
	</div>

	<!--	Ai Analytics Inference -->
	<div class=" flex flex-row w-full gap-4">
		<AiAnalyticsAiInferenceComponent
			reloadYn={_reloadYn}
			bind:marketInfo={_marketInfo}
			marketInfoList={data.marketInfoDataList}
			candleUnit={_candleUnit}
			candleTimeZone={_candleTimeZone} />
	</div>
</main>


<Popover
	triggeredBy="#_aiAnalyticsRequestButton"
	class="z-10 w-64 text-xs font-light"
	title="Current Ai Analytics Request Config"
	arrow={false}
	trigger="hover">
	<div class="flex flex-col gap-2">
		{#if _aiAnalyticsRequestFormData}
			<List tag="ul"
						class="mb-2"
						list="none">
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					AI :
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.ai}
					</p>
				</Li>
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					AI Model ID :
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.aiModelName}
					</p>
				</Li>
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					AI Prompts ID:
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.aiPromptsTitle}
					</p>
				</Li>
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					Candle Unit:
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.candleUnit}
					</p>
				</Li>
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					Candle Count:
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.candleCount}
					</p>
				</Li>
				<Li icon
						class="gap-2">
					<CheckIcon class="w-4 h-4 text-green-500" />
					Candle TimeZone:
					<p class="font-bold">
						{_aiAnalyticsRequestFormData.candleTimeZone}
					</p>
				</Li>
			</List>
		{:else }
			<p class="items-center text-center">
				No Request Config
			</p>
		{/if}
	</div>
</Popover>


<AiPromptModalComponent
	bind:openModalYn={_promptConfigModalOpenYn}
	aiModelList={data.aiModelDataList}
	bind:aiPromptsList={_aiPromptsDataList}
	{aiPromptsConfigModalCallback} />

<AiAnalyticsRequestConfigModalComponent
	bind:openModalYn={_requestConfigModalOpenYn}
	bind:initFormData={_aiAnalyticsRequestFormData}
	aiModelList={data.aiModelDataList}
	aiPromptsList={_aiPromptsDataList} />

<AiAnalyticsRequestSchedulerModalComponent
	bind:openModal={_schedulerModalOpenYn}
	aiModelList={data.aiModelDataList}
	marketInfoList={data.marketInfoDataList}
	aiPromptsList={_aiPromptsDataList} />

<ToastAlertComponent
	alertMessage={_alertMessage} />