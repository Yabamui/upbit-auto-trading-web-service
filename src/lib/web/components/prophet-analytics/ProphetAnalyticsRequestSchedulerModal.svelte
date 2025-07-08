<script lang="ts">

	import {
		Label,
		Modal
	} from 'flowbite-svelte';
	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { MarketInfoWebApi } from '$lib/web/request/MarketInfoWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';

	let { openModalYn = $bindable() }: {
		openModalYn: boolean
	} = $props();
	let _marketInfoList: MarketInfoData[] = $state([]);

	function closeModal() {
		openModalYn = false;
	}

	async function initData() {
		_marketInfoList = await getMarketInfoList();


	}

	async function getMarketInfoList(): Promise<MarketInfoData[]> {
		const responseObject: ResponseObject<MarketInfoData[]> = await MarketInfoWebApi.getAllMarketInfoList();

		if (ResponseCode.success.code !== responseObject.code) {
			return [];
		}

		return responseObject.data as MarketInfoData[];
	}

</script>

<Modal
	bind:open={openModalYn}
	size="sm"
	title="Prophet Analytics Request Schedule"
	autoclose={false}
	class="w-full">

	<Label class="space-y-2">
		<span>

		</span>
	</Label>
</Modal>