<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ProphetAnalyticsConfigEnum } from '$lib/common/enums/ProphetAnalyticsConfigEnum';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		type ProphetAnalyticsRequestConfigCreateData,
		type ProphetAnalyticsRequestConfigData,
		ProphetAnalyticsRequestConfigDataUtils,
		type ProphetAnalyticsRequestConfigUpdateData
	} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
	import {
		Button,
		Input,
		Label,
		Modal,
		Radio,
		Range
	} from 'flowbite-svelte';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';

	let {
		modalOpenYn = $bindable(),
		market
	}: {
		modalOpenYn: boolean,
		market: string
	} = $props();

	let _configData: ProphetAnalyticsRequestConfigCreateData = $state(
		ProphetAnalyticsConfigEnum.defaultData as unknown as ProphetAnalyticsRequestConfigCreateData
	);
	let _prophetAnalyticsRequestConfigId: number | null = $state(null);

	$effect(() => {
		if (market) {
			getProphetAnalyticsRequestConfig(market);
		}
	});

	onDestroy(() => {
		_prophetAnalyticsRequestConfigId = null;
	});

	async function getProphetAnalyticsRequestConfig(market: string) {
		_prophetAnalyticsRequestConfigId = null;
		_configData =
			ProphetAnalyticsConfigEnum.defaultData as unknown as ProphetAnalyticsRequestConfigCreateData;

		const responseObject = await ProphetAnalyticsWebApi.getProphetAnalyticsRequestConfig(
			market
		);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			return;
		}

		const analyticsRequestConfigData = responseObject.data as ProphetAnalyticsRequestConfigData;

		_prophetAnalyticsRequestConfigId = analyticsRequestConfigData.id;

		_configData = {
			...analyticsRequestConfigData
		};
	}

	async function createProphetAnalyticsRequestConfig() {
		if (!_configData) {
			console.error('Invalid prophet analytics request config input data');
			return;
		}

		_configData.market = market;

		if (ProphetAnalyticsConfigEnum.growth.linear === _configData.growth) {
			_configData.cap = undefined;
			_configData.floor = undefined;
		}

		if (_configData.changepointList?.length) {
			_configData.changepointNumber = undefined;
			_configData.changepointRange = undefined;
		} else {
			_configData.changepointList = undefined;
		}

		if (!_configData.holidaysCountry && !_configData.holidaysList?.length) {
			_configData.holidaysMode = undefined;
		}

		if (!_configData.holidaysList?.length) {
			_configData.holidaysList = undefined;
		}

		const result = ProphetAnalyticsRequestConfigDataUtils.validRequestData(_configData);

		if (!result.valid) {
			alert(result.message);
			return;
		}

		const responseObject = await ProphetAnalyticsWebApi.createProphetAnalyticsRequestConfig(
			_configData
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		modalOpenYn = false;
	}

	async function updateProphetAnalyticsRequestConfig() {
		if (!_prophetAnalyticsRequestConfigId) {
			console.error('Invalid prophet analytics request config id');
			return;
		}

		_configData.market = market;

		if (ProphetAnalyticsConfigEnum.growth.linear === _configData.growth) {
			_configData.cap = undefined;
			_configData.floor = undefined;
		}

		if (_configData.changepointList?.length) {
			_configData.changepointNumber = undefined;
			_configData.changepointRange = undefined;
		} else {
			_configData.changepointList = undefined;
		}

		if (!_configData.holidaysCountry && !_configData.holidaysList?.length) {
			_configData.holidaysMode = undefined;
		}

		if (!_configData.holidaysList?.length) {
			_configData.holidaysList = undefined;
		}

		const updateData: ProphetAnalyticsRequestConfigUpdateData = {
			id: _prophetAnalyticsRequestConfigId,
			..._configData
		};

		const result = ProphetAnalyticsRequestConfigDataUtils.validUpdateData(updateData);

		if (!result.valid) {
			alert(result.message);
			return;
		}

		const responseObject = await ProphetAnalyticsWebApi.updateProphetAnalyticsRequestConfig(updateData);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		modalOpenYn = false;
	}

	function resetProphetAnalyticsRequestConfig() {
		_configData = ProphetAnalyticsConfigEnum.defaultData as unknown as ProphetAnalyticsRequestConfigCreateData;
	}

	function onChangeChangepointDateList(e: Event) {
		const valueList = (e.target as HTMLInputElement).value.split(',');

		_configData.changepointList = valueList.filter((value) => value);
	}

	function onChangeHolidaysList(e: Event) {
		const valueList = (e.target as HTMLInputElement).value.split(',');

		_configData.holidaysList = valueList.filter((value) => value);
	}
</script>

<Modal bind:open={modalOpenYn}
			 size="sm"
			 autoclose={false}
			 class="w-full">
	<div class="flex flex-col space-y-6">
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			Prophet Analytics Config
		</h3>
		<Label class="space-y-2">
			<span>Title</span>
			<Input type="text"
						 name="title"
						 bind:value={_configData.title}
						 placeholder="Input title"
						 required />
		</Label>
		<!-- Candle -->
		<div class="grid gap-6 mb-6 md:grid-cols-2">
			<Label class="space-y-2">
				<span>Candle Type</span>
				<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
					<li class="w-full">
						<Radio name="candle-type"
									 class="p-3"
									 value={UPBitCandleUnitEnum.days.key}
									 bind:group={_configData.candleType}>
							{UPBitCandleUnitEnum.days.key}
						</Radio>
					</li>
					<li class="w-full">
						<Radio name="candle-type"
									 class="p-3"
									 value={UPBitCandleUnitEnum.hours.key}
									 bind:group={_configData.candleType}>
							{UPBitCandleUnitEnum.hours.key}
						</Radio>
					</li>
				</ul>
			</Label>
			<Label class="space-y-2">
				<span>Candle Time Zone</span>
				<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
					{#each Object.values(UPBitCandleTimeZones) as candleTimeZone}
						<li class="w-full">
							<Radio name="candle-time-zone"
										 class="p-3"
										 value={candleTimeZone}
										 bind:group={_configData.candleTimeZone}>
								{candleTimeZone}
							</Radio>
						</li>
					{/each}
				</ul>
			</Label>
		</div>
		<Label class="space-y-2">
			<span>Export Period</span>
			<Input let:props>
				<div slot="right">
					{#if _configData.candleType === UPBitCandleUnitEnum.days.key}
						Days
					{:else}
						Hours
					{/if}
				</div>
				<Input type="number"
							 name="Export Period"
							 min="0"
							 step="1"
							 {...props}
							 bind:value={_configData.exportPeriod}
							 placeholder="Input Export Period"
							 required />
			</Input>
		</Label>

		<!-- Growth -->
		<Label class="space-y-2">
			<span>Growth</span>
			<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
				{#each Object.values(ProphetAnalyticsConfigEnum.growth) as growth}
					<li class="w-full">
						<Radio name="growth"
									 class="p-3"
									 value={growth}
									 bind:group={_configData.growth}>
							{growth}
						</Radio>
					</li>
				{/each}
			</ul>
		</Label>
		{#if _configData.growth === ProphetAnalyticsConfigEnum.growth.logistic}
			<div class="grid gap-6 mb-6 md:grid-cols-2">
				<Label class="space-y-2">
					<span>Upper Bound</span>
					<Input type="number"
								 name="Upper Bound"
								 min="0"
								 step="0.001"
								 bind:value={_configData.cap}
								 placeholder="Input Upper Bound"
								 required />
				</Label>
				<Label class="space-y-2">
					<span>Lower Bound</span>
					<Input type="number"
								 name="Lower Bound"
								 min="0"
								 step="0.001"
								 bind:value={_configData.floor}
								 placeholder="Input Lower Bound"
								 required />
				</Label>
			</div>
		{/if}

		<!-- Changepoint -->
		<Label class="space-y-2">
			<span>Changepoint Date List</span>
			<Input type="text"
						 name="Changepoint Date List"
						 value={_configData.changepointList}
						 placeholder="Input Changepoint Date List"
						 onchange={(e) => onChangeChangepointDateList(e)}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Changepoint Prior Scale</span>
			<Input type="number"
						 name="Change Point Prior Scale"
						 min="0"
						 step="0.01"
						 bind:value={_configData.changepointPriorScale}
						 placeholder="Input Change Point Prior Scale"
						 required />
		</Label>
		{#if !_configData.changepointList?.length}
			<Label class="space-y-2">
				<span>Changepoint Number</span>
				<Input type="number"
							 name="Change Point Number"
							 min="0"
							 step="0.01"
							 bind:value={_configData.changepointNumber}
							 placeholder="Input Change Point Number"
							 required />
			</Label>
			{#if _configData.changepointRange !== null}
				<Label class="space-y-2">
					<span>Changepoint Range : {_configData.changepointRange}</span>
					<Range id="changepoint-range"
								 size="sm"
								 min="0"
								 max="1"
								 step="0.01"
								 bind:value={_configData.changepointRange} />
				</Label>
			{/if}
		{/if}

		<!-- Seasonality -->
		<Label class="space-y-2">
			<span>Seasonality Mode</span>
			<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
				{#each Object.values(ProphetAnalyticsConfigEnum.mode) as mode}
					<li class="w-full">
						<Radio name="seasonality-mode"
									 class="p-3"
									 value={mode}
									 bind:group={_configData.seasonalityMode}>
							{mode}
						</Radio>
					</li>
				{/each}
			</ul>
		</Label>
		<Label class="space-y-2">
			<span>Seasonality Prior Scale</span>
			<Input type="number"
						 name="Seasonality Prior Scale"
						 min="0"
						 step="0.1"
						 bind:value={_configData.seasonalityPriorScale}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Seasonality Yearly</span>
			<Input type="text"
						 name="Seasonality Yearly"
						 bind:value={_configData.yearlySeasonality}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Seasonality Weekly</span>
			<Input type="text"
						 name="Seasonality Weekly"
						 bind:value={_configData.weeklySeasonality}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Seasonality Daily</span>
			<Input type="text"
						 name="Seasonality Daily"
						 bind:value={_configData.dailySeasonality}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Seasonality Monthly</span>
			<Input type="number"
						 name="Seasonality Monthly"
						 min="0"
						 step="1"
						 bind:value={_configData.monthlySeasonality}
						 required />
		</Label>
		<!-- Holidays -->
		<Label class="space-y-2">
			<span>Holidays Country</span>
			<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
				<li class="w-full">
					<Radio name="holiday-country"
								 class="p-3"
								 value={undefined}
								 bind:group={_configData.holidaysCountry}>
						None
					</Radio>
				</li>
				{#each Object.values(ProphetAnalyticsConfigEnum.holidaysCountry) as country}
					<li class="w-full">
						<Radio name="holiday-country"
									 class="p-3"
									 value={country}
									 bind:group={_configData.holidaysCountry}>
							{country}
						</Radio>
					</li>
				{/each}
			</ul>
		</Label>
		<Label class="space-y-2">
			<span>Holidays List</span>
			<Input type="text"
						 name="Holidays List"
						 value={_configData.holidaysList}
						 placeholder="Input Holidays Date List"
						 onchange={(e) => onChangeHolidaysList(e)}
						 required />
		</Label>
		{#if _configData.holidaysCountry ||
		_configData.holidaysList?.length}
			<Label class="space-y-2">
				<span>Holidays Mode</span>
				<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
					<li class="w-full">
						<Radio name="holiday-mode"
									 class="p-3"
									 value={undefined}
									 bind:group={_configData.holidaysMode}>
							None
						</Radio>
					</li>
					{#each Object.values(ProphetAnalyticsConfigEnum.mode) as mode}
						<li class="w-full">
							<Radio name="holiday-mode"
										 class="p-3"
										 value={mode}
										 bind:group={_configData.holidaysMode}>
								{mode}
							</Radio>
						</li>
					{/each}
				</ul>
			</Label>
			<Label class="space-y-2">
				<span>Holidays Prior Scale</span>
				<Input type="number"
							 name="Holidays Prior Scale"
							 min="0"
							 step="0.1"
							 bind:value={_configData.holidaysPriorScale}
							 required />
			</Label>
		{/if}

		<!-- Default Config -->
		<Label class="space-y-2">
			<span>MCMC Samples</span>
			<Input type="number"
						 name="MCMC Samples"
						 min="0"
						 bind:value={_configData.mcmcSamples}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Interval Width</span>
			<Input type="number"
						 name="Interval Width"
						 min="0"
						 step="0.01"
						 bind:value={_configData.intervalWidth}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Scaling</span>
			<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
				{#each Object.values(ProphetAnalyticsConfigEnum.scaling) as scaling}
					<li class="w-full">
						<Radio name="scaling"
									 class="p-3"
									 value={scaling}
									 bind:group={_configData.scaling}>
							{scaling}
						</Radio>
					</li>
				{/each}
			</ul>
		</Label>
		<Label class="space-y-2">
			<span>Uncertainty Samples</span>
			<Input type="number"
						 name="Uncertainty Samples"
						 min="0"
						 bind:value={_configData.uncertaintySamples}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Stan Backend</span>
			<Input type="text"
						 name="Stan Backend"
						 bind:value={_configData.stanBackend}
						 placeholder="Input Stan Backend"
						 disabled />
		</Label>
	</div>
	<svelte:fragment slot="footer">
		<div class="flex w-full items-center justify-between">
			<Button type="button"
							color="none"
							class=""
							onclick={async () => resetProphetAnalyticsRequestConfig()}>
				Reset Default
			</Button>
			{#if _prophetAnalyticsRequestConfigId}
				<Button type="button"
								class="w-full1"
								onclick={async () => updateProphetAnalyticsRequestConfig()}>
					Update
				</Button>
			{:else}
				<Button type="button"
								class="w-full1"
								onclick={async () => createProphetAnalyticsRequestConfig()}>
					Create
				</Button>
			{/if}
		</div>
	</svelte:fragment>
</Modal>