<script lang="ts">
	import {
		Button,
		Input,
		Label,
		Modal
	} from 'flowbite-svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type { UserInfoData } from '$lib/common/models/UserInfoData';
	import { UserWebApi } from '$lib/web/request/UserWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { userStore } from '$lib/stores/UserStore';

	let { modalOpenYn = $bindable(), openSignUpModal } = $props();

	let _email = $state('');
	let _password = $state('');

	async function login() {
		if (!_email || !_password) {
			alert('Please enter your email or password.');
			return;
		}

		const responseObject: ResponseObject<UserInfoData | null> =
			await UserWebApi.login(_email, _password);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		const userInfoData = responseObject.data as UserInfoData;

		userStore.set(userInfoData);

		closeModal();
	}

	function closeModal() {
		modalOpenYn = false;
	}

	function clickSignUp() {
		closeModal();
		openSignUpModal();
	}
</script>


<Modal bind:open={modalOpenYn}
			 size="xs"
			 title="Sign in to your account"
			 autoclose={false}
			 class="w-full">
	<div class="flex flex-col space-y-6">
		<Label class="space-y-2">
			<span>Email</span>
			<Input type="email"
						 name="email"
						 bind:value={_email}
						 placeholder="example@gamil.com"
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Your password</span>
			<Input type="password"
						 name="password"
						 placeholder="•••••"
						 bind:value={_password}
						 required />
		</Label>
		<div class="flex items-start">
			<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
				Not registered?
				<a href=""
					 onclick={clickSignUp}
					 class="text-primary-700 hover:underline dark:text-primary-500">
					Create account
				</a>
			</div>
			<a href=""
				 onclick={closeModal}
				 class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500">
				Lost password?
			</a>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button type="button"
						class="w-full"
						onclick={async () => login()}>
			Login to your account
		</Button>
	</svelte:fragment>
</Modal>