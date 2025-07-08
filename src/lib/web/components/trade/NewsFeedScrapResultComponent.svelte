<script lang="ts">

	import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
	import {
		onDestroy,
		onMount
	} from 'svelte';
	import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
	import { NewsFeedScrapResultApi } from '$lib/web/request/NewsFeedScrapResultApi';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { NewsFeedScrapResultWithAiSummaryData } from '$lib/common/models/NewsFeedScrapResultData';
	import {
		Button,
		Card
	} from 'flowbite-svelte';
	import {
		RotateCcwIcon,
		SquareChevronDownIcon,
		SquareChevronRightIcon
	} from 'lucide-svelte';

	let {
		marketInfo
	}: {
		marketInfo: MarketInfoData
	} = $props();

	let _initYn: boolean = $state(false);
	let _marketInfo: MarketInfoData | undefined = $state(undefined);
	let _publishedAt: string = $state(CurrentDateUtils.getNowDateTimeString());
	let _resultWithAiSummaryList: NewsFeedScrapResultWithAiSummaryData[] = $state([]);
	let _updateNewsFeedScrapResultListYn: boolean = $state(false);
	let _addNewsFeedScrapResultYn: boolean = $state(false);

	onMount(async () => {
		if (marketInfo) {
			_marketInfo = marketInfo;
		}

		await initProcess();

		_initYn = true;
	});

	onDestroy(() => {
		_publishedAt = '';
		_resultWithAiSummaryList = [];
		_updateNewsFeedScrapResultListYn = false;
		_addNewsFeedScrapResultYn = false;
	});

	async function initProcess() {
		_resultWithAiSummaryList = [];

		_resultWithAiSummaryList = await requestNewsFeedScrapResultWithAiSummaryList(_publishedAt);
	}

	async function addNewsFeedScrapResult() {
		if (_resultWithAiSummaryList.length === 0) {
			return;
		}

		if (_updateNewsFeedScrapResultListYn) {
			console.log('Already updating news feed scrap results.');
			return;
		}

		_updateNewsFeedScrapResultListYn = true;

		_publishedAt = _resultWithAiSummaryList[_resultWithAiSummaryList.length - 1].result.publishedAt;

		const newItem: NewsFeedScrapResultWithAiSummaryData[] =
			await requestNewsFeedScrapResultWithAiSummaryList(_publishedAt);

		if (newItem.length > 0) {
			newItem.forEach((item) => {
				_resultWithAiSummaryList.push(item);
			});
		}

		_updateNewsFeedScrapResultListYn = false;
	}

	async function requestNewsFeedScrapResultWithAiSummaryList(
		publishedAt: string
	): Promise<NewsFeedScrapResultWithAiSummaryData[]> {
		console.log(publishedAt);
		const responseObject: ResponseObject<unknown> =
			await NewsFeedScrapResultApi.getNewsFeedScrapResultList(publishedAt);

		if (ResponseCode.success.code !== responseObject.code) {
			return [];
		}

		return responseObject.data as NewsFeedScrapResultWithAiSummaryData[];
	}

	const handleScroll = async (event: UIEvent) => {
		const element = event.target;
		if (!(element instanceof HTMLElement)) {
			return;
		}

		if (_addNewsFeedScrapResultYn || _updateNewsFeedScrapResultListYn) {
			return;
		}

		if (element.scrollTop >= element.scrollHeight - element.offsetHeight) {
			_addNewsFeedScrapResultYn = true;
			await addNewsFeedScrapResult();
			_addNewsFeedScrapResultYn = false;
		}
	};

	let _openNewsFeedSCrapResultIdList: number[] = $state([]);

	function onclickOpenNewsFeedScrapResult(itemId: number) {
		if (_openNewsFeedSCrapResultIdList.includes(itemId)) {
			_openNewsFeedSCrapResultIdList = _openNewsFeedSCrapResultIdList.filter(id => id !== itemId);
		} else {
			_openNewsFeedSCrapResultIdList.push(itemId);
		}
	}

	function onclickUpdateNewsFeedScrapResultList() {
		_resultWithAiSummaryList = [];
		_openNewsFeedSCrapResultIdList = [];
		_publishedAt = CurrentDateUtils.getNowDateTimeString();
		initProcess();
	}
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
	<div class="relative flex flex-col w-full h-full scrollbar-hide overflow-y-auto"
			 onscroll={handleScroll}>
		<div class="flex w-full items-center justify-between p-4 sticky top-0 bg-white dark:bg-gray-800">
			<p class="text-2xl font-bold">뉴스 스크랩 결과</p>
			<Button
				class="p-0 focus:ring-0"
				color="light"
				onclick={onclickUpdateNewsFeedScrapResultList}>
				<RotateCcwIcon class="w-5 h-5"
											 strokeWidth={3} />
			</Button>
		</div>
		{#if _resultWithAiSummaryList.length === 0}
			<Card
				class="flex w-full p-4"
				padding="none"
				size="none">
				<p class="text-gray-500 text-center">
					스크랩된 뉴스가 없습니다.
				</p>
			</Card>
		{:else}
			{#each _resultWithAiSummaryList as item}
				<Card
					class="flex w-full p-4 {_addNewsFeedScrapResultYn ? 'animate-pulse blur' : ''}"
					padding="none"
					size="none"
					onclick={() => onclickOpenNewsFeedScrapResult(item.result.id)}>
					<div
						class="inline-flex items-center justify-between p-0 focus:ring-0">
						<div class="inline-flex items-center">
							{#if _openNewsFeedSCrapResultIdList.includes(item.result.id)}
								<SquareChevronDownIcon class="w-5 h-5 mr-2"
																			 strokeWidth={3} />
							{:else}
								<SquareChevronRightIcon class="w-5 h-5 mr-2"
																				strokeWidth={3} />
							{/if}
							<p class="text-md font-bold line-clamp-1">
								{item.result.title}
							</p>
						</div>
						<div class="items-center">
							<p class="text-[11px] text-gray-500">
								{item.result.mediaName}
							</p>
							<p class="text-[11px] text-gray-500">
								{item.result.publishedAt}
							</p>
						</div>
					</div>
					{#if _openNewsFeedSCrapResultIdList.includes(item.result.id)}
						<p class="mt-2 whitespace-pre-line">
							{item.result.contents}
						</p>
						{#if item.aiSummary}
							<p class="mt-2 text-gray-500">
								<strong>기사 분류:</strong> {item.aiSummary.sourceCategory}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>요약:</strong> {item.aiSummary.coreEventSummary}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>핵심 화폐:</strong> {item.aiSummary.primaryCryptocurrency}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>그외 화폐:</strong> {item.aiSummary.otherMentionedCryptocurrencies ? item.aiSummary.otherMentionedCryptocurrencies.join(', ') : '없음'}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>핵심 감성:</strong> {item.aiSummary.sentimentTowardsPrimaryCryptocurrency}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>마켓 감성:</strong> {item.aiSummary.sentimentTowardsOverallMarket}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>잠재적 영향:</strong> {item.aiSummary.potentialImpactLevel}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>키워드:</strong> {item.aiSummary.keyEntitiesMentioned ? item.aiSummary.keyEntitiesMentioned.join(', ') : '없음'}
							</p>
							<p class="mt-2 text-gray-500">
								<strong>관련성:</strong> {item.aiSummary.relevanceToPricePrediction}
							</p>
						{/if}
					{/if}
				</Card>
			{/each}
		{/if}
	</div>
</div>