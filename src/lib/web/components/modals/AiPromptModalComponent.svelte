<script lang="ts">
	import {
		Button,
		Checkbox,
		Input,
		Label,
		Modal,
		Select,
		Spinner,
		Textarea
	} from 'flowbite-svelte';
	import { AiAnalyticsWebApi } from '$lib/web/request/AiAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import {
		type AiPromptsCreateRequestData,
		type AiPromptsData,
		AiPromptsDataUtils,
		type AiPromptsUpdateRequestData
	} from '$lib/common/models/AiPromptsData';
	import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';
	import { onDestroy } from 'svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type { AiModelData } from '$lib/common/models/AiModelData';
	import { AIModelCode } from '$lib/common/enums/AIModelCode';
	import { CurrentThreadUtils } from '$lib/common/utils/CurrentThreadUtils';

	interface AiPromptsConfigFormData {
		ai: string;
		aiModelId: string;
		aiPromptsId: string;
		title: string;
		systemPromptsText: string;
		userPromptsText: string;
		defaultYn: boolean;
		aiResponseModelsId: string;
	}

	let {
		openModalYn = $bindable(),
		aiModelList,
		aiPromptsList = $bindable(),
		aiPromptsConfigModalCallback
	}: {
		openModalYn: boolean;
		aiModelList: AiModelData[];
		aiPromptsList: AiPromptsData[];
		aiPromptsConfigModalCallback: () => void;
	} = $props();

	let _processMessage: {
		message: string;
		color: string
	} | undefined = $state(undefined);
	let _formData: AiPromptsConfigFormData | undefined = $state(undefined);
	let _createPromptsLoadingYn: boolean = $state(false);
	let _updatePromptsLoadingYn: boolean = $state(false);
	let _deletePromptsLoadingYn: boolean = $state(false);
	let _idAndAiResponseModelsRecord: Record<string, AiResponseModelsData> = $state.raw({});

	onDestroy(() => {
		_formData = undefined;
		_idAndAiResponseModelsRecord = {};
	});

	$effect(() => {
		if (openModalYn) {
			setDefaultFormData();
		}
	});

	function closeModal() {
		openModalYn = false;
	}

	async function setDefaultFormData() {
		_formData = {
			ai: AIModelCode.GEMINI.code,
			aiModelId: '',
			aiPromptsId: '',
			title: '',
			systemPromptsText: '',
			userPromptsText: '',
			defaultYn: false,
			aiResponseModelsId: ''
		};
	}

	async function getAiResponseModelsList(aiModelId: number) {
		const responseObject = await AiAnalyticsWebApi.getAiResponseModelsList(aiModelId);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		const aiResponseModelsList = responseObject.data as AiResponseModelsData[];

		_idAndAiResponseModelsRecord = aiResponseModelsList.reduce((acc, item) => {
			if (!acc[item.id]) {
				acc[item.id] = item;
			}

			return acc;
		}, {} as Record<number, AiResponseModelsData>);
	}

	async function createPrompts() {

		if (!_formData) {
			_processMessage = {
				message: 'No Request Config',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		_processMessage = {
			message: 'Prompts Creating...',
			color: 'text-blue-500'
		};
		_createPromptsLoadingYn = true;

		const createData: AiPromptsCreateRequestData = {
			aiModelId: Number(_formData.aiModelId),
			title: _formData.title,
			systemPromptsList: _formData.systemPromptsText.split('\n'),
			userPromptsList: _formData.userPromptsText.split('\n'),
			defaultYn: _formData.defaultYn,
			aiResponseModelsId: parseInt(_formData.aiResponseModelsId)
		} as AiPromptsCreateRequestData;

		const validResult = AiPromptsDataUtils.validCreateData(createData);

		if (!validResult.valid) {
			_processMessage = {
				message: validResult.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			_createPromptsLoadingYn = false;
			return;
		}

		const responseObject: ResponseObject<number | null> =
			await AiAnalyticsWebApi.createAiPrompts(createData);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			_processMessage = {
				message: responseObject.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			_createPromptsLoadingYn = false;
			return;
		}

		if (!responseObject.data) {
			_processMessage = {
				message: 'Failed to create the prompt',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			_createPromptsLoadingYn = false;
			return;
		}

		_processMessage = {
			message: 'Prompts Create Success',
			color: 'text-green-500'
		};

		const id = responseObject.data as number;

		await CurrentThreadUtils.sleep(1000);

		_processMessage = {
			message: 'Prompts Data Refreshing...',
			color: 'text-green-500'
		};

		await updateAiPromptsList();

		_formData.aiPromptsId = id.toString();
		_processMessage = undefined;
		_createPromptsLoadingYn = false;

		aiPromptsConfigModalCallback();
	}

	async function updatePrompts() {

		if (!_formData) {
			_processMessage = {
				message: 'No Request Config',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		_processMessage = {
			message: 'Prompts Updating...',
			color: 'text-blue-500'
		};

		_updatePromptsLoadingYn = true;

		const updateRequestData: AiPromptsUpdateRequestData = {
			id: Number(_formData.aiPromptsId),
			aiModelId: Number(_formData.aiModelId),
			title: _formData.title,
			systemPromptsList: _formData.systemPromptsText.split('\n'),
			userPromptsList: _formData.userPromptsText.split('\n'),
			defaultYn: _formData.defaultYn,
			aiResponseModelsId: parseInt(_formData.aiResponseModelsId)
		};

		const validResult = AiPromptsDataUtils.validUpdateData(updateRequestData);

		if (!validResult.valid) {
			_processMessage = {
				message: validResult.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		const responseObject: ResponseObject<number | null> = await AiAnalyticsWebApi.updateAiPrompts(updateRequestData);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			_processMessage = {
				message: responseObject.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		if (!responseObject.data) {
			_processMessage = {
				message: 'Failed to update the prompt',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		const id = responseObject.data as number;

		_processMessage = {
			message: 'Prompts Update Success',
			color: 'text-green-500'
		};

		await CurrentThreadUtils.sleep(1000);

		_processMessage = {
			message: 'Prompts Data Refreshing...',
			color: 'text-green-500'
		};

		await updateAiPromptsList();

		_formData.aiPromptsId = id.toString();
		_processMessage = undefined;
		_updatePromptsLoadingYn = false;

		aiPromptsConfigModalCallback();
	}

	async function deletePrompts() {
		if (!_formData || !_formData.aiPromptsId) {
			_processMessage = {
				message: 'No Request Config',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		_processMessage = {
			message: 'Prompts Deleting...',
			color: 'text-blue-500'
		};

		_deletePromptsLoadingYn = true;

		const responseObject: ResponseObject<unknown> =
			await AiAnalyticsWebApi.deleteAiPrompts(Number(_formData.aiPromptsId));

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = {
				message: responseObject.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			_deletePromptsLoadingYn = false;
			return;
		}

		if (!responseObject.data) {
			_processMessage = {
				message: 'Failed to delete the prompt',
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			_deletePromptsLoadingYn = false;
			return;
		}

		_processMessage = {
			message: 'Prompts Delete Success',
			color: 'text-green-500'
		};

		await CurrentThreadUtils.sleep(1000);

		_processMessage = {
			message: 'Prompts Data Refreshing...',
			color: 'text-green-500'
		};

		await updateAiPromptsList();

		_formData.aiPromptsId = '';

		await onchangeAiPromptsId();

		_processMessage = undefined;
		_deletePromptsLoadingYn = false;

		aiPromptsConfigModalCallback();
	}

	async function updateAiPromptsList() {
		const responseObject = await AiAnalyticsWebApi.getAiPromptsList(0);

		if (ResponseCode.success.code !== responseObject.code) {
			_processMessage = {
				message: responseObject.message,
				color: 'text-red-500'
			};

			await CurrentThreadUtils.sleep(3000);

			_processMessage = undefined;
			return;
		}

		aiPromptsList = responseObject.data as AiPromptsData[];
	}

	function onChangeAi() {
		if (!_formData) {
			return;
		}

		_formData.aiModelId = '';
	}

	async function onchangeAiPromptsId() {
		if (!_formData) {
			return;
		}

		const aiPromptsId = _formData.aiPromptsId;

		await setDefaultFormData();

		if (!aiPromptsId) {
			return;
		}

		const aiPromptsData = aiPromptsList.find((item) => item.id.toString() === aiPromptsId);

		if (!aiPromptsData) {
			return;
		}

		const aiModelData = aiModelList.find((item) => item.id === aiPromptsData.aiModelId);

		if (!aiModelData) {
			return;
		}

		await getAiResponseModelsList(aiModelData.id);

		_formData = {
			ai: aiModelData.aiCode,
			aiModelId: aiModelData.id.toString(),
			aiPromptsId: aiPromptsData.id.toString(),
			title: aiPromptsData.title,
			systemPromptsText: aiPromptsData.systemPromptsList.join('\n'),
			userPromptsText: aiPromptsData.userPromptsList.join('\n'),
			defaultYn: aiPromptsData.defaultYn,
			aiResponseModelsId: aiPromptsData.aiResponseModelsId?.toString() || ''
		};
	}

	function onchangeAiModelId() {
		if (!_formData) {
			return;
		}

		_formData.aiResponseModelsId = '';
		getAiResponseModelsList(Number(_formData.aiModelId));
	}
</script>


<Modal bind:open={openModalYn}
			 id="ai-prompt-modal"
			 placement="top-center"
			 size="md"
			 autoclose={false}
			 class="w-full"
			 title="Ai Prompts Configuration"
			 classFooter="items-center justify-end">
	{#if _formData}
		<div class="flex flex-col space-y-6">
			<Label class="space-y-2">
				<Select bind:value={_formData.aiPromptsId}
								placeholder=""
								onchange={() => onchangeAiPromptsId()}>
					<option value="">Create Mode</option>
					{#each aiPromptsList.sort((a, b) => a.aiModelId - b.aiModelId) as aiPrompts}
						{@const aiModel = aiModelList.find((item) => item.id === aiPrompts.aiModelId)}
						<option value={aiPrompts.id.toString()}>
							{aiModel?.modelName} : {aiPrompts.title}
						</option>
					{/each}
				</Select>
			</Label>

			<div class="grid grid-cols-2 gap-2">
				<Label class="space-y-2">
					<div class="text-sm">AI</div>
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
					<span>AI Model</span>
					<Select bind:value={_formData.aiModelId}
									placeholder=""
									onchange={onchangeAiModelId}>
						<option value="">Choose AI Model...</option>
						{#each aiModelList as aiModel}
							<option value={aiModel.id.toString()}>{aiModel.modelName}</option>
						{/each}
					</Select>
				</Label>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<Label class="space-y-2">
					<span>Title</span>
					<Input type="text"
								 bind:value={_formData.title}
								 placeholder="Please enter your title..."
								 required />
				</Label>
				<Label class="space-y-2">
					<span>Response Model</span>
					<Select bind:value={_formData.aiResponseModelsId}
									placeholder="">
						<option value="">Choose Response Model...</option>
						{#each Object.entries(_idAndAiResponseModelsRecord) as [id, aiResponseModels]}
							<option value={id}>{aiResponseModels.title}</option>
						{/each}
					</Select>
				</Label>
			</div>

			<Label class="space-y-2">
				<span>System Prompts Text</span>
				<Textarea
					rows={10}

					bind:value={_formData.systemPromptsText}
					placeholder="Please Set system Role prompt..."
					required />
			</Label>
			<Label class="space-y-2">
				<span>Question Prompts Text</span>
				<Textarea
					rows={5}

					bind:value={_formData.userPromptsText}
					placeholder="Please enter your question Prompts..."
					required />
			</Label>
			<Label class="space-y-2">
				<Checkbox checked={_formData.defaultYn}>
					Default Prompt
				</Checkbox>
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
			<Button type="button"
							color="alternative"
							onclick={closeModal}>
				Close
			</Button>
			{#if _formData?.aiPromptsId}
				<div class="">
					<Button
						type="button"
						color="red"
						onclick={async () => deletePrompts()}>
						Delete
						{#if _deletePromptsLoadingYn}
							<Spinner class="w-4 h-4 ml-2" />
						{/if}
					</Button>
					<Button type="button"
									disabled={!_formData.aiPromptsId}
									onclick={async () => updatePrompts()}>
						Update Your Prompt
						{#if _updatePromptsLoadingYn}
							<Spinner class="w-4 h-4 ml-2" />
						{/if}
					</Button>
				</div>
			{:else }
				<Button type="button"
								class="w-full1"
								color="green"
								onclick={async () => createPrompts()}>
					Create Your Prompt
					{#if _createPromptsLoadingYn}
						<Spinner class="w-4 h-4 ml-2" />
					{/if}
				</Button>
			{/if}
		</div>
	</svelte:fragment>
</Modal>