<script lang="ts">

	import {
		Button,
		Input,
		Label,
		Modal
	} from 'flowbite-svelte';
	import { userStore } from '$lib/stores/UserStore';

	let { modalOpenYn = $bindable() } = $props();

	let _email = $state($userStore.email),
		_name = $state($userStore.name),
		_mobileNo = $state($userStore.mobileNo),
		_imageUrl = $state($userStore.imageUrl),
		_password = $state(''),
		_confirmPassword = $state('');

	async function updateUser() {
		console.log(_email, _name, _mobileNo, _imageUrl, _password, _confirmPassword);
		modalOpenYn = false;
	}
</script>

<Modal bind:open={modalOpenYn}
			 size="xs"
			 autoclose={false}
			 class="w-full">
	<div class="flex flex-col space-y-6">
		<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">
			Update user information
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
		<Button type="button"
						class="w-full1"
						onclick={async () => updateUser()}>
			Sign up to your account
		</Button>
	</div>
</Modal>