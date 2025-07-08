<script lang="ts">
	import {
		Badge,
		TableBodyCell,
		TableBodyRow
	} from 'flowbite-svelte';
	import type { ProphetAnalyticsRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';

	let { prophetAnalyticsRequest }: {
		prophetAnalyticsRequest: ProphetAnalyticsRequestData
	} = $props();

	const ignoreKeys = [
		'id',
		'userId',
		'deletedAt'
	];
</script>

{#each Object.entries(prophetAnalyticsRequest) as [key, value]}
	{#if value && !ignoreKeys.includes(key)}
		{#if key === 'changepointList'}
			<TableBodyRow>
				<TableBodyCell colspan={3}
											 class="p-2 items-center text-start">
					{key}:
				</TableBodyCell>
				<TableBodyCell colspan={4}
											 class="p-2 items-center text-end">
					{#each value as changepoint}
						<Badge color="blue">
							{changepoint}<br />
						</Badge>
					{/each}
				</TableBodyCell>
			</TableBodyRow>
		{:else if key === 'holidaysList'}
			<TableBodyRow>
				<TableBodyCell colspan={3}
											 class="p-2 items-center text-start">
					{key}:
				</TableBodyCell>
				<TableBodyCell colspan={4}
											 class="p-2 items-center text-end">
					{#each value as holidays}
						<Badge color="blue">
							{holidays}
						</Badge>
						<br />
					{/each}
				</TableBodyCell>
			</TableBodyRow>
		{:else if key === 'customSeasonalityList'}
			<TableBodyRow>
				<TableBodyCell colspan={3}
											 class="p-2 items-center text-start">
					{key}:
				</TableBodyCell>
				<TableBodyCell colspan={4}
											 class="p-2 items-center text-end">
					{#each value as customSeasonality}
						<Badge color="blue">
							name: {customSeasonality['name']}<br />
							mode: {customSeasonality['mode']}<br />
							period: {customSeasonality['period']}<br />
							fourier: {customSeasonality['fourierOrder']}<br />
						</Badge>
						<br />
					{/each}
				</TableBodyCell>
			</TableBodyRow>
		{:else }
			<TableBodyRow>
				<TableBodyCell colspan={3}
											 class="p-2 items-center text-start">
					{key}:
				</TableBodyCell>
				<TableBodyCell colspan={4}
											 class="p-2 items-center text-end">
					<Badge color="blue">
						{value}
					</Badge>
				</TableBodyCell>
			</TableBodyRow>
		{/if}
	{/if}
{/each}