<script lang="ts">
	import type { ProphetAnalyticsRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		Badge,
		Button,
		Card,
		Indicator,
		Select,
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		ChartMixedOutline,
		ChevronDownOutline,
		ChevronUpOutline,
		RefreshOutline,
		TrashBinOutline
	} from 'flowbite-svelte-icons';
	import ProphetAnalyticsRequestDetailTableComponent
		from '$lib/web/components/prophet-analytics/ProphetAnalyticsRequestDetailTableComponent.svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';

	let {
		reloadYn = $bindable(),
		marketInfo,
		requestId = $bindable()
	}: {
		reloadYn: boolean;
		marketInfo: MarketInfoData;
		requestId: number | undefined;
	} = $props();

	let _alertMessage: string = $state('');
	let _candleType: string = $state(UPBitCandleUnitEnum.days.key);
	let _openDetailId: number = $state(0);
	let _prophetAnalyticsRequestList: ProphetAnalyticsRequestData[] = $state([]);

	$effect(() => {
		updateProphetAnalyticsRequest(marketInfo.market);
	});

	$effect(() => {
		if (reloadYn) {
			reloadYn = false;
			updateProphetAnalyticsRequest(marketInfo.market);
		}
	});

	function clickProphetAnalyticsResultItem(resultItemId: number) {
		if (_openDetailId === resultItemId) {
			_openDetailId = 0;
		} else {
			_openDetailId = resultItemId;
		}
	}

	async function deleteProphetAnalyticsResult(id: number) {
		const result = confirm('Prophet Analytics 요청 및 결과를 삭제하시겠습니까?');

		if (!result) {
			return;
		}

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.deleteProphetAnalyticsResult(id);

		if (ResponseCode.success.code !== responseObject.code) {
			_alertMessage = 'Prophet Analytics 요청 및 결과 삭제에 실패하였습니다.';
			return;
		}

		await updateProphetAnalyticsRequest(marketInfo.market);
	}

	async function updateProphetAnalyticsRequest(market: string) {
		const responseObject: ResponseObject<unknown> =
			await ProphetAnalyticsWebApi.getProphetAnalyticsRequestList(
				market
			);

		if (ResponseCode.success.code !== responseObject.code) {
			_prophetAnalyticsRequestList = [];
			requestId = undefined;
			_alertMessage = 'Prophet Analytics 요청 목록을 가져오는데 실패하였습니다.';
			return;
		}

		_prophetAnalyticsRequestList = responseObject.data as ProphetAnalyticsRequestData[];
		requestId = _prophetAnalyticsRequestList[0]?.id;
	}

	function onclickProphetAnalyticsRequest(request: ProphetAnalyticsRequestData) {
		requestId = request.id;
	}
</script>


<Card class="flex w-[600px] h-[300px] overflow-x-hidden overflow-y-auto"
			padding="none"
			size="none">
	<div class="flex w-full px-4 py-2 border-y items-center justify-between">
		<div class="text-[24px] font-bold">
			Prophet Analytics Request
		</div>
		<Select bind:value={_candleType}
						placeholder=""
						class="w-[80px]"
						size="sm">
			<option value={UPBitCandleUnitEnum.days.key}>{UPBitCandleUnitEnum.days.key}</option>
			<option value={UPBitCandleUnitEnum.hours.key}>{UPBitCandleUnitEnum.hours.key}</option>
		</Select>
	</div>
	{#if _prophetAnalyticsRequestList.length === 0}
		<div class="flex w-full h-full items-center justify-center">
			<span class="text-gray-500">No data</span>
		</div>
	{:else}
		<Table class="relative table-fixed"
					 divClass="overflow-x-hidden overflow-y-auto">
			<TableBody>
				{#each _prophetAnalyticsRequestList.filter((item) => item.candleType === _candleType) as item}
					<TableBodyRow>
						<TableBodyCell class="px-0 py-2 items-center text-center">
							<Button
								color={requestId === item.id ? 'primary' : 'light'}
								class="text-[12px] p-2 focus:ring-0"
								onclick={() => onclickProphetAnalyticsRequest(item)}
								disabled={!item.requestYn}>
								<ChartMixedOutline />
							</Button>
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center text-wrap text-[12px]">
							<Badge color="blue"
										 class="px-1">
								{item.executeDateTime}
							</Badge>
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center text-wrap text-[12px]">
							<Badge color="blue"
										 class="px-1">
								{item.candleType}
							</Badge>
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center justify-center justify-items-center">
							{#if !item.requestYn}
								<Badge color="red">
									<Spinner size={4} />
								</Badge>
							{:else if ResponseCode.success.code === item.resultCode}
								<Indicator color="green" />
							{:else}
								<Indicator color="red" />
							{/if}
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center">
							<Button
								color="none"
								class="text-[12px] p-2 focus:ring-1"
								disabled={!item.requestYn}>
								<RefreshOutline />
							</Button>
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center">
							<Button
								color="none"
								class="text-[12px] p-2  focus:ring-1"
								disabled={!item.requestYn}
								onclick={() => deleteProphetAnalyticsResult(item.id)}>
								<TrashBinOutline />
							</Button>
						</TableBodyCell>
						<TableBodyCell class="p-0 items-center text-center">
							<Button
								color="none"
								class="text-[12px] p-2 focus:ring-1"
								onclick={() => clickProphetAnalyticsResultItem(item.id)}>
								{#if item.id === _openDetailId}
									<ChevronUpOutline />
								{:else}
									<ChevronDownOutline />
								{/if}
							</Button>
						</TableBodyCell>
					</TableBodyRow>
					{#if _openDetailId === item.id}
						<ProphetAnalyticsRequestDetailTableComponent
							prophetAnalyticsRequest={item} />
					{/if}
				{/each}
			</TableBody>
		</Table>
	{/if}
</Card>


<ToastAlertComponent bind:alertMessage={_alertMessage} />