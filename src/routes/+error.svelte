<script lang="ts">
	import { page } from '$app/state';
	import {
		Page404,
		Section
	} from 'flowbite-svelte-blocks';
	import { Button } from 'flowbite-svelte';
	import { AppRouteCode } from '$lib/common/enums/AppRouteCode';

	const status = page.status || '404',
		message = page.error?.message || 'Page not found';
</script>

<Section name="page404">
	<Page404>
		<svelte:fragment slot="h1">{status}</svelte:fragment>
		<svelte:fragment slot="paragraph">
			<p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
				{message}
			</p>
			<p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
				Sorry, we can't find that page. You'll find lots to explore on the home page.
			</p>
			<Button href={AppRouteCode.Home.href}
							size="lg"
							color="red">
				Back to Homepage
			</Button>
		</svelte:fragment>
	</Page404>
</Section>