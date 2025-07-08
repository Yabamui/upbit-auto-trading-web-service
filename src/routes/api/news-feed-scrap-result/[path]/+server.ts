import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { NewsFeedScrapResultService } from '$lib/server/service/NewsFeedScrapResultService';
import type {
	NewsFeedScrapResultWithAiSummaryData,
	NewsFeedScrapResultAiSummaryData
} from '$lib/common/models/NewsFeedScrapResultData';

export const GET = async ({ params, url }) => {
	const path: string = params.path;

	if (ApiPathCode.newsFeedScrapResultList.path === path) {
		return await getNewsFeedScrapResultList(url);
	}

	if (ApiPathCode.newsFeedScrapResultAiSummaryList.path === path) {
		return await getNewsFeedScrapResultAiSummaryList(url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
};

async function getNewsFeedScrapResultList(url: URL): Promise<Response> {
	const publishedAt: string | null = url.searchParams.get('publishedAt');

	if (!publishedAt) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultWithAiSummary: NewsFeedScrapResultWithAiSummaryData[] =
		await NewsFeedScrapResultService.getNewsFeedScrapResultList(publishedAt);

	return ResponseUtils.ok(resultWithAiSummary);
}

async function getNewsFeedScrapResultAiSummaryList(url: URL): Promise<Response> {
	const resultIdStringList: string[] | null = url.searchParams.getAll('resultIdList');

	if (!resultIdStringList) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultIdList: number[] = resultIdStringList.map((id: string): number => parseInt(id, 10));

	if (resultIdList.some(isNaN)) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const aiSummaryList: NewsFeedScrapResultAiSummaryData[] =
		await NewsFeedScrapResultService.getNewFeedScrapResultAiSummaryList(resultIdList);

	return ResponseUtils.ok(aiSummaryList);
}
