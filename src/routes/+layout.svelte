<script lang="ts">
	import '../app.css';
	import {
		BottomNav,
		BottomNavItem,
		Footer,
		FooterCopyright,
		FooterLink,
		FooterLinkGroup,
		Tooltip
	} from 'flowbite-svelte';
	import AppHeaderComponent from '$lib/web/components/application/AppHeaderComponent.svelte';
	import {
		BitcoinIcon,
		ChartNetworkIcon,
		HomeIcon
	} from 'lucide-svelte';
	import { AppRouteCode } from '$lib/common/enums/AppRouteCode';
	import { currentMarketCodeStore } from '$lib/stores/MarketStore';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();

	async function onClickBottomNav(url: string) {
		if (page.url.pathname === url) {
			return;
		}

		const href = url + '?code=' + $currentMarketCodeStore;

		console.log('href', href);

		await goto(href);
	}
</script>


<div class="flex flex-col w-full h-full overflow-hidden">
	<AppHeaderComponent />

	<div class="relative flex flex-col w-full h-full overflow-hidden">
		{@render children()}
	</div>

	<Footer class="hidden md:flex relative w-full items-center justify-between border-t shadow"
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

	<Footer class="md:hidden relative w-full items-center justify-between border-t shadow p-0"
					footerType="sitemap">
		<BottomNav
			activeUrl=""
			position="relative"
			classInner="grid-cols-4">
			<BottomNavItem btnName="Home"
										 href={AppRouteCode.Home.href}>
				<HomeIcon class="w-6 h-6 mb-1" />
				<Tooltip arrow={false}>
					Home
				</Tooltip>
			</BottomNavItem>
			<BottomNavItem btnName="거래"
										 onclick={() => onClickBottomNav(AppRouteCode.Trade.href)}>
				<BitcoinIcon class="w-6 h-6 mb-1" />
			</BottomNavItem>
			<BottomNavItem btnName="Ai"
										 onclick={() => onClickBottomNav(AppRouteCode.AiAnalytics.href)}>
				<ChartNetworkIcon class="w-6 h-6 mb-1" />
			</BottomNavItem>
			<BottomNavItem btnName="Prophet"
										 onchange={() => onClickBottomNav(AppRouteCode.ProphetAnalytics.href)}
										 onclick={() => onClickBottomNav(AppRouteCode.ProphetAnalytics.href)}>
				<ChartNetworkIcon class="w-6 h-6 mb-1" />
			</BottomNavItem>
		</BottomNav>
	</Footer>
</div>