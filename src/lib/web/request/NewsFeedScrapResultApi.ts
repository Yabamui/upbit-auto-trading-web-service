import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import {
	ApiPathCode,
	ApiPathCodeUtils
} from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';
import type { ResponseObject } from '$lib/common/models/ResponseData';

export const NewsFeedScrapResultApi = {
	getNewsFeedScrapResultList: getNewsFeedScrapResultList,
	getNewsFeedScrapResultAiSummaryList: getNewsFeedScrapResultAiSummaryList
}

async function getNewsFeedScrapResultList(
	publishedAt: string
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ publishedAt });
	
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.newsFeedScrapResultList, params);
	
	return await WebApiRequestUtils.get(url);
}

async function getNewsFeedScrapResultAiSummaryList(
	resultIdList: number[]
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ resultIdList });
	
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.newsFeedScrapResultAiSummaryList, params);
	
	return await WebApiRequestUtils.get(url);
}