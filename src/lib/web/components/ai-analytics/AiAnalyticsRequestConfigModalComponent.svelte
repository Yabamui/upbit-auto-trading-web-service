<script lang="ts">

	import {
		Button,
		Input,
		Label,
		Modal,
		Select,
		Textarea
	} from 'flowbite-svelte';
	import { AIModelCode } from '$lib/common/enums/AIModelCode';
	import {
		UPBitCandleTimeZones,
		UPBitCandleUnitEnum
	} from '$lib/common/enums/UPBitCandleEnum';
	import type { AiModelData } from '$lib/common/models/AiModelData';
	import { onDestroy } from 'svelte';
	import { CurrentThreadUtils } from '$lib/common/utils/CurrentThreadUtils';
	import type { AiPromptsData } from '$lib/common/models/AiPromptsData';
	import type { AiAnalyticsRequestFormData } from '$lib/common/models/AiAnalyticsRequestData';

	let {
		openModalYn = $bindable(),
		initFormData = $bindable(),
		aiModelList,
		aiPromptsList
	}: {
		openModalYn: boolean;
		initFormData: AiAnalyticsRequestFormData | undefined;
		aiModelList: AiModelData[];
		aiPromptsList: AiPromptsData[];
	} = $props();

	let _formData: AiAnalyticsRequestFormData | undefined = $state(undefined);

	let _processMessage: {
		message: string;
		color: string;
	} | undefined = $state(undefined);
	let _aiModelRecordByAiCode: Record<string, AiModelData[]> = $state({});
	let _aiPromptsListRecordByAiModelId: Record<string, AiPromptsData[]> = $state({});
	let _selectedAiPrompts: AiPromptsData | undefined = $state(undefined);

	onDestroy(async () => {
		await clearData();
	});

	$effect(() => {
		if (openModalYn) {
			initModal(initFormData);
		}
	});

	function closeModal() {
		openModalYn = false;
	}

	function acceptRequestConfig() {
		if (!_formData) {
			_processMessage = {
				message: 'Invalid data',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.ai) {
			_processMessage = {
				message: 'AI is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.aiModelId) {
			_processMessage = {
				message: 'AI Model is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.aiPromptsId) {
			_processMessage = {
				message: 'AI Prompts is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.candleUnit) {
			_processMessage = {
				message: 'Candle Unit is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.candleCount) {
			_processMessage = {
				message: 'Candle Count is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		if (!_formData.candleTimeZone) {
			_processMessage = {
				message: 'Candle Time Zone is required',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		const aiModel = _aiModelRecordByAiCode[_formData.ai]
			.find(item => {
				return item.id.toString() === _formData?.aiModelId;
			});

		if (!aiModel) {
			_processMessage = {
				message: 'Invalid AI Model',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		const aiPrompts = _aiPromptsListRecordByAiModelId[_formData.aiModelId]
			.find(item => {
				return item.id.toString() === _formData?.aiPromptsId;
			});

		if (!aiPrompts) {
			_processMessage = {
				message: 'Invalid AI Prompts',
				color: 'text-red-500'
			};

			CurrentThreadUtils.sleep(3000)
				.then(() => {
					_processMessage = undefined;
				});

			return;
		}

		initFormData = {
			ai: _formData.ai,
			aiModelId: _formData.aiModelId,
			aiModelName: aiModel.modelName,
			aiPromptsId: _formData.aiPromptsId,
			aiPromptsTitle: aiPrompts.title,
			candleUnit: _formData.candleUnit,
			candleCount: _formData.candleCount,
			candleTimeZone: _formData.candleTimeZone
		};

		openModalYn = false;
	}

	async function initModal(initFormData: AiAnalyticsRequestFormData | undefined) {
		await setFormData(initFormData);

		await getAiModelList();
		await getAiPromptsList();
	}

	async function setFormData(initFormData: AiAnalyticsRequestFormData | undefined) {

		if (!initFormData) {
			_formData = {
				ai: AIModelCode.GEMINI.code,
				aiModelId: '',
				aiModelName: '',
				aiPromptsId: '',
				aiPromptsTitle: '',
				candleUnit: UPBitCandleUnitEnum.days.key,
				candleCount: 200,
				candleTimeZone: UPBitCandleTimeZones.utc
			};
			_selectedAiPrompts = undefined;
		} else {
			_formData = initFormData;
		}
	}

	async function clearData() {
		_formData = undefined;
		_processMessage = undefined;
		_aiModelRecordByAiCode = {};
		_aiPromptsListRecordByAiModelId = {};
		_selectedAiPrompts = undefined;
	}

	async function getAiModelList() {
		_aiModelRecordByAiCode = aiModelList.reduce((acc, item) => {
			if (!acc[item.aiCode]) {
				acc[item.aiCode] = [];
			}

			acc[item.aiCode].push(item);
			return acc;
		}, {} as Record<string, AiModelData[]>);
	}

	async function getAiPromptsList() {
		_aiPromptsListRecordByAiModelId = aiPromptsList.reduce((acc, item) => {
			if (!acc[item.aiModelId]) {
				acc[item.aiModelId] = [];
			}

			acc[item.aiModelId].push(item);
			return acc;
		}, {} as Record<string, AiPromptsData[]>);
	}

	function onChangeAi() {
		if (!_formData) {
			return;
		}

		_formData.aiModelId = '';
		_formData.aiModelName = '';
		_formData.aiPromptsId = '';
		_formData.aiPromptsTitle = '';
		_selectedAiPrompts = undefined;
	}

	function onchangeAiModel() {
		_selectedAiPrompts = undefined;

		if (!_formData) {
			return;
		}

		if (!_formData.aiModelId) {
			_formData.aiModelName = '';
		}

		_formData.aiPromptsId = '';
		_formData.aiPromptsTitle = '';
	}

	function onChangeAiPrompts() {
		_selectedAiPrompts = undefined;

		if (!_formData) {
			return;
		}

		_formData.aiPromptsTitle = '';

		if (!_formData.aiModelId || !_formData.aiPromptsId) {
			return;
		}

		_selectedAiPrompts = _aiPromptsListRecordByAiModelId[_formData.aiModelId]
			.find(item => {
				return item.id.toString() === _formData?.aiPromptsId;
			});
	}
</script>


<Modal
	bind:open={openModalYn}
	size="sm"
	title="AI Analytics Request Configuration"
	autoclose={false}
	class="w-full">
	{#if _formData}
		<div class="flex flex-col space-y-2">

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

			<div class="grid grid-cols-2 gap-2">
				<Label class="space-y-2">
					<span class="text-sm">AI</span>
					<Select
						bind:value={_formData.ai}
						placeholder=""
						onchange={onChangeAi}
						class="w-full">
						{#each Object.values(AIModelCode) as ai}
							<option value={ai.code}>{ai.name}</option>
						{/each}
					</Select>
				</Label>

				<Label class="space-y-2">
					<span class="text-sm">AI Model</span>
					<Select
						bind:value={_formData.aiModelId}
						placeholder=""
						onchange={onchangeAiModel}
						class="w-full">
						<option value="">Select AI Model</option>
						{#if _aiModelRecordByAiCode[_formData.ai]}
							{#each _aiModelRecordByAiCode[_formData.ai] as aiModel}
								<option value={aiModel.id.toString()}>{aiModel.modelName}</option>
							{/each}
						{/if}
					</Select>
				</Label>
			</div>

			<Label class="space-y-2">
				<span class="text-sm">AI Prompts</span>
				<Select
					bind:value={_formData.aiPromptsId}
					placeholder=""
					onchange={onChangeAiPrompts}
					class="w-full">
					<option value="">Select AI Prompts</option>
					{#if _aiPromptsListRecordByAiModelId[_formData.aiModelId]}
						{#each _aiPromptsListRecordByAiModelId[_formData.aiModelId] as aiPrompts}
							<option value={aiPrompts.id.toString()}>{aiPrompts.title}</option>
						{/each}
					{/if}
				</Select>
				{#if _selectedAiPrompts}
					{@const systemText = _selectedAiPrompts.systemPromptsList.join('\n')}
					{@const userText = _selectedAiPrompts.userPromptsList.join('\n')}
					<Label class="space-y-2">
						<span>System Prompts Text</span>
						<Textarea
							readonly={true}
							rows={10}
							cols={30}
							placeholder={systemText} />
					</Label>
					<Label class="space-y-2">
						<span>Question Prompts Text</span>
						<Textarea
							readonly={true}
							rows={5}
							cols={10}
							placeholder={userText}
							required />
					</Label>
				{/if}
			</Label>
			{#if _processMessage}
				<div class="h-5">
				</div>
				<div class="text-end items-end absolute right-4 bottom-24 {_processMessage.color}">
					{_processMessage.message}
				</div>
			{/if}
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<div class="flex w-full items-center justify-between">
			<Button
				type="button"
				color="light"
				onclick={closeModal}>
				Close
			</Button>
			<Button
				type="button"
				color="primary"
				onclick={acceptRequestConfig}>
				Accept
			</Button>
		</div>
	</svelte:fragment>
</Modal>