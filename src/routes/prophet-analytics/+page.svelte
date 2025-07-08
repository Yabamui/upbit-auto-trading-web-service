<script lang="ts">
	import type { PageData } from './$types';
	import {
		Button,
		Card,
		Popover,
		Select,
		Spinner
	} from 'flowbite-svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { onMount } from 'svelte';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type { ProphetAnalyticsEChartRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import ProphetAnalyticsCandleEChartsComponent
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsCandleEChartsComponent.svelte';
	import ProphetAnalyticsRequestConfigModalComponent
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsRequestConfigModalComponent.svelte';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';
	import {
		ClockArrowUpIcon,
		CogIcon
	} from 'lucide-svelte';
	import ProphetAnalyticsRequestSchedulerModal
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsRequestSchedulerModal.svelte';
	import type { ProphetAnalyticsRequestConfigData } from '$lib/common/models/ProphetAnalyticsRequestConfigData';
	import { tickerCalculationStore } from '$lib/stores/MarketStore';
	import type { TickerCalculationData } from '$lib/common/models/TickerData';
	import ProphetAnalyticsMarketAndResultComponent
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsMarketAndResultComponent.svelte';
	import ProphetAnalyticsRequestHistoryComponent
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsRequestHistoryComponent.svelte';
	import { CurrentThreadUtils } from '$lib/common/utils/CurrentThreadUtils';
	import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';

	let { data }: {
		data: PageData
	} = $props();

	let _marketInfoData = $state<MarketInfoData>(data.marketInfoData);
	let _requestConfigId: string = $state('');
	let _requestConfigList: ProphetAnalyticsRequestConfigData[] = $state(data.requestConfigList);
	let _priceType: string = $state('');
	let _candleEChartRequestData: ProphetAnalyticsEChartRequestData = $state({
		market: data.marketInfoData.market,
		marketName: data.marketInfoData.koreanName,
		candleUnit: UPBitCandleUnitEnum.days.key,
		candleTimeZone: UPBitCandleTimeZones.utc,
	});
	let _chartClearYn = $state(false);
	let _configModalOpenYn = $state(false);
	let _prophetAnalyticsRequestStartYn = $state(false);
	let _alertMessage: string = $state<string>('');
	let _schedulerModalOpenYn = $state(false);
	let _tickerCalculationData: TickerCalculationData | undefined = $state(undefined);
	let _prophetAnalyticsRequestHistoryOpenYn = $state(false);
	let _prophetAnalyticsRequestProcessIdList: number[] = $state([]);
	let _prophetAnalyticsMarketAndResultReloadYn = $state(false);
	let _prophetAnalyticsRequestTableReloadYn = $state(false);

	onMount(async () => {
		if (!data.loggInYn) {
			alert('로그인이 필요합니다.');
			return;
		}
	});

	$effect(() => {
		const checkRequestComplete = setInterval(async () => {
			await checkProphetAnalyticsRequestComplete();
		}, 1000 * 5);

		return () => {
			clearInterval(checkRequestComplete);
		};
	});

	$effect(() => {
		if ($tickerCalculationStore) {
			_tickerCalculationData = JSON.parse($tickerCalculationStore);
		}
	});

	async function requestProphetAnalytics() {
		if (!_marketInfoData) {
			_alertMessage = '마켓 정보가 없습니다.';
			return;
		}

		if (!_requestConfigId) {
			_alertMessage = 'Prophet 설정이 필요합니다.';
			return;
		}

		if (!_priceType) {
			_alertMessage = '가격 구분을 선택하세요.';
			return;
		}

		_prophetAnalyticsRequestStartYn = true;

		const priceTypeList = 'ALL' === _priceType ?
			Object.values(ProphetAnalyticsPriceTypeEnum)
				.map((item) => item.key) :
			[_priceType];

		const responseObject: ResponseObject<unknown> =
			await ProphetAnalyticsWebApi.createProphetAnalyticsRequest(
				_marketInfoData.market,
				Number(_requestConfigId),
				priceTypeList
			);

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = 'Prophet Analytics 요청이 실패하였습니다.';
			_prophetAnalyticsRequestStartYn = false;
			return;
		}

		const requestId = responseObject.data as number | null;

		if (!requestId) {
			_alertMessage = 'Prophet Analytics 요청이 실패하였습니다.';
			_prophetAnalyticsRequestStartYn = false;
			return;
		}

		_prophetAnalyticsRequestProcessIdList.push(requestId);
		_prophetAnalyticsRequestTableReloadYn = true;

		await CurrentThreadUtils.sleep(1000);
	}

	async function checkProphetAnalyticsRequestComplete() {
		if (_prophetAnalyticsRequestProcessIdList.length === 0) {
			return;
		}

		const responseObject = await ProphetAnalyticsWebApi.checkProphetAnalyticsRequestComplete(
			_prophetAnalyticsRequestProcessIdList);

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		const result = responseObject.data as boolean;

		if (!result) {
			return;
		}

		_prophetAnalyticsRequestProcessIdList = [];

		await CurrentThreadUtils.sleep(500);

		_prophetAnalyticsRequestStartYn = false;
		_prophetAnalyticsMarketAndResultReloadYn = true;
		_prophetAnalyticsRequestTableReloadYn = true;
	}

	async function onChangeMarketInfoCallback(
		marketInfoData: MarketInfoData
	) {

		_marketInfoData = marketInfoData;
		_candleEChartRequestData.market = marketInfoData.market;
		_candleEChartRequestData.marketName = marketInfoData.koreanName;
		_chartClearYn = true;
	}

	async function onclickOpenProphetConfigModal() {
		_configModalOpenYn = true;
	}

	async function onclickOpenSchedulerConfigModal() {
		_schedulerModalOpenYn = true;
	}

	function onclickProphetAnalyticsRequestHistory() {
		_prophetAnalyticsRequestHistoryOpenYn = !_prophetAnalyticsRequestHistoryOpenYn;
	}

	async function reloadProphetAnalyticsRequestConfig() {
		_requestConfigId = '';
		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.getProphetAnalyticsRequestConfigList(
			_marketInfoData.market
		);

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = 'Prophet 설정 목록을 가져오는데 실패하였습니다.';
			return;
		}

		_requestConfigList = responseObject.data as ProphetAnalyticsRequestConfigData[];
	}
</script>

<!-- Prophet Analytics Config -->
<header class="relative grid grid-cols-2 gap-2 w-full h-20 px-4 py-2 items-center border-b-2 overflow-y-hidden overflow-x-auto">
	<div class="relative grid grid-flow-col gap-2 w-full justify-end">
		{#if _tickerCalculationData}
			{@const priceColor = _tickerCalculationData.diffPrice > 0 ?
				'text-red-500' :
				_tickerCalculationData.diffPrice < 0 ? 'text-blue-500' : ''}
			<div class="col-span-1 text-end w-full">
				<p class="text-[24px] font-bold">
					{_tickerCalculationData.koreanName}
				</p>
				<p class="text-[12px]">
					{_tickerCalculationData.market}
				</p>
			</div>
			<div class="col-span-1 text-start">
				<p class="text-[22px] font-medium {priceColor}">
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
	<div class="relative grid grid-flow-col gap-2 justify-around w-full">
		<div class="">
			<Button
				color="primary"
				class="p-2 items-center"
				id="_prophetConfigButton"
				onclick={() => onclickOpenProphetConfigModal()}>
				<p class="text-[12px] leading-none">
					Prophet Config
				</p>
				<CogIcon class="ml-2 w-3 h-3" />
			</Button>
			<div class="inline-flex flex-row items-center justify-center gap-2">
				<Select bind:value={_requestConfigId}
								placeholder=""
								class="py-0.5 w-[70px] text-[12px] focus:ring-0">
					<option value="">선택</option>
					{#each _requestConfigList as item}
						<option value={item.id}
										class="text-[12px] leading-none">
							{item.candleUnit}
						</option>
					{/each}
				</Select>
				<Select bind:value={_priceType}
								placeholder=""
								class="py-0.5 w-[90px] text-[12px] focus:ring-0">
					<option value="">선택</option>
					<option value="ALL"
									class="text-[12px] leading-none">
						전체
					</option>
					{#each Object.values(ProphetAnalyticsPriceTypeEnum) as item}
						<option value={item.key}
										class="text-[12px] leading-none">
							{item.value}
						</option>
					{/each}
				</Select>
				<Button
					color="green"
					class="p-2 focus:ring-0"
					id="_requestProphetAnalyticsButton"
					disabled={_prophetAnalyticsRequestStartYn || !_requestConfigId || !_priceType}
					onclick={() => requestProphetAnalytics()}>
					<p class="text-[12px] leading-none">
						Gen
					</p>
					{#if _prophetAnalyticsRequestStartYn}
						<Spinner class="ml-2 w-3 h-3" />
					{/if}
				</Button>
			</div>
		</div>
		<div class="">
			<Button
				color="primary"
				class="p-2 focus:ring-0"
				disabled={_prophetAnalyticsRequestStartYn}
				onclick={() => onclickOpenSchedulerConfigModal()}
				id="_schedulerConfigButton">
				<p class="text-[12px] leading-none">
					Scheduler
				</p>
				<ClockArrowUpIcon class="ml-2 w-3 h-3" />
			</Button>
			<Button
				color="alternative"
				class="p-2 {_prophetAnalyticsRequestHistoryOpenYn ? 'focus:ring-1 focus:ring-primary-500 ring-1 ring-primary-500' : 'ring-0 focus:ring-0'}"
				onclick={() => onclickProphetAnalyticsRequestHistory()}
				id="_prophetAnalyticsRequestHistoryButton">
				<p class="text-[12px] leading-none">
					History
				</p>
			</Button>
		</div>
	</div>
</header>

<main class="relative grid auto-rows-min w-full h-full p-4 gap-4 justify-center overflow-y-auto">
	<!-- Prophet Analytics Request List -->
	<div class=" flex flex-row w-full">
		{#if _prophetAnalyticsRequestHistoryOpenYn}
			<ProphetAnalyticsRequestHistoryComponent
				bind:reloadYn={_prophetAnalyticsRequestTableReloadYn}
				marketInfo={_marketInfoData} />
		{/if}
	</div>
	<div class=" flex flex-row w-full gap-4">
		<!-- Prophet Analytics ECharts -->
		<div class="hidden md:flex flex-grow min-w-[1000px] h-[700px] overflow-hidden">
			<Card class="flex w-full h-full overflow-y-auto"
						size="none">
				{#if _candleEChartRequestData}
					<ProphetAnalyticsCandleEChartsComponent
						marketInfo={data.marketInfoData}
						chartClearYn={_chartClearYn} />
				{/if}
			</Card>
		</div>
		<!-- Market List -->
		<div class="flex-none w-[500px] h-[700px] overflow-hidden">
			<ProphetAnalyticsMarketAndResultComponent
				bind:reloadYn={_prophetAnalyticsMarketAndResultReloadYn}
				marketInfo={data.marketInfoData}
				marketInfoList={data.marketInfoDataList}
				{onChangeMarketInfoCallback} />
		</div>
	</div>
</main>

<Popover
	triggeredBy="#_prophetConfigButton"
	class="z-10 w-64 text-sm font-light"
	title="Prophet 설정을 변경합니다."
	arrow={false}
	trigger="hover">
</Popover>
<Popover
	triggeredBy="#_schedulerConfigButton"
	class="z-10 w-64 text-sm"
	title="Prophet 스케쥴을 설정합니다."
	arrow={false}
	trigger="hover">
	<div class="text-gray-900 dark:text-white">
		전체 암호 화폐에 대한 Prophet 분석 스케쥴을 설정합니다.
	</div>
</Popover>
<Popover
	triggeredBy="#_requestProphetAnalyticsButton"
	class="z-10 w-64 text-sm font-light"
	title="Prophet 분석을 요청합니다."
	arrow={false}
	trigger="hover">
</Popover>

<ProphetAnalyticsRequestConfigModalComponent
	bind:modalOpenYn={_configModalOpenYn}
	market={_marketInfoData.market}
	{reloadProphetAnalyticsRequestConfig} />

<ProphetAnalyticsRequestSchedulerModal
	bind:openModalYn={_schedulerModalOpenYn}
	marketInfoList={data.marketInfoDataList} />

<ToastAlertComponent bind:alertMessage={_alertMessage} />