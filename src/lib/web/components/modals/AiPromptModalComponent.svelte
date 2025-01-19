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
	import { AiAnalyticsWebApi } from '$lib/web/api/AiAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type {
		AiPromptsCreateRequestData,
		AiPromptsData,
		AiPromptsUpdateRequestData
	} from '$lib/common/models/AiPromptsData';
	import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';
	import { onDestroy } from 'svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';

	let { modalOpenYn = $bindable(), aiPromptsId = $bindable(), aiModelId = $bindable() } = $props();

	let _title: string = $state('');
	let _systemPromptsText: string = $state('');
	let _userPromptsText: string = $state('');
	let _updatePromptsLoadingYn: boolean = $state(false);
	let _idAndAiPromptsRecord: Record<number, AiPromptsData> = $state.raw({});
	let _currentAiPromptsId: string = $state('');
	let _defaultYn: boolean = $state(false);
	let _idAndAiResponseModelsRecord: Record<number, AiResponseModelsData> = $state.raw({});
	let _aiResponseModelsId: string = $state('');

	$effect(() => {
		if (modalOpenYn) {
			getData(aiModelId);
		}
	});

	onDestroy(() => {
		_title = '';
		_systemPromptsText = '';
		_userPromptsText = '';
		_idAndAiPromptsRecord = {};
		_currentAiPromptsId = '';
		_defaultYn = false;
		_idAndAiResponseModelsRecord = {};
		_aiResponseModelsId = '';
	});

	async function clearFormData() {
		_title = '';
		_systemPromptsText = '';
		_userPromptsText = '';
		_currentAiPromptsId = '';
		aiPromptsId = 0;
		_defaultYn = false;
		_aiResponseModelsId = '';
	}

	async function getData(aiModelId: number) {
		console.log(aiModelId);
		await getAiPromptsList(aiModelId);
		await getAiResponseModelsList(aiModelId);

		if (aiPromptsId) {
			await changePrompts(aiPromptsId);
		}
	}

	async function getAiPromptsList(aiModelId: number) {

		const responseObject = await AiAnalyticsWebApi.getAiPromptsList(aiModelId);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		const aiPromptsList = responseObject.data as AiPromptsData[];

		_idAndAiPromptsRecord = aiPromptsList.reduce((acc, item) => {
			if (!acc[item.id]) {
				acc[item.id] = item;
			}

			return acc;
		}, {} as Record<number, AiPromptsData>);
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

	async function changePrompts(aiPromptsId: number) {
		if (!aiPromptsId) {
			await clearFormData();
			return;
		}

		const aiPromptsData = _idAndAiPromptsRecord[aiPromptsId];
		_systemPromptsText = aiPromptsData.systemPromptsList.join('\n');
		_userPromptsText = aiPromptsData.userPromptsList.join('\n');
		_defaultYn = aiPromptsData.defaultYn;
		_aiResponseModelsId = aiPromptsData.aiResponseModelsId?.toString() || '0';
	}

	async function createPrompts() {

		if (!aiModelId) {
			alert('Please select the AI Model.');
			return;
		}

		if (!_title) {
			alert('Please enter the title.');
			return;
		}

		if (!_userPromptsText) {
			alert('Please enter the prompt text.');
			return;
		}

		if (!_aiResponseModelsId) {
			alert('Please select the response model.');
			return;
		}

		_updatePromptsLoadingYn = true;

		const aiPromptsCreateRequestData: AiPromptsCreateRequestData = {
			aiModelId: aiModelId,
			title: _title,
			systemPromptsList: _systemPromptsText.split('\n'),
			userPromptsList: _userPromptsText.split('\n'),
			defaultYn: _defaultYn,
			aiResponseModelsId: parseInt(_aiResponseModelsId)
		};

		_updatePromptsLoadingYn = false;

		const responseObject: ResponseObject<number | null> =
			await AiAnalyticsWebApi.createAiPrompts(aiPromptsCreateRequestData);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			alert(`Failed to create the prompt. ${ responseObject.message }`);
			_updatePromptsLoadingYn = false;
			return;
		}

		const id = responseObject.data as number;

		await getData(aiModelId);

		setTimeout(() => {
			_updatePromptsLoadingYn = false;
			_currentAiPromptsId = id.toString();
			changePrompts(id);
		}, 1000);
	}

	async function updatePrompts() {

		if (!_currentAiPromptsId) {
			alert('Please select the Prompts Title.');
			return;
		}

		const aiPromptsData = _idAndAiPromptsRecord[parseInt(_currentAiPromptsId)];

		if (!aiPromptsData) {
			alert('Please select the Prompts Title.');
			return;
		}

		_updatePromptsLoadingYn = true;

		const updateRequestData: AiPromptsUpdateRequestData = {
			id: aiPromptsData.id,
			userId: aiPromptsData.userId,
			aiModelId: aiPromptsData.aiModelId,
			title: aiPromptsData.title,
			systemPromptsList: _systemPromptsText.split('\n'),
			userPromptsList: _userPromptsText.split('\n'),
			defaultYn: _defaultYn,
			aiResponseModelsId: parseInt(_aiResponseModelsId)
		};

		const responseObject: ResponseObject<number | null> = await AiAnalyticsWebApi.updateAiPrompts(updateRequestData);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			alert(`Failed to update the prompt. ${ responseObject.message }`);
			return;
		}

		const id = responseObject.data as number;

		await getData(aiModelId);

		setTimeout(() => {
			_updatePromptsLoadingYn = false;
			_currentAiPromptsId = id.toString();
			changePrompts(id);
		}, 1000);
	}

	function acceptPrompt() {
		aiPromptsId = _currentAiPromptsId;
		closeModal();
	}

	async function cancelPrompt() {
		await clearFormData();
		closeModal();
	}

	function closeModal() {
		modalOpenYn = false;
	}
</script>


<Modal bind:open={modalOpenYn}
			 id="ai-prompt-modal"
			 placement="top-center"
			 size="lg"
			 autoclose={false}
			 class="w-full"
			 classFooter="items-center justify-end">
	<div class="flex flex-col space-y-6">
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			Request Prompt
		</h3>
		<Label class="space-y-2">
			<span>Select</span>
			<Select bind:value={_currentAiPromptsId}
							placeholder=""
							onchange={() => changePrompts(parseInt(_currentAiPromptsId))}>
				<option value="">Choose Title...</option>
				{#each Object.entries(_idAndAiPromptsRecord) as [id, aiPromptsData]}
					<option value={id.toString()}>{aiPromptsData.title}</option>
				{/each}
			</Select>
		</Label>
		{#if !_currentAiPromptsId}
			<Label class="space-y-2">
				<span>Title</span>
				<Input type="text"
							 bind:value={_title}
							 placeholder="Please enter your title..."
							 required />
			</Label>
		{/if}
		<Label class="space-y-2">
			<span>System Prompts Text</span>
			<Textarea
				rows={10}
				cols={30}
				bind:value={_systemPromptsText}
				placeholder="Please Set system Role prompt..."
				required />
		</Label>
		<Label class="space-y-2">
			<span>Question Prompts Text</span>
			<Textarea
				rows={5}
				cols={10}
				bind:value={_userPromptsText}
				placeholder="Please enter your question Prompts..."
				required />
		</Label>
		<Label class="space-y-2">
			<Checkbox checked={_defaultYn}
								onchange={() => _defaultYn = !_defaultYn}>
				Default Prompt
			</Checkbox>
		</Label>
		<Label class="space-y-2">
			<span>Response Model</span>
			<Select bind:value={_aiResponseModelsId}
							placeholder="">
				<option value="">Choose Response Model...</option>
				{#each Object.entries(_idAndAiResponseModelsRecord) as [id, aiResponseModels]}
					<option value={id}>{aiResponseModels.title}</option>
				{/each}
			</Select>
		</Label>
	</div>
	<svelte:fragment slot="footer">
		<div class="flex w-full items-center justify-between">
			{#if _currentAiPromptsId}
				<Button type="button"
								class="w-full1"
								disabled={_currentAiPromptsId === ''}
								onclick={async () => updatePrompts()}>
					Update Your Prompt
					{#if _updatePromptsLoadingYn}
						<Spinner class="w-5 h-5 ml-2" />
					{/if}
				</Button>
			{:else }
				<Button type="button"
								class="w-full1"
								color="green"
								onclick={async () => createPrompts()}>
					Create Your Prompt
					{#if _updatePromptsLoadingYn}
						<Spinner class="w-5 h-5 ml-2" />
					{/if}
				</Button>
			{/if}
			<div class="">
				<Button type="button"
								class="w-full1"
								onclick={acceptPrompt}>
					Accept
				</Button>
				<Button type="button"
								class="w-full1"
								color="alternative"
								onclick={cancelPrompt}>
					UnSet
				</Button>
			</div>
		</div>
	</svelte:fragment>
</Modal>