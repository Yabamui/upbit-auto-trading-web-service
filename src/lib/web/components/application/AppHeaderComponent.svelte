<script lang="ts">

	import {
		Button,
		DarkMode,
		Dropdown,
		DropdownDivider,
		DropdownHeader,
		DropdownItem,
		Input,
		Navbar,
		NavBrand,
		NavHamburger,
		NavLi,
		NavUl
	} from 'flowbite-svelte';
	import {
		GithubSolid,
		SearchOutline
	} from 'flowbite-svelte-icons';
	import { userStore } from '$lib/stores/UserStore';
	import {
		type AppRouteCode,
		AppRouteCodeUtils
	} from '$lib/common/enums/AppRouteCode';
	import { page } from '$app/state';
	import { currentMarketCodeStore } from '$lib/stores/MarketStore';
	import { UserWebApi } from '$lib/web/api/UserWebApi';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import type { UserInfoData } from '$lib/common/models/UserInfoData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import UserUpdateModal from '$lib/web/components/modals/UserUpdateModalComponent.svelte';
	import SignInModalComponent from '$lib/web/components/modals/SignInModalComponent.svelte';
	import SignUpModalComponent from '$lib/web/components/modals/SignUpModalComponent.svelte';
	import { colorThemeStore } from '$lib/stores/ThemeStore';

	const activeClass = 'text-white bg-green-700 md:bg-transparent md:text-green-700 md:dark:text-white dark:bg-green-600 md:dark:bg-transparent';
	const nonActiveClass = 'text-gray-700 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-green-700 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent';

	let activeUrl = $derived(page.url.pathname + page.url.search);
	let appRouteCode: AppRouteCode[] = $state([]);
	let _userMenuDropdownOpenYn = $state(false);
	let _signInModalOpenYn = $state(false);
	let _signUpModalOpenYn = $state(false);
	let _userUpdateModalOpenYn = $state(false);

	$effect.pre(() => {
		appRouteCode = AppRouteCodeUtils.getNavList();
		const json = localStorage.getItem('user-info');

		if (json) {
			const userInfoData = JSON.parse(json) as UserInfoData;
			userStore.set(userInfoData);
		} else {
			userStore.reset();
		}
	});

	function openGithub() {
		window.open('https://github.com/Yabamui/upbit-auto-trading-web-service');
	}

	async function logout() {
		const responseObject: ResponseObject<null> = await UserWebApi.logout();

		if (ResponseCode.success.code !== responseObject.code) {
			alert(responseObject.message);
			return;
		}

		handleUserMenuDropdown();

		userStore.reset();
	}

	function openUserUpdateModal() {
		handleUserMenuDropdown();
		_userUpdateModalOpenYn = true;
	}

	function openSignInModal() {
		handleUserMenuDropdown();
		_signInModalOpenYn = true;
	}

	function openSignUpModal() {
		handleUserMenuDropdown();
		_signUpModalOpenYn = true;
	}

	function handleUserMenuDropdown() {
		_userMenuDropdownOpenYn = !_userMenuDropdownOpenYn;
	}
</script>


<header class="flex-none mx-auto w-full border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800">
	<Navbar class="bg-white dark:bg-black text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 divide-gray-200 dark:divide-gray-800 px-2 sm:px-4 w-full py-1.5">
		<NavHamburger />

		<NavBrand href="/">
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
				UP bit Auto Trading
			</span>
		</NavBrand>

		<div class="flex md:order-2 gap-2">
			<Button color="none"
							data-collapse-toggle="mobile-menu-3"
							aria-controls="mobile-menu-3"
							aria-expanded="false"
							class="md:hidden rounded-lg text-sm p-2.5 me-1
								text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
				<SearchOutline class="w-5 h-5" />
			</Button>
			<div class="hidden relative md:block">
				<div class="flex absolute inset-y-0 start-0 items-center ps-3 pointer-events-none">
					<SearchOutline class="w-4 h-4" />
				</div>
				<Input id="search-navbar"
							 class="ps-10"
							 placeholder="Search..." />
			</div>

			<Button color="none"
							data-collapse-toggle="mobile-menu-3"
							aria-controls="mobile-menu-3"
							aria-expanded="false"
							on:click={openGithub}
							class="rounded-lg text-sm p-2.5 me-1
								text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
				<GithubSolid class="w-5 h-5" />
			</Button>

			<DarkMode onclick={() => colorThemeStore.set()} />

			<button id="user-menu-dropdown"
							type="button"
							data-dropdown-toggle="dropdownAvatar"
							class="flex text-sm rounded-full md:me-0 p-2.5 items-center justify-center
								text-black dark:text-white bg-gray-100 dark:bg-gray-700">
				<span class="sr-only">Open user menu</span>
				{$userStore.name.charAt(0) + $userStore.name.charAt(1)}
			</button>
			<Dropdown placement="bottom"
								bind:open={_userMenuDropdownOpenYn}
								triggeredBy="#user-menu-dropdown">
				<DropdownHeader>
					<div class="block text-sm">
						{$userStore.name}
					</div>
					<div class="block truncate text-sm font-medium">
						{$userStore.email}
					</div>
				</DropdownHeader>
				{#if $userStore.role}
					<DropdownItem onclick={openUserUpdateModal}>
						Update Information
					</DropdownItem>
					<DropdownDivider />
					<DropdownItem onclick={logout}>
						Sign out
					</DropdownItem>
				{:else}
					<DropdownItem onclick={openSignInModal}>
						Sign in
					</DropdownItem>
					<DropdownItem onclick={openSignUpModal}>
						Sign up
					</DropdownItem>
				{/if}
			</Dropdown>
		</div>

		<NavUl activeUrl={activeUrl}
					 {activeClass}
					 {nonActiveClass}>
			{#each appRouteCode as routeCode}
				{@const href = routeCode.href + "?code=" + $currentMarketCodeStore}
				<NavLi href={href}>
					{routeCode.name}
				</NavLi>
			{/each}
		</NavUl>
	</Navbar>
</header>


{#if _signUpModalOpenYn}
	<SignUpModalComponent bind:modalOpenYn={_signUpModalOpenYn}
												{openSignInModal} />
{/if}
{#if _signInModalOpenYn}
	<SignInModalComponent bind:modalOpenYn={_signInModalOpenYn}
												{openSignUpModal} />
{/if}
{#if _userUpdateModalOpenYn}
	<UserUpdateModal bind:modalOpenYn={_userUpdateModalOpenYn} />
{/if}