<script lang="ts">

	import {
		Button,
		Modal
	} from 'flowbite-svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
	import { AiAnalyticsWebApi } from '$lib/web/api/AiAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';

	let { modalOpenYn = $bindable(), id = $bindable(), deleteAiResponsesCallback } = $props();

	async function deleteAiResponses() {

		const responseObject = await AiAnalyticsWebApi.deleteAiResponses(id);

		closeModal();

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			alert(responseObject.message);
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));

		await deleteAiResponsesCallback();
	}

	function closeModal() {
		id = 0;
		modalOpenYn = false;
	}
</script>


<Modal bind:open={modalOpenYn}
			 size="xs"
			 autoclose={false}
			 id="ai-responses-delete-modal"
			 class="w-full">
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure delete this Responses Data?</h3>
		<Button color="red"
						class="me-2"
						onclick={() => deleteAiResponses()}>
			Yes, I'm sure
		</Button>
		<Button color="alternative"
						onclick={closeModal}>
			No, cancel
		</Button>
	</div>
</Modal>