<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ProphetAnalyticsConfigEnum } from '$lib/common/enums/ProphetAnalyticsConfigEnum';
	import { ProphetAnalyticsWebApi } from '$lib/web/request/ProphetAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		type ProphetAnalyticsCustomSeasonalityData,
		type ProphetAnalyticsRequestConfigCreateData,
		type ProphetAnalyticsRequestConfigData,
		ProphetAnalyticsRequestConfigDataUtils,
		type ProphetAnalyticsRequestConfigUpdateData,
		type RequestConfigFormData
	} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
	import {
		Badge,
		Button,
		Input,
		Label,
		Listgroup,
		ListgroupItem,
		Modal,
		Radio,
		Range,
		Select,
		Toggle
	} from 'flowbite-svelte';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import {
		MinusIcon,
		PlusIcon
	} from 'lucide-svelte';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

	let {
		modalOpenYn = $bindable(),
		market,
		reloadProphetAnalyticsRequestConfig
	}: {
		modalOpenYn: boolean,
		market: string,
		reloadProphetAnalyticsRequestConfig: () => void
	} = $props();

	const candleTimeZone = UPBitCandleTimeZones.utc;

	let _formData: RequestConfigFormData | undefined = $state(undefined);
	let _candleUnit: string = $state(UPBitCandleUnitEnum.days.key);
	let _requestConfigId: number | undefined = $state(undefined);
	let _requestConfigByCandleUnitRecord: Record<string, ProphetAnalyticsRequestConfigData> | undefined = $state(undefined);

	$effect(() => {
		if (market) {
			initProphetAnalyticsRequestConfig(market);
		}
	});

	onDestroy(() => {
		clearData();
	});

	function clearData() {
		_formData = undefined;
		_requestConfigId = undefined;
		_requestConfigByCandleUnitRecord = undefined;
	}

	async function initProphetAnalyticsRequestConfig(market: string) {
		clearData();

		await getProphetAnalyticsRequestConfig(market);

		await setFormData();
	}

	async function getProphetAnalyticsRequestConfig(market: string) {
		const responseObject = await ProphetAnalyticsWebApi.getProphetAnalyticsRequestConfigList(
			market
		);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			return;
		}

		const requestConfigList: ProphetAnalyticsRequestConfigData[] = responseObject.data as ProphetAnalyticsRequestConfigData[];

		_requestConfigByCandleUnitRecord = requestConfigList.reduce((acc, requestConfig) => {
			acc[requestConfig.candleUnit] = requestConfig;
			return acc;
		}, {} as Record<string, ProphetAnalyticsRequestConfigData>);
	}

	async function setFormData() {

		const requestConfigData = _requestConfigByCandleUnitRecord ?
			_requestConfigByCandleUnitRecord[_candleUnit] :
			undefined;

		if (!requestConfigData) {
			_requestConfigId = undefined;
			await setDefaultFormData();
			return;
		}

		_requestConfigId = requestConfigData.id;
		const nowDate: Date = CurrentDateUtils.getNowDateTime();

		_formData = {
			candleTimeZone: candleTimeZone,
			beginCandleDateTime: requestConfigData.beginCandleDateTime,
			endCandleDateTime: requestConfigData.endCandleDateTime,

			growth: requestConfigData.growth,
			exportPeriod: requestConfigData.exportPeriod,
			cap: requestConfigData.cap,
			floor: requestConfigData.floor,

			changepointList: requestConfigData.changepointList,
			changepointDate: {
				year: nowDate.getFullYear()
					.toString(),
				month: (nowDate.getMonth() + 1).toString(),
				day: nowDate.getDate()
					.toString()
			},
			changepointPriorScale: requestConfigData.changepointPriorScale,
			changepointNumber: requestConfigData.changepointNumber,
			changepointRange: requestConfigData.changepointRange,

			seasonalityMode: requestConfigData.seasonalityMode,
			seasonalityPriorScale: requestConfigData.seasonalityPriorScale,
			yearlySeasonality: requestConfigData.yearlySeasonality,
			yearlySeasonalityFourierOrder: 0,
			weeklySeasonality: requestConfigData.weeklySeasonality,
			weeklySeasonalityFourierOrder: 0,
			dailySeasonality: requestConfigData.dailySeasonality,
			dailySeasonalityFourierOrder: 0,
			customSeasonalityList: requestConfigData.customSeasonalityList,
			customSeasonality: {
				name: '',
				period: 0,
				mode: '',
				fourierOrder: 0
			},

			holidaysCountry: requestConfigData.holidaysCountry,
			holidaysList: requestConfigData.holidaysList,
			holidaysDate: {
				year: nowDate.getFullYear()
					.toString(),
				month: (nowDate.getMonth() + 1).toString(),
				day: nowDate.getDate()
					.toString()
			},
			holidaysPriorScale: requestConfigData.holidaysPriorScale,
			holidaysMode: requestConfigData.holidaysMode,

			regressor: {
				volume: false,
				atr: false,
				rsi: false,
				macd: false,
				bollingerBand: false
			},

			mcmcSamples: requestConfigData.mcmcSamples,
			intervalWidth: requestConfigData.intervalWidth,
			uncertaintySamples: requestConfigData.uncertaintySamples,
			stanBackend: requestConfigData.stanBackend,
			scaling: requestConfigData.scaling
		};
	}

	async function setDefaultFormData() {
		const nowDate: Date = CurrentDateUtils.getNowDateTime();

		_formData = {
			candleTimeZone: candleTimeZone,
			beginCandleDateTime: ProphetAnalyticsConfigEnum.defaultData.beginCandleDateTime,
			endCandleDateTime: ProphetAnalyticsConfigEnum.defaultData.endCandleDateTime,

			growth: ProphetAnalyticsConfigEnum.defaultData.growth,
			exportPeriod: ProphetAnalyticsConfigEnum.defaultData.exportPeriod,
			cap: ProphetAnalyticsConfigEnum.defaultData.cap,
			floor: ProphetAnalyticsConfigEnum.defaultData.floor,

			changepointList: ProphetAnalyticsConfigEnum.defaultData.changepointList as unknown as string[],
			changepointDate: {
				year: nowDate.getFullYear()
					.toString(),
				month: (nowDate.getMonth() + 1).toString(),
				day: nowDate.getDate()
					.toString()
			},
			changepointPriorScale: ProphetAnalyticsConfigEnum.defaultData.changepointPriorScale,
			changepointNumber: ProphetAnalyticsConfigEnum.defaultData.changepointNumber,
			changepointRange: ProphetAnalyticsConfigEnum.defaultData.changepointRange,

			seasonalityMode: ProphetAnalyticsConfigEnum.defaultData.seasonalityMode,
			seasonalityPriorScale: ProphetAnalyticsConfigEnum.defaultData.seasonalityPriorScale,
			yearlySeasonality: ProphetAnalyticsConfigEnum.defaultData.yearlySeasonality,
			yearlySeasonalityFourierOrder: 0,
			weeklySeasonality: ProphetAnalyticsConfigEnum.defaultData.weeklySeasonality,
			weeklySeasonalityFourierOrder: 0,
			dailySeasonality: ProphetAnalyticsConfigEnum.defaultData.dailySeasonality,
			dailySeasonalityFourierOrder: 0,
			customSeasonalityList: ProphetAnalyticsConfigEnum.defaultData.customSeasonalityList as unknown as ProphetAnalyticsCustomSeasonalityData[],
			customSeasonality: {
				name: '',
				period: 0,
				mode: '',
				fourierOrder: 0
			},

			holidaysCountry: ProphetAnalyticsConfigEnum.defaultData.holidaysCountry,
			holidaysList: ProphetAnalyticsConfigEnum.defaultData.holidaysList as unknown as string[],
			holidaysDate: {
				year: nowDate.getFullYear()
					.toString(),
				month: (nowDate.getMonth() + 1).toString(),
				day: nowDate.getDate()
					.toString()
			},
			holidaysPriorScale: ProphetAnalyticsConfigEnum.defaultData.holidaysPriorScale,
			holidaysMode: ProphetAnalyticsConfigEnum.defaultData.holidaysMode,

			regressor: ProphetAnalyticsConfigEnum.regressor,

			mcmcSamples: ProphetAnalyticsConfigEnum.defaultData.mcmcSamples,
			intervalWidth: ProphetAnalyticsConfigEnum.defaultData.intervalWidth,
			uncertaintySamples: ProphetAnalyticsConfigEnum.defaultData.uncertaintySamples,
			stanBackend: ProphetAnalyticsConfigEnum.defaultData.stanBackend,
			scaling: ProphetAnalyticsConfigEnum.defaultData.scaling
		};
	}

	async function createProphetAnalyticsRequestConfig() {
		if (!_formData) {
			console.error('Invalid prophet analytics request config input data');
			return;
		}

		await clearRequestBefore();

		const createData: ProphetAnalyticsRequestConfigCreateData =
			ProphetAnalyticsRequestConfigDataUtils.createProphetAnalyticsRequestCreateData(
				market,
				_candleUnit,
				_formData
			);

		const result = ProphetAnalyticsRequestConfigDataUtils.validRequestData(createData);

		if (!result.valid) {
			alert(result.message);
			return;
		}

		const responseObject = await ProphetAnalyticsWebApi.createProphetAnalyticsRequestConfig(
			createData
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		const requestConfigData = responseObject.data as ProphetAnalyticsRequestConfigData;

		_requestConfigId = requestConfigData.id;

		modalOpenYn = false;
		reloadProphetAnalyticsRequestConfig();
	}

	async function updateProphetAnalyticsRequestConfig() {
		if (!_requestConfigId) {
			console.error('Invalid prophet analytics request config id');
			return;
		}

		if (!_formData) {
			console.error('Invalid prophet analytics request config input data');
			return;
		}

		await clearRequestBefore();

		const updateData: ProphetAnalyticsRequestConfigUpdateData =
			ProphetAnalyticsRequestConfigDataUtils.createProphetAnalyticsRequestUpdateData(
				_requestConfigId,
				market,
				_candleUnit,
				_formData
			);

		console.log($state.snapshot(updateData));

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
		reloadProphetAnalyticsRequestConfig();
	}

	async function clearRequestBefore() {
		if (!_formData) {
			return;
		}

		if (ProphetAnalyticsConfigEnum.growth.linear === _formData.growth) {
			_formData.cap = undefined;
			_formData.floor = undefined;
		}

		if (_formData.changepointList?.length) {
			_formData.changepointNumber = undefined;
			_formData.changepointRange = undefined;
		} else {
			_formData.changepointList = undefined;
		}

		if (!_formData.holidaysCountry && !_formData.holidaysList?.length) {
			_formData.holidaysMode = undefined;
		}

		if (!_formData.holidaysList?.length) {
			_formData.holidaysList = undefined;
		}
	}

	function addChangepointDate() {

		if (!_formData || !_formData.changepointDate.year || !_formData.changepointDate.month ||
			!_formData.changepointDate.day) {
			return;
		}

		if (!_formData.changepointList) {
			_formData.changepointList = [];
		}

		const month = _formData.changepointDate.month.toString()
			.padStart(2, '0');
		const day = _formData.changepointDate.day.toString()
			.padStart(2, '0');

		const date = `${ _formData.changepointDate.year }-${ month }-${ day }`;

		if (_formData.changepointList.includes(date)) {
			return;
		}

		_formData.changepointList.push(date);
	}

	function removeChangepointDate(date: string) {
		if (!_formData || !_formData.changepointList) {
			return;
		}

		const index = _formData.changepointList.indexOf(date);

		if (index === -1) {
			return;
		}

		_formData.changepointList.splice(index, 1);
	}

	function addHolidaysDate() {
		if (!_formData || !_formData.holidaysDate.year || !_formData.holidaysDate.month || !_formData.holidaysDate.day) {
			return;
		}

		if (!_formData.holidaysList) {
			_formData.holidaysList = [];
		}

		const month = _formData.holidaysDate.month.toString()
			.padStart(2, '0');
		const day = _formData.holidaysDate.day.toString()
			.padStart(2, '0');

		console.log('month', month);
		console.log('day', day);

		const date = `${ _formData.holidaysDate.year }-${ month }-${ day }`;

		if (_formData.holidaysList.includes(date)) {
			return;
		}

		_formData.holidaysList.push(date);
	}

	function removeHolidaysList(date: string) {
		if (!_formData || !_formData.holidaysList) {
			return;
		}

		const index = _formData.holidaysList.indexOf(date);

		if (index === -1) {
			return;
		}

		_formData.holidaysList.splice(index, 1);
	}

	function addCustomSeasonality() {
		if (!_formData || !_formData.customSeasonality.name ||
			!_formData.customSeasonality.period ||
			!_formData.customSeasonality.mode ||
			!_formData.customSeasonality.fourierOrder) {
			return;
		}

		const customSeasonalityData = _formData.customSeasonality;

		if (_formData.customSeasonalityList) {
			const matchedConfigYn = _formData.customSeasonalityList.some((customSeasonality) => {
				return customSeasonality.name === customSeasonalityData.name &&
					customSeasonality.period === customSeasonalityData.period &&
					customSeasonality.mode === customSeasonalityData.mode &&
					customSeasonality.fourierOrder === customSeasonalityData.fourierOrder;
			});

			if (matchedConfigYn) {
				return;
			}
		}

		if (!_formData.customSeasonalityList) {
			_formData.customSeasonalityList = [];
		}

		_formData.customSeasonalityList.push(customSeasonalityData);
	}

	function removeCustomSeasonality(index: number) {
		if (!_formData || !_formData.customSeasonalityList) {
			return;
		}

		_formData.customSeasonalityList.splice(index, 1);
	}
</script>

<Modal bind:open={modalOpenYn}
			 size="sm"
			 title="Prophet Analytics Config"
			 autoclose={false}
			 class="w-full">
	{#if _formData}
		<div class="flex flex-col space-y-6">
			<!-- Candle Unit -->
			<Select bind:value={_candleUnit}
							onchange={setFormData}
							placeholder="">
				<option value={UPBitCandleUnitEnum.days.key}>
					{UPBitCandleUnitEnum.days.key}
				</option>
				<option value={UPBitCandleUnitEnum.hours.key}>
					{UPBitCandleUnitEnum.hours.key}
				</option>
			</Select>
			<!--			<Label class="space-y-2">-->
			<!--				<span>Candle Time Zone</span>-->
			<!--				<ul class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">-->
			<!--					{#each Object.values(UPBitCandleTimeZones) as candleTimeZone}-->
			<!--						<li class="w-full">-->
			<!--							<Radio name="candle-time-zone"-->
			<!--										 class="p-3"-->
			<!--										 value={candleTimeZone}-->
			<!--										 bind:group={_formData.candleTimeZone}>-->
			<!--								{candleTimeZone}-->
			<!--							</Radio>-->
			<!--						</li>-->
			<!--					{/each}-->
			<!--				</ul>-->
			<!--			</Label>-->
			<!-- Export Period -->
			<Label class="space-y-2">
				<span>Export Period</span>
				<Input let:props>
					<div slot="right">
						{#if _candleUnit === UPBitCandleUnitEnum.days.key}
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
								 bind:value={_formData.exportPeriod}
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
										 bind:group={_formData.growth}>
								{growth}
							</Radio>
						</li>
					{/each}
				</ul>
			</Label>
			<!-- Growth Logistic Upper & Lower -->
			{#if _formData.growth === ProphetAnalyticsConfigEnum.growth.logistic}
				<div class="grid gap-6 mb-6 md:grid-cols-2">
					<Label class="space-y-2">
						<span>Upper Bound</span>
						<Input type="number"
									 name="Upper Bound"
									 min="0"
									 step="0.001"
									 bind:value={_formData.cap}
									 placeholder="Input Upper Bound"
									 required />
					</Label>
					<Label class="space-y-2">
						<span>Lower Bound</span>
						<Input type="number"
									 name="Lower Bound"
									 min="0"
									 step="0.001"
									 bind:value={_formData.floor}
									 placeholder="Input Lower Bound"
									 required />
					</Label>
				</div>
			{/if}

			<!-- Changepoint Date List -->
			<Label class="space-y-2">
				<span>Changepoint Date List</span>
				<div class="flex flex-row w-full gap-2 mb-4 justify-between">
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Year
						</div>
						<Input
							type="number"
							name="Changepoint Year"
							min="1990"
							max={new Date().getFullYear()}
							step="1"
							{...props}
							bind:value={_formData.changepointDate.year}
						/>
					</Input>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Month
						</div>
						<Input
							type="number"
							name="Changepoint Month"
							min="1"
							max="12"
							step="1"
							{...props}
							bind:value={_formData.changepointDate.month}
						/>
					</Input>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Day
						</div>
						<Input
							type="number"
							name="Changepoint Day"
							min="1"
							max="31"
							step="1"
							{...props}
							bind:value={_formData.changepointDate.day}
						/>
					</Input>
					<Button
						color="light"
						id="change-point-add-button"
						onclick={() => addChangepointDate()}
						size="sm"
						class="p-2 focus:ring-0">
						<PlusIcon class="w-4 h-4" />
					</Button>
				</div>
				{#if _formData.changepointList && _formData.changepointList.length}
					<Listgroup class="h-20 overflow-y-auto">
						{#each _formData?.changepointList.sort((a, b) => b.localeCompare(a)) as changepoint}
							<ListgroupItem itemDefaultClass="flex w-full px-4 items-center justify-between h-9">
								<Badge color="blue">
									{changepoint}
								</Badge>
								<Button
									color="light"
									onclick={() => removeChangepointDate(changepoint)}
									size="sm"
									class="p-2 focus:ring-0">
									<MinusIcon class="w-3 h-3" />
								</Button>
							</ListgroupItem>
						{/each}
					</Listgroup>
				{/if}
			</Label>
			<!-- Changepoint Prior Scale-->
			<Label class="space-y-2">
				<span>Changepoint Prior Scale</span>
				<Input type="number"
							 name="Change Point Prior Scale"
							 min="0"
							 step="0.01"
							 bind:value={_formData.changepointPriorScale}
							 placeholder="Input Change Point Prior Scale"
							 required />
			</Label>
			<!-- Changepoint Number & Range -->
			{#if !_formData.changepointList?.length}
				<div class="grid grid-cols-2 gap-4 mb-4">
					<Label class="space-y-2">
						<span>Changepoint Number</span>
						<Input type="number"
									 name="Change Point Number"
									 min="0"
									 step="0.01"
									 bind:value={_formData.changepointNumber}
									 placeholder="Input Change Point Number"
									 required />
					</Label>
					{#if _formData.changepointRange !== null}
						<Label class="space-y-2">
							<span>Changepoint Range : {_formData.changepointRange}</span>
							<Range id="changepoint-range"
										 size="md"
										 min="0"
										 max="1"
										 step="0.01"
										 bind:value={_formData.changepointRange} />
						</Label>
					{/if}
				</div>
			{/if}

			<!-- Seasonality Mode & Prior Scale-->
			<div class="grid grid-cols-5 gap-4 mb-4">
				<Label class="space-y-2 col-span-3">
					<span>Seasonality Mode</span>
					<Select bind:value={_formData.seasonalityMode}
									placeholder="">
						{#each Object.values(ProphetAnalyticsConfigEnum.mode) as mode}
							<option value={mode}>
								{mode}
							</option>
						{/each}
					</Select>
				</Label>
				<!-- Seasonality Prior Scale -->
				<Label class="space-y-2 col-span-2">
					<span>Seasonality Prior Scale</span>
					<Input type="number"
								 name="Seasonality Prior Scale"
								 min="0"
								 step="0.1"
								 bind:value={_formData.seasonalityPriorScale}
								 required />
				</Label>
			</div>
			<!-- Seasonality Yearly -->
			<Label class="space-y-2">
				<span>Seasonality Yearly</span>
				<div class="grid grid-cols-2 gap-4 mb-4">
					<Select bind:value={_formData.yearlySeasonality}>
						{#each Object.values(ProphetAnalyticsConfigEnum.seasonalityValue) as value}
							<option value={value}>
								{value}
							</option>
						{/each}
					</Select>
					{#if _formData.yearlySeasonality === ProphetAnalyticsConfigEnum.seasonalityValue.number}
						<Input type="number"
									 name="Seasonality Yearly Fourier terms"
									 min="0"
									 step="1"
									 bind:value={_formData.yearlySeasonalityFourierOrder}
									 placeholder="Input Seasonality Yearly Fourier terms"
									 required />
					{/if}
				</div>
			</Label>
			<!-- Seasonality Weekly-->
			<Label class="space-y-2">
				<span>Seasonality Weekly</span>
				<div class="grid grid-cols-2 gap-4 mb-4">
					<Select bind:value={_formData.weeklySeasonality}>
						{#each Object.values(ProphetAnalyticsConfigEnum.seasonalityValue) as value}
							<option value={value}>
								{value}
							</option>
						{/each}
					</Select>
					{#if _formData.weeklySeasonality === ProphetAnalyticsConfigEnum.seasonalityValue.number}
						<Input type="number"
									 name="Seasonality Weekly Fourier terms"
									 min="0"
									 step="1"
									 bind:value={_formData.weeklySeasonalityFourierOrder}
									 placeholder="Input Seasonality Weekly Fourier terms"
									 required />
					{/if}
				</div>
			</Label>
			<!-- Seasonality Daily -->
			<Label class="space-y-2">
				<span>Seasonality Daily</span>
				<div class="grid grid-cols-2 gap-4 mb-4">
					<Select bind:value={_formData.dailySeasonality}>
						{#each Object.values(ProphetAnalyticsConfigEnum.seasonalityValue) as value}
							<option value={value}>
								{value}
							</option>
						{/each}
					</Select>
					{#if _formData.dailySeasonality === ProphetAnalyticsConfigEnum.seasonalityValue.number}
						<Input type="number"
									 name="Seasonality Daily Fourier terms"
									 min="0"
									 step="1"
									 bind:value={_formData.dailySeasonalityFourierOrder}
									 placeholder="Input Seasonality Daily Fourier terms"
									 required />
					{/if}
				</div>
			</Label>
			<!-- Custom Seasonality -->
			<Label class="space-y-2">
				<span>Custom Seasonality</span>
				<div class="flex flex-row w-full gap-2 mb-4 justify-between">
					<Select bind:value={_formData.customSeasonality.name}
									class="text-[12px]"
									size="sm"
									placeholder="">
						<option value="">
							Name
						</option>
						{#each Object.values(ProphetAnalyticsConfigEnum.seasonalityCustomName) as value}
							<option value={value}>
								{value}
							</option>
						{/each}
					</Select>
					<Select bind:value={_formData.customSeasonality.mode}
									class="text-[12px]"
									size="sm"
									placeholder="">
						<option value="">
							Mode
						</option>
						{#each Object.values(ProphetAnalyticsConfigEnum.mode) as value}
							<option value={value}>
								{value}
							</option>
						{/each}
					</Select>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Days
						</div>
						<Input type="number"
									 name="Custom Seasonality Period"
									 min="0"
									 step="0.5"
									 {...props}
									 bind:value={_formData.customSeasonality.period}
									 required />
					</Input>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Fourier
						</div>
						<Input type="number"
									 name="Custom Seasonality Fourier Order"
									 min="0"
									 step="1"
									 {...props}
									 bind:value={_formData.customSeasonality.fourierOrder}
									 required />
					</Input>
					<Button
						color="light"
						onclick={() => addCustomSeasonality()}
						size="sm"
						class="p-2 focus:ring-0">
						<PlusIcon class="w-4 h-4" />
					</Button>
				</div>
				{#if _formData.customSeasonalityList && _formData.customSeasonalityList.length}
					<Listgroup class="h-20 overflow-y-auto">
						{#each _formData.customSeasonalityList as customSeasonality, index}
							<ListgroupItem itemDefaultClass="flex w-full px-2 items-center justify-between h-9">
								<Badge color="blue">
									name: {customSeasonality.name}
								</Badge>
								<Badge color="blue">
									mode: {customSeasonality.mode}
								</Badge>
								<Badge color="blue">
									period: {customSeasonality.period}
								</Badge>
								<Badge color="blue">
									fourierOrder: {customSeasonality.fourierOrder}
								</Badge>
								<Button
									color="light"
									onclick={() => removeCustomSeasonality(index)}
									size="sm"
									class="p-2 focus:ring-0">
									<MinusIcon class="w-3 h-3" />
								</Button>
							</ListgroupItem>
						{/each}
					</Listgroup>
				{/if}
			</Label>

			<!-- Holidays Country-->
			<Label class="space-y-2">
				<span>Holidays Country</span>
				<ul class="items-center w-full rounded-lg border flex divide-x rtl:divide-x-reverse ">
					<li class="w-full">
						<Radio name="holiday-country"
									 class="p-3"
									 value={undefined}
									 bind:group={_formData.holidaysCountry}>
							None
						</Radio>
					</li>
					{#each Object.values(ProphetAnalyticsConfigEnum.holidaysCountry) as country}
						<li class="w-full">
							<Radio name="holiday-country"
										 class="p-3"
										 value={country}
										 bind:group={_formData.holidaysCountry}>
								{country}
							</Radio>
						</li>
					{/each}
				</ul>
			</Label>
			<!-- Holidays Date List -->
			<Label class="space-y-2">
				<span>Holidays Date List</span>
				<div class="flex flex-row w-full gap-2 mb-4 justify-between">
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Year
						</div>
						<Input
							type="number"
							name="holidays Year"
							min="1990"
							max={new Date().getFullYear()}
							step="1"
							{...props}
							bind:value={_formData.holidaysDate.year}
						/>
					</Input>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Month
						</div>
						<Input
							type="number"
							name="holidays Month"
							min="1"
							max="12"
							step="1"
							{...props}
							bind:value={_formData.holidaysDate.month}
						/>
					</Input>
					<Input let:props
								 class="pe-0 text-end"
								 classLeft="text-[11px]">
						<div slot="left">
							Day
						</div>
						<Input
							type="number"
							name="holidays Day"
							min="1"
							max="31"
							step="1"
							{...props}
							bind:value={_formData.holidaysDate.day}
						/>
					</Input>
					<Button
						color="light"
						id="holiday-add-button"
						onclick={() => addHolidaysDate()}
						size="sm"
						class="p-2 focus:ring-0">
						<PlusIcon class="w-4 h-4" />
					</Button>
				</div>
				{#if _formData.holidaysList && _formData.holidaysList.length}
					<Listgroup class="h-20 overflow-y-auto">
						{#each _formData?.holidaysList.sort((a, b) => b.localeCompare(a)) as holidays}
							<ListgroupItem itemDefaultClass="flex w-full px-4 items-center justify-between h-9">
								<Badge color="blue">
									{holidays}
								</Badge>
								<Button
									color="light"
									onclick={() => removeHolidaysList(holidays)}
									size="sm"
									class="p-2 focus:ring-0">
									<MinusIcon class="w-3 h-3" />
								</Button>
							</ListgroupItem>
						{/each}
					</Listgroup>
				{/if}
			</Label>
			<!-- Holidays Mode & Prior Scale -->
			{#if _formData.holidaysCountry || _formData.holidaysList?.length}
				<div class="grid grid-cols-10 gap-4 mb-4">
					<Label class="space-y-2 col-span-6">
						<span>Holidays Mode</span>
						<Select bind:value={_formData.holidaysMode}
										placeholder="">
							<option value="">
								None
							</option>
							{#each Object.values(ProphetAnalyticsConfigEnum.mode) as mode}
								<option value={mode}>
									{mode}
								</option>
							{/each}
						</Select>
					</Label>
					<Label class="space-y-2 col-span-4">
						<span>Holidays Prior Scale</span>
						<Input type="number"
									 name="Holidays Prior Scale"
									 min="0"
									 step="0.1"
									 bind:value={_formData.holidaysPriorScale}
									 required />
					</Label>
				</div>
			{/if}

			<Label class="space-y-2">
				<div>Regressor</div>
				<ul class="flex items-center w-full rtl:divide-x-reverse gap-1">
					<li class="w-full">
						<Toggle
							class="focus:ring-0"
							size="custom"
							customSize="mr-2 w-9 h-5 after:h-4 after:w-4 after:top-0.5 after:left-[2px]"
							checked={_formData.regressor.volume}>
							Volume
						</Toggle>
					</li>
					<li class="w-full">
						<Toggle
							class="focus:ring-0"
							size="custom"
							customSize="mr-2 w-9 h-5 after:h-4 after:w-4 after:top-0.5 after:left-[2px]"
							checked={_formData.regressor.atr}>
							ATR
						</Toggle>
					</li>
					<li class="w-full">
						<Toggle
							class="focus:ring-0"
							size="custom"
							customSize="mr-2 w-9 h-5 after:h-4 after:w-4 after:top-0.5 after:left-[2px]"
							checked={_formData.regressor.rsi}>
							RSI
						</Toggle>
					</li>
					<li class="w-full">
						<Toggle
							class="focus:ring-0"
							size="custom"
							customSize="mr-2 w-9 h-5 after:h-4 after:w-4 after:top-0.5 after:left-[2px]"
							checked={_formData.regressor.rsi}>
							MSCD
						</Toggle>
					</li>
					<li class="w-full">
						<Toggle
							class="focus:ring-0"
							size="custom"
							customSize="mr-2 w-9 h-5 after:h-4 after:w-4 after:top-0.5 after:left-[2px]"
							checked={_formData.regressor.bollingerBand}>
							Band
						</Toggle>
					</li>
				</ul>
			</Label>

			<!-- Default Config -->
			<Label class="space-y-2">
				<span>MCMC Samples</span>
				<Input type="number"
							 name="MCMC Samples"
							 min="0"
							 bind:value={_formData.mcmcSamples}
							 required />
			</Label>
			<Label class="space-y-2">
				<span>Interval Width</span>
				<Input type="number"
							 name="Interval Width"
							 min="0"
							 step="0.01"
							 bind:value={_formData.intervalWidth}
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
										 bind:group={_formData.scaling}>
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
							 bind:value={_formData.uncertaintySamples}
							 required />
			</Label>
			<Label class="space-y-2">
				<span>Stan Backend</span>
				<Input type="text"
							 name="Stan Backend"
							 bind:value={_formData.stanBackend}
							 placeholder="Input Stan Backend"
							 disabled />
			</Label>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<div class="flex w-full items-center justify-between">
			<Button type="button"
							color="none"
							class=""
							onclick={async () => setDefaultFormData()}>
				Reset Default
			</Button>
			{#if _requestConfigId}
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