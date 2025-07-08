<script lang="ts">
	import { Toast } from 'flowbite-svelte';
	import { CloseCircleSolid } from 'flowbite-svelte-icons';

	let { alertMessage = $bindable() }: {
		alertMessage: string
	} = $props();

	let _toastAlertStatus: boolean = $state(false);
	let _toastAlertMessageList: string[] = $state([]);

	$effect(() => {
		if (alertMessage) {
			const message = alertMessage;
			alertMessage = '';

			alertTrigger(message);
		}
	});

	function alertTrigger(alertMessage: string) {
		console.log('alertTrigger', alertMessage);
		_toastAlertMessageList.push(alertMessage);
		_toastAlertStatus = true;

		setTimeout(() => {
			_toastAlertStatus = false;
			_toastAlertMessageList = [];
		}, 1000 * 5);
	}
</script>

<Toast color="red"
			 align={false}
			 dismissable={false}
			 position="bottom-right"
			 class="absolute items-center"
			 bind:toastStatus={_toastAlertStatus}>
	<svelte:fragment slot="icon">
		<CloseCircleSolid class="w-5 h-5" />
		<span class="sr-only">Error icon</span>
	</svelte:fragment>
	<div class="ms-3">
		{#each _toastAlertMessageList as _toastAlertMessage}
			<div class="text-sm font-normal">
				{_toastAlertMessage}
			</div>
		{/each}
	</div>
</Toast>