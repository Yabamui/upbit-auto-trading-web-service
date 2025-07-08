<script lang="ts">

	import {
		Button,
		Input,
		Label,
		Modal,
		MultiSelect,
		Select,
		Spinner
	} from 'flowbite-svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import { AIModelCode } from '$lib/common/enums/AIModelCode';
	import type { AiModelData } from '$lib/common/models/AiModelData';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { AiPromptsData } from '$lib/common/models/AiPromptsData';
	import { MarketCurrencyCode } from '$lib/common/enums/MarketCurrencyType';
	import { AiAnalyticsSchedulerEnum } from '$lib/common/enums/AiAnalyticsSchedulerEnum';
	import {
		type AiAnalyticsRequestSchedulerCreateData,
		type AiAnalyticsRequestSchedulerData,
		AiAnalyticsRequestSchedulerDataUtils,
		type AiAnalyticsRequestSchedulerFormData,
		type AiAnalyticsRequestSchedulerUpdateData
	} from '$lib/common/models/AiAnalyticsRequestSchedulerData';

	let {
		openModal = $bindable(),
		aiModelList,
		marketInfoList,
		aiPromptsList
	}: {
		openModal: boolean,
		aiModelList: AiModelData[],
		marketInfoList: MarketInfoData[],
		aiPromptsList: AiPromptsData[]
	} = $props();

	let _formData: AiAnalyticsRequestSchedulerFormData | undefined = $state(undefined);
	let _schedulerList: AiAnalyticsRequestSchedulerData[] = $state([]);
	let _aiPromptsListByAiModelIdRecord: Record<number, AiPromptsData[]> = $state({});
	let _processMessage: string = $state('');
	let _marketMultiSelectItems: {
		name: string,
		value: string,
		disabled?: boolean,
		color?: string
	}[] = $state([]);
	let _createLoadingYn: boolean = $state(false);
	let _updateLoadingYn: boolean = $state(false);
	let _deleteLoadingYn: boolean = $state(false);

	$effect(() => {
		if (openModal && aiModelList && aiModelList.length > 0 && marketInfoList && marketInfoList.length > 0) {
			initData();
		}
	});

	function closeModal() {
		openModal = false;
	}

	async function initData() {
		await getAiAnalyticsRequestSchedulerList();
		await getAiAnalyticsPromptsList();

		_formData = AiAnalyticsRequestSchedulerDataUtils.getFormDataByDefault();
	}

	async function getAiAnalyticsRequestSchedulerList() {
		const responseObject: ResponseObject<unknown> = await AiAnalyticsWebApi.getAiAnalyticsRequestSchedulerList();

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = responseObject.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_processMessage = '';
			return;
		}

		_schedulerList = responseObject.data as AiAnalyticsRequestSchedulerData[];
	}

	async function getAiAnalyticsPromptsList() {
		_aiPromptsListByAiModelIdRecord = aiPromptsList.reduce((acc, item) => {
			if (!acc[item.aiModelId]) {
				acc[item.aiModelId] = [];
			}

			acc[item.aiModelId].push(item);
			return acc;
		}, {} as Record<number, AiPromptsData[]>);
	}

	async function createAiAnalyticsRequestScheduler() {
		_processMessage = 'Input Data Validation...';

		if (!_formData) {

			_processMessage = 'Form Data is Empty';

			await new Promise(resolve => setTimeout(resolve, 3000));

			_processMessage = '';
			return;
		}

		_createLoadingYn = true;

		const createData: AiAnalyticsRequestSchedulerCreateData =
			AiAnalyticsRequestSchedulerDataUtils.getCreateData(_formData);

		const validResult = AiAnalyticsRequestSchedulerDataUtils.validCreateData(createData);

		if (!validResult.valid) {
			_processMessage = validResult.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_createLoadingYn = false;
			_processMessage = '';
			return;
		}

		await new Promise(resolve => setTimeout(resolve, 1000));

		_processMessage = 'Create Scheduler...';

		const responseObject: ResponseObject<unknown> =
			await AiAnalyticsWebApi.createAiAnalyticsRequestScheduler(createData);

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = responseObject.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_createLoadingYn = false;
			_processMessage = '';
			return;
		}

		_processMessage = 'Create Scheduler Success...';

		await new Promise(resolve => setTimeout(resolve, 3000));

		_createLoadingYn = false;
		_processMessage = '';
		_formData = AiAnalyticsRequestSchedulerDataUtils.getFormDataByDefault();

		await getAiAnalyticsRequestSchedulerList();
	}

	async function updateAiAnalyticsRequestScheduler() {
		_processMessage = 'Input Data Validation...';

		if (!_formData || !_formData.schedulerId) {

			_processMessage = 'Form Data is Empty';

			await new Promise(resolve => setTimeout(resolve, 3000));

			_processMessage = '';
			return;
		}

		_updateLoadingYn = true;

		const updateData: AiAnalyticsRequestSchedulerUpdateData =
			AiAnalyticsRequestSchedulerDataUtils.getUpdateData(_formData);

		const validResult = AiAnalyticsRequestSchedulerDataUtils.validUpdateData(updateData);

		if (!validResult.valid) {
			_processMessage = validResult.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_updateLoadingYn = false;
			_processMessage = '';
			return;
		}

		_processMessage = 'Update Scheduler...';

		const responseObject: ResponseObject<unknown> = await AiAnalyticsWebApi.updateAiAnalyticsRequestScheduler(updateData);

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = responseObject.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_updateLoadingYn = false;
			_processMessage = '';
			return;
		}

		await new Promise(resolve => setTimeout(resolve, 1000));

		_processMessage = 'Update Scheduler Success';

		await new Promise(resolve => setTimeout(resolve, 3000));

		_updateLoadingYn = false;
		_processMessage = '';

		await getAiAnalyticsRequestSchedulerList();
	}

	async function deleteAiAnalyticsRequestScheduler() {
		_processMessage = 'Input Data Validation...';

		if (!_formData || !_formData.schedulerId) {

			_processMessage = 'Form Data is Empty';

			await new Promise(resolve => setTimeout(resolve, 3000));

			_processMessage = '';
			return;
		}

		_deleteLoadingYn = true;

		_processMessage = 'Delete Scheduler...';

		const responseObject: ResponseObject<unknown> =
			await AiAnalyticsWebApi.deleteAiAnalyticsRequestScheduler(Number(_formData.schedulerId));

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = responseObject.message;

			await new Promise(resolve => setTimeout(resolve, 3000));

			_deleteLoadingYn = false;
			_processMessage = '';
			return;
		}

		await new Promise(resolve => setTimeout(resolve, 1000));

		_processMessage = 'Delete Success';

		await new Promise(resolve => setTimeout(resolve, 3000));

		_deleteLoadingYn = false;
		_processMessage = '';
		_formData = AiAnalyticsRequestSchedulerDataUtils.getFormDataByDefault();

		await getAiAnalyticsRequestSchedulerList();
	}

	function onChangeScheduler() {
		if (!_formData) {
			return;
		}

		if (!_formData.schedulerId) {
			_formData = AiAnalyticsRequestSchedulerDataUtils.getFormDataByDefault();
			return;
		}

		const schedulerId = _formData.schedulerId;

		const scheduler = _schedulerList.find(scheduler => String(scheduler.id) === schedulerId);

		if (!scheduler) {
			_formData = AiAnalyticsRequestSchedulerDataUtils.getFormDataByDefault();
			return;
		}

		const aiModel = aiModelList.find((item) => String(item.id) === String(scheduler.aiModelId));

		if (!aiModel) {
			return;
		}

		_formData = AiAnalyticsRequestSchedulerDataUtils.getFormData(
			aiModel.aiCode,
			scheduler
		);
	}

	function onChangeAiModel(aiPromptsId: string = '') {
		console.log('onClickAiModel', aiPromptsId);
		if (!_formData) {
			return;
		}

		_formData.aiPromptsId = '';
	}

	function onChangeMarketCurrency() {
		if (!_formData) {
			return;
		}

		_formData.includeExclude = '';
		_formData.marketList = [];
	}

	function onChangeIncludeExclude() {
		if (!_formData) {
			return;
		}

		const marketCurrency = _formData.marketCurrency;

		_formData.marketList = [];
		_marketMultiSelectItems = [];

		_marketMultiSelectItems = marketInfoList
			.filter((item) => item.market.startsWith(marketCurrency))
			.map((item) => {
				return {
					value: item.market,
					name: item.koreanName
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	function getSchedulerName(scheduler: AiAnalyticsRequestSchedulerData): string {
		return `${ scheduler.marketCurrency }-${ scheduler.candleUnit }-${ scheduler.executeHours }:${ scheduler.executeMinutes }`;
	}
</script>


<Modal
	bind:open={openModal}
	size="sm"
	title="Ai Analytics Request Scheduler"
	autoclose={false}
	class="w-full">
	{#if _formData}
		<div class="flex flex-col space-y-2">
			<Label class="space-y-2">
				<Select bind:value={_formData.schedulerId}
								onchange={() => onChangeScheduler()}
								placeholder="">
					<option value="">Create</option>
					{#each _schedulerList as scheduler}
						<option value={scheduler.id.toString()}>
							{getSchedulerName(scheduler)}
						</option>
					{/each}
				</Select>
			</Label>
			<!-- Ai & Ai Model -->
			<div class="grid grid-cols-2 gap-2">
				<Label class="space-y-2">
					<div>
						Ai
					</div>
					<Select bind:value={_formData.ai}
									placeholder="">
						{#each Object.values(AIModelCode) as ai}
							<option value={ai.code}>{ai.name}</option>
						{/each}
					</Select>
				</Label>
				<Label class="space-y-2">
					<div>
						Ai Model
					</div>
					<Select bind:value={_formData.aiModelId}
									onchange={() => onChangeAiModel()}
									placeholder="">
						<option value="">Select Model</option>
						{#each aiModelList.filter((item) => item.aiCode === _formData?.ai) as aiModel}
							<option value={aiModel.id.toString()}>{aiModel.modelName}</option>
						{/each}
					</Select>
				</Label>
			</div>
			<!-- Ai Prompts -->
			<Label class="space-y-2">
				<div>
					Ai Prompts
				</div>
				<Select bind:value={_formData.aiPromptsId}
								placeholder="">
					<option value="">Select Prompts</option>
					{#each _aiPromptsListByAiModelIdRecord[Number(_formData.aiModelId)] || [] as aiPrompts}
						<option value={aiPrompts.id.toString()}>{aiPrompts.title}</option>
					{/each}
				</Select>
			</Label>
			<!-- Market Currency -->
			<Label class="space-y-2">
				<div>
					Market Currency
				</div>
				<Select bind:value={_formData.marketCurrency}
								onchange={() => onChangeMarketCurrency()}
								placeholder="">
					{#each Object.values(MarketCurrencyCode) as marketCurrency}
						<option value={marketCurrency.code}>{marketCurrency.code}</option>
					{/each}
				</Select>
			</Label>
			<!-- Include Exclude & Market List -->
			<div class="grid grid-cols-2 gap-2">
				<Label class="space-y-2">
					<div>
						Include Exclude
					</div>

					<Select bind:value={_formData.includeExclude}
									onchange={() => onChangeIncludeExclude()}
									placeholder="">
						<option value="">None</option>
						{#each Object.values(AiAnalyticsSchedulerEnum) as item}
							<option value={item.key}>{item.key}</option>
						{/each}
					</Select>
				</Label>
				<Label class="space-y-2">
					<div>
						Market List
					</div>

					<MultiSelect
						disabled={!_formData.includeExclude}
						bind:value={_formData.marketList}
						items={_marketMultiSelectItems}
						placeholder="">
					</MultiSelect>
				</Label>
			</div>
			<!-- Candle Unit, Count, Time Zone -->
			<div class="grid grid-cols-3 gap-2">
				<Label class="space-y-2">
					<div>
						Candle Unit
					</div>
					<Select bind:value={_formData.candleUnit}
									placeholder="">
						<option value={UPBitCandleUnitEnum.days.key}>{UPBitCandleUnitEnum.days.key}</option>
						<option value={UPBitCandleUnitEnum.hours.key}>{UPBitCandleUnitEnum.hours.key}</option>
					</Select>
				</Label>
				<Label class="space-y-2">
					<div>
						Candle Count
					</div>
					<Input type="number"
								 min="60"
								 max="200"
								 step="1"
								 bind:value={_formData.candleCount} />
				</Label>
				<Label class="space-y-2">
					<div>
						Candle Time Zone
					</div>
					<Select bind:value={_formData.candleTimeZone}
									placeholder="">
						<option value={UPBitCandleTimeZones.utc}>{UPBitCandleTimeZones.utc}</option>
						<option value={UPBitCandleTimeZones.kst}>{UPBitCandleTimeZones.kst}</option>
					</Select>
				</Label>
			</div>
			<!-- Retry, Hour, Minute -->
			<div class="grid grid-cols-3 gap-2 mb-2">
				<Label class="space-y-2">
					<div>
						Retire
					</div>
					<Select
						bind:value={_formData.retryYn}
						placeholder="">
						<option value="true">반복</option>
						<option value="false">한번만</option>
					</Select>
				</Label>
				<Label class="space-y-2">
					<div>
						Hour
					</div>
					<Input let:props
								 class="text-end pe-4">
						<div slot="right">
							시
						</div>
						<Input
							type="number"
							min="0"
							max="23"
							step="1"
							{...props}
							bind:value={_formData.executeHours} />
					</Input>
				</Label>
				<Label class="space-y-2">
					<div>
						Minute
					</div>
					<Input let:props
								 class="text-end pe-4">
						<div slot="right">
							분
						</div>
						<Input
							type="number"
							min="0"
							max="59"
							step="1"
							{...props}
							bind:value={_formData.executeMinutes} />
					</Input>
				</Label>
			</div>
			{#if _processMessage}
				<div class="h-5">
				</div>
				<div class="text-blue-500 text-end items-end absolute right-4 bottom-24">
					{_processMessage}
				</div>
			{/if}
		</div>
	{/if}
	<svelte:fragment slot="footer">
		{#if _formData?.schedulerId}
			<div class="flex w-full items-center justify-between">
				<div class="inline-flex">
					<Button
						type="button"
						color="yellow"
						disabled={_deleteLoadingYn}
						onclick={async () => await deleteAiAnalyticsRequestScheduler()}>
						Delete
						{#if _deleteLoadingYn}
							<Spinner class="ml-2 w-4 h-4" />
						{/if}
					</Button>
				</div>
				<div class="inline-flex">
					<Button
						type="button"
						color="primary"
						disabled={_updateLoadingYn}
						onclick={async () => await updateAiAnalyticsRequestScheduler()}>
						Update
						{#if _updateLoadingYn}
							<Spinner class="ml-2 w-4 h-4" />
						{/if}
					</Button>
					<Button
						type="button"
						color="light"
						onclick={closeModal}>
						Close
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex w-full items-center justify-end">
				<Button
					type="button"
					color="primary"
					disabled={_createLoadingYn}
					onclick={async () => await createAiAnalyticsRequestScheduler()}>
					Create
					{#if _createLoadingYn}
						<Spinner class="ml-2 w-4 h-4" />
					{/if}
				</Button>
				<Button
					type="button"
					color="light"
					onclick={closeModal}>
					Close
				</Button>
			</div>
		{/if}
	</svelte:fragment>
</Modal>
