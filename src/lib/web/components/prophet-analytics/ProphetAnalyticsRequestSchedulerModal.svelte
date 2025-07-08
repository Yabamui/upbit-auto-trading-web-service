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
	import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		type ProphetAnalyticsRequestSchedulerCreateData,
		type ProphetAnalyticsRequestSchedulerData,
		ProphetAnalyticsRequestSchedulerDataUtils,
		type ProphetAnalyticsRequestSchedulerUpdateData
	} from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';
	import { Trash2Icon } from 'lucide-svelte';
	import { MarketCurrencyCode } from '$lib/common/enums/MarketCurrencyType';
	import { ProphetAnalyticsSchedulerEnum } from '$lib/common/enums/ProphetAnalyticsSchedulerEnum';
	import type { ProphetAnalyticsRequestConfigNotExistMarketCreateResultData } from '$lib/common/models/ProphetAnalyticsRequestConfigData';
	import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';

	interface RequestSchedulerFormData {
		marketCurrency: string;
		candleUnit: string;
		retryYn: string;
		executeHours: number;
		executeMinutes: number;
		includeExclude: string;
		marketList: string[] | undefined;
		priceTypeList: string[] | undefined;
	}

	interface MultiSelectOption {
		value: string;
		name: string;
		color?: string;
	}

	let {
		openModalYn = $bindable(),
		marketInfoList
	}: {
		openModalYn: boolean,
		marketInfoList: MarketInfoData[]
	} = $props();

	let _formData: RequestSchedulerFormData = $state({
		marketCurrency: MarketCurrencyCode.KRW.code,
		candleUnit: UPBitCandleUnitEnum.days.key,
		retryYn: 'true',
		executeHours: new Date().getHours(),
		executeMinutes: new Date().getMinutes(),
		includeExclude: '',
		marketList: [],
		priceTypeList: []
	});
	let _prophetAnalyticsRequestSchedulerId: string = $state('');
	let _marketItemList: MultiSelectOption[] = $derived(getMultiSelectOptionList());
	let _priceTypeItems: MultiSelectOption[] = $derived(getMultiSelectOptionListByPriceType());
	let _prophetAnalyticsRequestSchedulerList: ProphetAnalyticsRequestSchedulerData[] = $state([]);
	let _createLoadingYn: boolean = $state(false);
	let _updateLoadingYn: boolean = $state(false);
	let _deleteLoadingYn: boolean = $state(false);
	let _processMessage: string = $state('');

	$effect(() => {
		if (openModalYn) {
			initData();
		}
	});

	function closeModal() {
		openModalYn = false;
	}

	async function initData() {
		clearData();

		await getProphetAnalyticsRequestSchedulerList();
	}

	function clearData() {
		_prophetAnalyticsRequestSchedulerList = [];
		resetData();
	}

	function resetData() {
		_prophetAnalyticsRequestSchedulerId = '';
		_formData = {
			marketCurrency: MarketCurrencyCode.KRW.code,
			candleUnit: UPBitCandleUnitEnum.days.key,
			retryYn: 'true',
			executeHours: new Date().getHours(),
			executeMinutes: new Date().getMinutes(),
			includeExclude: '',
			marketList: [],
			priceTypeList: []
		};
	}

	function updateFormData() {
		if (!_prophetAnalyticsRequestSchedulerId) {
			resetData();
			return;
		}

		const schedulerData: ProphetAnalyticsRequestSchedulerData | undefined =
			_prophetAnalyticsRequestSchedulerList.find((item: ProphetAnalyticsRequestSchedulerData) => {
				return item.id.toString() === _prophetAnalyticsRequestSchedulerId;
			});

		if (!schedulerData) {
			resetData();
			return;
		}

		_formData = {
			marketCurrency: schedulerData.marketCurrency,
			candleUnit: schedulerData.candleUnit,
			retryYn: `${ schedulerData.retryYn }`,
			executeHours: schedulerData.executeHours,
			executeMinutes: schedulerData.executeMinutes,
			includeExclude: schedulerData.includeExclude,
			marketList: schedulerData.marketList || [],
			priceTypeList: schedulerData.priceTypeList || []
		};
	}

	async function getProphetAnalyticsRequestSchedulerList() {
		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi.getProphetAnalyticsRequestSchedulerList();

		if (ResponseCode.success.code !== responseObject.code) {
			return;
		}

		_prophetAnalyticsRequestSchedulerList = responseObject.data as ProphetAnalyticsRequestSchedulerData[];
	}

	function getMultiSelectOptionList(): MultiSelectOption[] {
		return marketInfoList
			.filter((marketInfoData: MarketInfoData) => {
				return marketInfoData.market.includes(_formData.marketCurrency);
			})
			.map((marketInfoData: MarketInfoData) => {
				return {
					value: marketInfoData.market,
					name: marketInfoData.koreanName
				};
			})
			.sort((a: MultiSelectOption, b: MultiSelectOption) => {
				return a.name.localeCompare(b.name);
			});
	}

	function getMultiSelectOptionListByPriceType(): MultiSelectOption[] {
		return Object.values(ProphetAnalyticsPriceTypeEnum).map((item) => {
			return {
				value: item.key,
				name: item.value
			};
		});
	}

	async function createProphetAnalyticsRequestScheduler() {
		_createLoadingYn = true;
		_processMessage = 'Start Create...';

		let marketList: string[] | undefined = undefined;

		if (_formData.includeExclude) {
			if (_formData.marketList && _formData.marketList.length > 0) {
				marketList = _formData.marketList;
			} else {
				_formData.includeExclude = '';
			}
		}

		const createData: ProphetAnalyticsRequestSchedulerCreateData = {
			marketCurrency: _formData.marketCurrency,
			candleUnit: _formData.candleUnit,
			retryYn: _formData.retryYn === 'true',
			executeHours: _formData.executeHours,
			executeMinutes: _formData.executeMinutes,
			executeYn: false,

			includeExclude: _formData.includeExclude,
			marketList: marketList,
			priceTypeList: _formData.priceTypeList
		};

		_processMessage = "Create Data Check...";

		const validResult = ProphetAnalyticsRequestSchedulerDataUtils.validCreateData(createData);

		if (!validResult.valid) {
			_processMessage = validResult.message;

			await new Promise((resolve) => setTimeout(resolve, 3000));

			_createLoadingYn = false;
			_processMessage = '';

			return;
		}

		_processMessage = 'Check All Market Analytics Request Config...';

		const createResult: ProphetAnalyticsRequestConfigNotExistMarketCreateResultData | undefined =
			await createProphetAnalyticsRequestConfigByNotExistMarket(
				createData.marketCurrency,
				createData.candleUnit,
				createData.includeExclude,
				createData.marketList
			);

		if (createResult === undefined || createResult.createFailCount > 0) {
			_processMessage = 'Check All Market Analytics Request Config Fail...';

			await new Promise((resolve) => setTimeout(resolve, 3000));

			_createLoadingYn = false;
			_processMessage = '';

			return;
		}

		if (createResult.newConfigCount > 0) {
			_processMessage = 'New Market Analytics Request Config Count: ' + createResult.newConfigCount;
		} else {
			_processMessage = 'All Market Analytics Request Config Exist...';
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));

		_processMessage = 'Create Scheduler...';

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi
			.createProphetAnalyticsRequestScheduler(createData);

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = 'Create Scheduler Fail...';

			await new Promise((resolve) => setTimeout(resolve, 3000));

			_createLoadingYn = false;
			_processMessage = '';

			return;
		}

		_processMessage = 'Create Scheduler Success...';

		await new Promise((resolve) => setTimeout(resolve, 3000));

		_createLoadingYn = false;
		_processMessage = '';

		await getProphetAnalyticsRequestSchedulerList();
	}

	async function updateProphetAnalyticsRequestScheduler() {
		_processMessage = 'Start Update...';

		_updateLoadingYn = true;

		let marketList: string[] | undefined = undefined;

		if (_formData.includeExclude) {
			if (_formData.marketList && _formData.marketList.length > 0) {
				marketList = _formData.marketList;
			} else {
				_formData.includeExclude = '';
			}
		}

		const updateData: ProphetAnalyticsRequestSchedulerUpdateData = {
			id: Number(_prophetAnalyticsRequestSchedulerId),
			marketCurrency: _formData.marketCurrency,
			candleUnit: _formData.candleUnit,
			retryYn: _formData.retryYn === 'true',
			executeHours: _formData.executeHours,
			executeMinutes: _formData.executeMinutes,
			executeYn: false,

			includeExclude: _formData.includeExclude,
			marketList: marketList,
			priceTypeList: _formData.priceTypeList
		};

		const validResult = ProphetAnalyticsRequestSchedulerDataUtils.validUpdateData(updateData);

		_processMessage = 'Update Data Check...';

		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (!validResult.valid) {
			_processMessage = validResult.message;

			await new Promise((resolve) => setTimeout(resolve, 3000));

			_processMessage = '';
			_updateLoadingYn = false;
			return;
		}

		_processMessage = 'Update Scheduler...';

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi
			.updateProphetAnalyticsRequestScheduler(updateData);

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = 'Update Scheduler Fail : ' + responseObject.message;

			await new Promise((resolve) => setTimeout(resolve, 3000));

			_processMessage = '';
			_updateLoadingYn = false;
			return;
		}

		_processMessage = 'Update Scheduler Success...';
		await new Promise((resolve) => setTimeout(resolve, 1000));

		_processMessage = '';
		_updateLoadingYn = false;

		await getProphetAnalyticsRequestSchedulerList();
	}

	async function deleteProphetAnalyticsRequestScheduler() {
		if (!_prophetAnalyticsRequestSchedulerId) {
			return;
		}

		_deleteLoadingYn = true;

		const responseObject: ResponseObject<unknown> = await ProphetAnalyticsWebApi
			.deleteProphetAnalyticsRequestScheduler(Number(_prophetAnalyticsRequestSchedulerId));

		setTimeout(async () => {
			_deleteLoadingYn = false;
			if (ResponseCode.success.code !== responseObject.code) {
				return;
			}

			resetData();
			await getProphetAnalyticsRequestSchedulerList();
		}, 1000);
	}

	async function createProphetAnalyticsRequestConfigByNotExistMarket(
		marketCurrency: string,
		candleUnit: string,
		includeExclude: string,
		marketList: string[] | undefined
	): Promise<ProphetAnalyticsRequestConfigNotExistMarketCreateResultData | undefined> {
		const responseObject = await ProphetAnalyticsWebApi
			.createProphetAnalyticsRequestConfigByNotExistMarket(
				marketCurrency,
				candleUnit,
				includeExclude,
				marketList
			);

		if (ResponseCode.success.code !== responseObject.code) {
			return undefined;
		}

		return responseObject.data as ProphetAnalyticsRequestConfigNotExistMarketCreateResultData;
	}

	function getSchedulerName(scheduler: ProphetAnalyticsRequestSchedulerData): string {
		return `${ scheduler.marketCurrency }-${ scheduler.candleUnit }-${ scheduler.executeHours }:${ scheduler.executeMinutes }`;
	}

</script>

<Modal
	bind:open={openModalYn}
	size="sm"
	title="Prophet Analytics Request Schedule"
	autoclose={false}
	class="w-full min-h-[800px]">
	<div class="flex flex-col space-y-6">
		{#if _prophetAnalyticsRequestSchedulerList.length > 0}
			<Select bind:value={_prophetAnalyticsRequestSchedulerId}
							onchange={updateFormData}
							placeholder="">
				<option value="">CREATE</option>
				{#each _prophetAnalyticsRequestSchedulerList as prophetAnalyticsRequestSchedulerData}
					<option value={prophetAnalyticsRequestSchedulerData.id}>
						{getSchedulerName(prophetAnalyticsRequestSchedulerData)}
					</option>
				{/each}
			</Select>
		{/if}
		<div class="grid grid-cols-2 gap-2 mb-2">
			<Label class="space-y-2">
				<div>
					Market Currency
				</div>
				<Select bind:value={_formData.marketCurrency}
								placeholder="">
					<option value={MarketCurrencyCode.KRW.code}>
						{MarketCurrencyCode.KRW.code}
					</option>
				</Select>
			</Label>
			<Label class="space-y-2">
				<div>
					Candle Unit
				</div>
				<Select bind:value={_formData.candleUnit}
								required
								placeholder="">
					<option value={UPBitCandleUnitEnum.days.key}>
						{UPBitCandleUnitEnum.days.key}
					</option>
					<option value={UPBitCandleUnitEnum.hours.key}>
						{UPBitCandleUnitEnum.hours.key}
					</option>
				</Select>
			</Label>
		</div>
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
		<Label class="space-y-2">
			<div>
				Price Type List
			</div>
			<MultiSelect
				items={_priceTypeItems}
				bind:value={_formData.priceTypeList}>
			</MultiSelect>
		</Label>
		<div class="grid grid-cols-2 gap-2 mb-2">
			<Label class="space-y-2">
				<div>
					Include Exclude
				</div>
				<Select bind:value={_formData.includeExclude}
								placeholder="">
					<option value="">None</option>
					{#each Object.values(ProphetAnalyticsSchedulerEnum) as schedulerEnum}
						<option value={schedulerEnum.key}>
							{schedulerEnum.key}
						</option>
					{/each}
				</Select>
			</Label>
			<Label class="space-y-2">
				<div>
					Market List
				</div>
				<MultiSelect
					items={_marketItemList}
					disabled={!_formData.includeExclude}
					required={!!_formData.includeExclude}
					bind:value={_formData.marketList}>
				</MultiSelect>
			</Label>
		</div>
		{#if _processMessage}
			<div class="text-blue-500 text-end items-end absolute right-4 bottom-24">
				{_processMessage}
			</div>
		{/if}
	</div>
	<svelte:fragment slot="footer">
		{#if _prophetAnalyticsRequestSchedulerId}
			<div class="flex flex-row w-full items-center justify-between">
				<Button
					type="button"
					color="light"
					onclick={deleteProphetAnalyticsRequestScheduler}>
					<Trash2Icon class="w-4 h-4" />
					{#if _deleteLoadingYn}
						<Spinner class="ml-2 w-4 h-4" />
					{/if}
				</Button>
				<div class="flex flex-row">
					<Button type="button"
									onclick={async () => updateProphetAnalyticsRequestScheduler()}>
						Update
						{#if _updateLoadingYn}
							<Spinner class="ml-2 w-4 h-4" />
						{/if}
					</Button>
					<Button type="button"
									color="light"
									onclick={closeModal}>
						Close
					</Button>
				</div>
			</div>
		{:else}
			<div class="flex flex-row w-full items-center justify-end">
				<Button type="button"
								onclick={async () => createProphetAnalyticsRequestScheduler()}>
					Create
					{#if _createLoadingYn}
						<Spinner class="ml-2 w-4 h-4" />
					{/if}
				</Button>
				<Button type="button"
								color="light"
								onclick={closeModal}>
					Close
				</Button>
			</div>
		{/if}

	</svelte:fragment>
</Modal>