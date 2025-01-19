<script lang="ts">
	import {
		Button,
		Input,
		Label,
		Modal
	} from 'flowbite-svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type { UserInfoData } from '$lib/common/models/UserInfoData';
	import { UserWebApi } from '$lib/web/api/UserWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import { userStore } from '$lib/stores/UserStore';

	let { modalOpenYn = $bindable(), openSignInModal } = $props();

	let _email = $state('');
	let _password = $state('');
	let _confirmPassword = $state('');
	let _name = $state('');
	let _mobileNo = $state('');

	function closeModal() {
		modalOpenYn = false;
	}

	function clickSignIn() {
		closeModal();
		openSignInModal();
	}

	async function registerUser() {
		if (!_email || !_password || !_confirmPassword || !_name || !_mobileNo) {
			alert('Please enter your email, password, confirm password, name, or mobile number.');
			return;
		}

		if (_password !== _confirmPassword) {
			alert('Password and confirm password do not match.');
			return;
		}

		const responseObject: ResponseObject<UserInfoData | null> =
			await UserWebApi.registerUser(_email, _password, _name, _mobileNo);

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		const userInfoData = responseObject.data as UserInfoData;

		userStore.set(userInfoData);

		closeModal();
	}

</script>


<Modal bind:open={modalOpenYn}
			 size="xs"
			 autoclose={false}
			 class="w-full">
	<form class="flex flex-col space-y-6"
				action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			Sign up
		</h3>
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
		<Label class="space-y-2">
			<span>Confirm password</span>
			<Input type="password"
						 name="password"
						 placeholder="•••••"
						 bind:value={_confirmPassword}
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Name</span>
			<Input type="text"
						 name="name"
						 bind:value={_name}
						 placeholder="Example"
						 required />
		</Label>
		<Label class="space-y-2">
			<span>Mobile No</span>
			<Input type="tel"
						 name="mobileNo"
						 bind:value={_mobileNo}
						 placeholder="010-xxxx-xxxx"
						 required />
		</Label>
		<div class="flex items-start">
			<a href="#;"
				 onclick={clickSignIn}
				 class="ms-auto text-sm text-primary-700 hover:underline dark:text-primary-500">
				Go Sign in
			</a>
		</div>
		<Button type="button"
						class="w-full1"
						onclick={async () => registerUser()}>
			Sign up to your account
		</Button>
	</form>
</Modal>