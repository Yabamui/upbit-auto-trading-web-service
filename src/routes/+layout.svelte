<script lang="ts">
	import '../app.css';
	import {
		Footer,
		FooterCopyright,
		FooterLink,
		FooterLinkGroup
	} from 'flowbite-svelte';
	import AppHeaderComponent from '$lib/web/components/application/AppHeaderComponent.svelte';

	let { children } = $props();

</script>


<div class="flex flex-col w-full h-full overflow-hidden">
	<AppHeaderComponent />

	<div class="flex flex-auto w-full h-full overflow-hidden">
		{@render children()}
	</div>

	<Footer class="w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-black dark:border-gray-600"
					footerType="logo">
		<FooterCopyright href="/"
										 by="Azi&Tari™"
										 year={2025} />
		<FooterLinkGroup ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
			<FooterLink href="/">About</FooterLink>
			<FooterLink href="/">Privacy Policy</FooterLink>
			<FooterLink href="/">Licensing</FooterLink>
			<FooterLink href="/">Contact</FooterLink>
		</FooterLinkGroup>
	</Footer>
</div>