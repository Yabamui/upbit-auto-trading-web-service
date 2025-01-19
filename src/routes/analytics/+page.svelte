<script lang="ts">
	export const prerender = true;

	import type { PageData } from './$types';
	import {
		Button,
		ButtonGroup,
		Card,
		Dropdown,
		DropdownItem,
		Input,
		Listgroup,
		ListgroupItem,
		Spinner,
		TabItem,
		Tabs
	} from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		MarketCurrencyCode,
		MarketCurrencyTypeUtils
	} from '$lib/common/enums/MarketCurrencyType';
	import { AIModelCode } from '$lib/common/enums/AIModelCode';
	import type { AiModelData } from '$lib/common/models/AiModelData';
	import AiPromptModalComponent from '$lib/web/components/modals/AiPromptModalComponent.svelte';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { AiAnalyticsWebApi } from '$lib/web/api/AiAnalyticsWebApi';
	import AiResponsesComponent from '$lib/web/components/ai-analytics/AiResponsesComponent.svelte';
	import {
		UPBitCandleTimeZones,
		type UPBitCandleUnitCodeData,
		UPBitCandleUnitCodeUtils,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import TodayAiAnalyticsComponent from '$lib/web/components/ai-analytics/TodayAiAnalyticsComponent.svelte';

	let { data }: {
		data: PageData
	} = $props();

	let _marketInfoRecord: Record<string, MarketInfoData[]> = $state({});
	let _currentMarketCurrencyType: string = $state(MarketCurrencyCode.KRW.code);
	let _marketInfoList: MarketInfoData[] = $derived(filterMarketList(_currentMarketCurrencyType));
	let _aiModelRecord: Record<string, AiModelData[]> = $state({});
	let _promptModalOpenYn: boolean = $state(false);
	let _currentMarketInfoData: MarketInfoData = $state(data.marketInfoDataList[0]);
	let _aiModel: AiModelData = $state({} as AiModelData);
	let _ai: {
		code: string,
		name: string
	} = $state(AIModelCode.GEMINI);
	let _aiModelDropdownOpenYn: boolean = $state(false);
	let _aiDropdownOpenYn: boolean = $state(false);
	let _aiPromptsId: number = $state(0);
	let _availableAnalyticsRequestYn = $derived(_aiPromptsId > 0 && _aiModel.id > 0 && _currentMarketInfoData?.market);
	let _aiAnalyticsRequestLoadingYn = $state(false);
	let _candleUnitCode: UPBitCandleUnitCodeData = $state(UPBitCandleUnitEnum.days);
	let _candleUnitDropdownOpenYn: boolean = $state(false);
	let _candleCount: number = $state(200);
	let _candleTimeZoneDropdownOpenYn: boolean = $state(false);
	let _candleTimeZone: string = $state(UPBitCandleTimeZones.utc);

	let _searchMarket: string = $state('');

	function filterMarketList(marketCurrencyType: string) {
		if (!marketCurrencyType || !(Object.keys(_marketInfoRecord).length > 0)) {
			return [];
		}

		return _marketInfoRecord[marketCurrencyType].filter((item) => {
			if (_searchMarket) {
				return item.koreanName.includes(_searchMarket) || item.englishName.includes(_searchMarket) ||
					item.market.includes(_searchMarket);
			} else {
				return true;
			}
		});
	}

	onMount(async () => {
		await mount();
	});

	async function mount() {

		_marketInfoRecord = data.marketInfoDataList.reduce((acc, item) => {
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

		_aiModelRecord = data.aiModelDataList.reduce((acc, item) => {
			if (!acc[item.aiCode]) {
				acc[item.aiCode] = [];
			}

			acc[item.aiCode].push(item);

			return acc;
		}, {} as Record<string, AiModelData[]>);

		_aiModel = _aiModelRecord[_ai.code][1];
	}

	function clickOpenPromptsModal() {
		_promptModalOpenYn = true;
	}

	async function clickMarketItem(item: MarketInfoData) {
		if (_currentMarketInfoData.market === item.market) {
			return;
		}

		_currentMarketInfoData = item;
	}

	function clickAiDropdown(ai: {
		code: string,
		name: string
	}) {
		_aiDropdownOpenYn = !_aiDropdownOpenYn;

		if (_ai.code === ai.code) {
			return;
		}

		_ai = ai;
		_aiModel = _aiModelRecord[_ai.code][1];
		_candleCount = 200;
		_candleUnitCode = UPBitCandleUnitEnum.days;
		_candleTimeZone = UPBitCandleTimeZones.utc;
		_aiPromptsId = 0;
	}

	function clickAiModelDrop(aiModel: AiModelData) {
		_aiModelDropdownOpenYn = !_aiModelDropdownOpenYn;

		if (_aiModel.modelCode === aiModel.modelCode) {
			return;
		}

		_aiModel = aiModel;
		_candleCount = 200;
		_candleUnitCode = UPBitCandleUnitEnum.days;
		_candleTimeZone = UPBitCandleTimeZones.utc;
		_aiPromptsId = 0;
	}

	async function requestAiAnalytics() {
		_aiAnalyticsRequestLoadingYn = true;

		const responseObject = await AiAnalyticsWebApi.requestAiAnalysis(
			_currentMarketInfoData.market,
			_aiModel.id,
			_aiPromptsId,
			_candleUnitCode.key,
			_candleCount,
			_candleTimeZone
		);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		_aiAnalyticsRequestLoadingYn = false;

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		if (!responseObject.data) {
			alert('Ai Analysis Request Failed');
			return;
		}
	}

	function clickCandleUnitDropItem(item: UPBitCandleUnitCodeData) {
		_candleUnitCode = item;
		_candleUnitDropdownOpenYn = false;
	}

	function clickCandleTimeZoneDropItem(item: string) {
		_candleTimeZone = item;
		_candleTimeZoneDropdownOpenYn = false;
	}
</script>


<main class="flex flex-col w-full h-full p-4 gap-4 overflow-hidden">
	<!--	Ai Config-->
	<Card class="flex flex-row w-full"
				padding="none"
				size="none">

		<div class="flex flex-row w-full items-center justify-between">
			<div class="">
				<Button color="light"
								id="ai"
								class="rounded-lg text-sm p-2.5 me-1 focus:ring-0">
					{_ai.name}
					<ChevronDownOutline />
				</Button>
				<Dropdown placement="bottom"
									triggeredBy="#ai"
									bind:open={_aiDropdownOpenYn}>
					{#each Object.values(AIModelCode) as value}
						<DropdownItem onclick={() => clickAiDropdown(value)}>
							{value.name}
						</DropdownItem>
					{/each}
				</Dropdown>


				<Button color="light"
								id="ai-model"
								class="rounded-lg text-sm p-2.5 me-1 focus:ring-0">
					{_aiModel.modelName}
					<ChevronDownOutline />
				</Button>
				<Dropdown placement="bottom"
									triggeredBy="#ai-model"
									bind:open={_aiModelDropdownOpenYn}>
					{#each _aiModelRecord[_ai.code] as item}
						<DropdownItem onclick={() => clickAiModelDrop(item)}>
							{item.modelName}
						</DropdownItem>
					{/each}
				</Dropdown>

				<ButtonGroup>
					<Input type="number"
								 defaultClass="inline focus:ring-0"
								 min="60"
								 max="200"
								 bind:value={_candleCount}
								 placeholder="데이터 크기" />
					<Button color="light"
									id="ai_candle_unit"
									class="focus:ring-0">
						{_candleUnitCode.name}
						<ChevronDownOutline class="w-5 h-5 ms-2" />
					</Button>
					<Dropdown placement="bottom"
										bind:open={_candleUnitDropdownOpenYn}
										triggeredBy="#ai_candle_unit">
						{#each UPBitCandleUnitCodeUtils.getAiRequestUnit() as item}
							<DropdownItem onclick={async () => clickCandleUnitDropItem(item)}>
								{item.name}
							</DropdownItem>
						{/each}
					</Dropdown>
				</ButtonGroup>

				<Button color="light"
								id="ai_candle_time_zone"
								class="focus:ring-0">
					{_candleTimeZone}
					<ChevronDownOutline class="w-5 h-5 ms-1" />
				</Button>
				<Dropdown placement="bottom"
									bind:open={_candleTimeZoneDropdownOpenYn}
									triggeredBy="#ai_candle_time_zone">
					<DropdownItem onclick={async () => clickCandleTimeZoneDropItem(UPBitCandleTimeZones.utc)}>
						{UPBitCandleTimeZones.utc}
					</DropdownItem>
					<DropdownItem onclick={async () => clickCandleTimeZoneDropItem(UPBitCandleTimeZones.kst)}>
						{UPBitCandleTimeZones.kst}
					</DropdownItem>
				</Dropdown>

				<Button color={_aiPromptsId ? 'green' : 'light'}
								class="rounded-lg text-sm p-2.5 me-1 focus:ring-0"
								onclick={clickOpenPromptsModal}>
					Chose Prompt
				</Button>
			</div>
			<div class="">
				<Button color={_availableAnalyticsRequestYn ? 'green' : 'light'}
								class="rounded-lg text-sm p-2.5 me-1 focus:ring-0"
								disabled={!_availableAnalyticsRequestYn || _aiAnalyticsRequestLoadingYn}
								onclick={requestAiAnalytics}>
					Gen
					{#if _aiAnalyticsRequestLoadingYn}
						<Spinner class="w-5 h-5 ml-2"
										 size="4" />
					{/if}
				</Button>
			</div>
		</div>
	</Card>

	<TodayAiAnalyticsComponent bind:candleType={_candleUnitCode.key}/>

	<!--	Trading Chart-->
	<div class="flex ">
		<div class="flex flex-col w-full overflow-x-hidden">
			<!--			Market Info-->
			<Card class="flex flex-row w-full items-center justify-between"
						size="none">
				<div class="">
					{_currentMarketInfoData.koreanName}
					{_currentMarketInfoData.market}
				</div>
			</Card>

			<div class="flex w-full">
				{#if _currentMarketInfoData}
					<AiResponsesComponent marketInfo={_currentMarketInfoData} />
				{/if}
			</div>


		</div>

		<!--		Market List-->
		<Card class="flex w-[400px] min-w-[400px] h-screen overflow-y-auto"
					padding="none"
					size="none">
			<Tabs class="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border-b border-gray-200 dark:border-gray-700  shadow-lg "
						contentClass="p-2 bg-gray-50 rounded-lg dark:bg-gray-800"
						tabStyle="underline">
				<div class="flex w-full">
					<Input id="search-navbar"
								 class="ps-10"
								 placeholder="Search..."
								 bind:value={_searchMarket} />
				</div>
				{#each MarketCurrencyTypeUtils.getMainCurrencyTypeList() as currencyType}
					<TabItem title={currencyType.name}
									 onclick={() => _currentMarketCurrencyType = currencyType.code}
									 open={_currentMarketCurrencyType === currencyType.code}>
						<Listgroup class="border-0 dark:!bg-transparent"
											 active={true}>
							{#each _marketInfoList as item}
								{@const color = _currentMarketInfoData.market === item.market ? 'bg-gray-100 dark:bg-gray-800' : ''}
								<ListgroupItem
									on:click={() => clickMarketItem(item)}
									itemDefaultClass="py-2 px-4 w-full text-sm font-medium list-none first:rounded-t-lg last:rounded-b-lg {color}"
									focusClass=""
									hoverClass="hover:bg-gray-100 dark:hover:bg-gray-700">
									<div class="grid grid-cols-5 w-full items-center gap-2">
										<div class="col-span-2 min-w-0">
											<p class="text-[12px] font-medium text-gray-900 dark:text-white">
												{item.koreanName}
											</p>
											<p class="text-[11px] text-gray-500 dark:text-gray-400">
												{item.market}
											</p>
										</div>
									</div>
								</ListgroupItem>
							{/each}
						</Listgroup>
					</TabItem>
				{/each}
			</Tabs>
		</Card>
	</div>
</main>


{#if _aiModel?.id}
	<AiPromptModalComponent bind:modalOpenYn={_promptModalOpenYn}
													bind:aiPromptsId={_aiPromptsId}
													bind:aiModelId={_aiModel.id} />
{/if}