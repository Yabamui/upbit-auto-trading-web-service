import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { ProphetAnalyticsService } from '$lib/server/service/ProphetAnalyticsService';
import type {
	ProphetAnalyticsRequestConfigCreateData,
	ProphetAnalyticsRequestConfigData,
	ProphetAnalyticsRequestConfigNotExistMarketCreateResultData,
	ProphetAnalyticsRequestConfigUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
import type { ProphetAnalyticsRequestSchedulerData } from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';
import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';

export async function GET({ params, url, cookies }) {
	const userId = cookies.get('user_id');

	const path = params.path;

	if (ApiPathCode.prophetAnalyticsRequestList.path === path) {
		return await getProphetAnalyticsRequestList(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsResult.path === path) {
		return await getProphetAnalyticsResult(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsResultByRequestId.path === path) {
		return await getProphetAnalyticsResultByRequestId(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsResultLatestList.path === path) {
		return await getLatestProphetAnalyticsResultList(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsLatestResultItemList.path === path) {
		return await getLatestProphetAnalyticsResultItemList(userId, url);
	}

	if (ApiPathCode.prophetAnalyticsRequestCompleteCheck.path === path) {
		return await checkProphetAnalyticsRequestComplete(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsRequestConfigList.path === path) {
		return await getProphetAnalyticsRequestConfigList(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsRequestSchedulerList.path === path) {
		return await getProphetAnalyticsRequestSchedulerList(userId);
	}

	return ResponseUtils.error(ResponseCode.notFound);
}

async function getProphetAnalyticsRequestList(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const market = url.searchParams.get('market');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const requestDataList = await ProphetAnalyticsService.getProphetAnalyticsRequestList(
		parseInt(userId),
		market
	);

	return ResponseUtils.ok(requestDataList);
}

async function getProphetAnalyticsResult(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const resultId = url.searchParams.get('resultId');

	if (!resultId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData = await ProphetAnalyticsService.getProphetAnalyticsResult(
		parseInt(userId),
		parseInt(resultId)
	);

	if (!resultData) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(resultData);
}

async function getProphetAnalyticsResultByRequestId(
	url: URL,
	userId: string | undefined
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const requestId = url.searchParams.get('requestId');

	if (!requestId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultDataList: ProphetAnalyticsResultAndItemData[] =
		await ProphetAnalyticsService.getProphetAnalyticsResultByRequestId(
			parseInt(userId),
			parseInt(requestId)
		);

	return ResponseUtils.ok(resultDataList);
}

async function getLatestProphetAnalyticsResultList(
	url: URL,
	userId: string | undefined
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const marketCurrency = url.searchParams.get('marketCurrency');
	const candleUnit = url.searchParams.get('candleUnit');
	const candleTimeZone = url.searchParams.get('candleTimeZone');
	const priceType = url.searchParams.get('priceType');
	const startDate = url.searchParams.get('startDate') || '';

	if (!marketCurrency || !candleUnit || !candleTimeZone || !priceType) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData: ProphetAnalyticsResultAndItemData[] =
		await ProphetAnalyticsService.getLatestProphetAnalyticsResultList(
			parseInt(userId),
			marketCurrency,
			candleUnit,
			candleTimeZone,
			priceType,
			startDate
		);

	return ResponseUtils.ok(resultData);
}

async function getLatestProphetAnalyticsResultItemList(
	userId: string | undefined,
	url: URL
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const market = url.searchParams.get('market');
	const candleUnit = url.searchParams.get('candleUnit');
	const candleTimeZone = url.searchParams.get('candleTimeZone');
	const priceType = url.searchParams.get('priceType');

	if (!market || !candleUnit || !candleTimeZone || !priceType) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData: ProphetAnalyticsResultItemData[] =
		await ProphetAnalyticsService.getLatestProphetAnalyticsResultItemList(
			parseInt(userId),
			market,
			candleUnit,
			candleTimeZone,
			priceType
		);

	return ResponseUtils.ok(resultData);
}

async function checkProphetAnalyticsRequestComplete(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const requestIdList = url.searchParams.getAll('requestIdList');

	if (!requestIdList || requestIdList.length === 0) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData: boolean = await ProphetAnalyticsService.checkProphetAnalyticsRequestComplete(
		parseInt(userId),
		requestIdList.map((requestId) => parseInt(requestId))
	);

	return ResponseUtils.ok(resultData);
}

async function getProphetAnalyticsRequestConfigList(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const market = url.searchParams.get('market');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const requestDataList: ProphetAnalyticsRequestConfigData[] =
		await ProphetAnalyticsService.getProphetAnalyticsRequestConfigList(parseInt(userId), market);

	return ResponseUtils.ok(requestDataList);
}

async function getProphetAnalyticsRequestSchedulerList(userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const requestDataList: ProphetAnalyticsRequestSchedulerData[] =
		await ProphetAnalyticsService.getProphetAnalyticsRequestSchedulerList(parseInt(userId));

	return ResponseUtils.ok(requestDataList);
}

export async function POST({ params, request, cookies }) {
	const userId = cookies.get('user_id');

	const path = params.path;

	if (ApiPathCode.prophetAnalyticsRequestCreate.path === path) {
		return await createProphetAnalyticsRequest(userId, request);
	}

	if (ApiPathCode.prophetAnalyticsRequestConfigCreate.path === path) {
		return await createProphetAnalyticsRequestConfig(userId, request);
	}

	if (ApiPathCode.prophetAnalyticsRequestConfigCreateNotExistMarket.path === path) {
		return await createProphetAnalyticsRequestConfigByNotExistMarket(userId, request);
	}

	if (ApiPathCode.prophetAnalyticsRequestSchedulerCreate.path === path) {
		return await createProphetAnalyticsRequestScheduler(userId, request);
	}

	return ResponseUtils.error(ResponseCode.notFound);
}

async function createProphetAnalyticsRequest(userId: string | undefined, request: Request) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const requestData = await ProphetAnalyticsService.createProphetAnalyticsRequest(
		parseInt(userId),
		body.market,
		body.configId,
		body.priceTypeList
	);

	return ResponseUtils.ok(requestData);
}

async function createProphetAnalyticsRequestConfig(userId: string | undefined, request: Request) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const configData: ProphetAnalyticsRequestConfigData | undefined =
		await ProphetAnalyticsService.createProphetAnalyticsRequestConfig(
			parseInt(userId),
			body as ProphetAnalyticsRequestConfigCreateData
		);

	return ResponseUtils.ok(configData);
}

async function createProphetAnalyticsRequestConfigByNotExistMarket(
	userId: string | undefined,
	request: Request
) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	if (!body.marketCurrency || !body.candleUnit) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const createResult: ProphetAnalyticsRequestConfigNotExistMarketCreateResultData | undefined =
		await ProphetAnalyticsService.createProphetAnalyticsRequestConfigByNotExistMarket(
			parseInt(userId),
			body.marketCurrency,
			body.candleUnit,
			body.includeExclude,
			body.marketList || []
		);

	if (createResult === undefined) {
		return ResponseUtils.error(ResponseCode.internalServerError);
	}

	return ResponseUtils.ok(createResult);
}

async function createProphetAnalyticsRequestScheduler(
	userId: string | undefined,
	request: Request
) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const schedulerData: ProphetAnalyticsRequestSchedulerData | undefined =
		await ProphetAnalyticsService.createProphetAnalyticsRequestScheduler(
			parseInt(userId),
			body as ProphetAnalyticsRequestSchedulerData
		);

	if (!schedulerData) {
		return ResponseUtils.error(ResponseCode.internalServerError);
	}

	return ResponseUtils.ok(schedulerData);
}

export async function PUT({ params, request, cookies }) {
	const userId = cookies.get('user_id');

	const path = params.path;

	if (ApiPathCode.prophetAnalyticsRequestConfigUpdate.path === path) {
		return await updateProphetAnalyticsRequestConfig(userId, request);
	}

	if (ApiPathCode.prophetAnalyticsRequestSchedulerUpdate.path === path) {
		return await updateProphetAnalyticsRequestScheduler(userId, request);
	}

	return ResponseUtils.error(ResponseCode.notFound);
}

async function updateProphetAnalyticsRequestConfig(userId: string | undefined, request: Request) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const configData = await ProphetAnalyticsService.updateProphetAnalyticsRequestConfig(
		parseInt(userId),
		body as ProphetAnalyticsRequestConfigUpdateData
	);

	return ResponseUtils.ok(configData);
}

async function updateProphetAnalyticsRequestScheduler(
	userId: string | undefined,
	request: Request
) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const schedulerData = await ProphetAnalyticsService.updateProphetAnalyticsRequestScheduler(
		parseInt(userId),
		body as ProphetAnalyticsRequestSchedulerData
	);

	return ResponseUtils.ok(schedulerData);
}

export async function DELETE({ params, url, cookies }) {
	const userId = cookies.get('user_id');

	const path = params.path;

	if (ApiPathCode.prophetAnalyticsResultDelete.path === path) {
		return await deleteProphetAnalyticsResult(url, userId);
	}

	if (ApiPathCode.prophetAnalyticsRequestSchedulerDelete.path === path) {
		return await deleteProphetAnalyticsRequestScheduler(url, userId);
	}

	return ResponseUtils.error(ResponseCode.notFound);
}

async function deleteProphetAnalyticsResult(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const requestId = url.searchParams.get('requestId');

	if (!requestId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData = await ProphetAnalyticsService.deleteProphetAnalyticsResult(
		parseInt(userId),
		parseInt(requestId)
	);

	if (!resultData) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(resultData);
}

async function deleteProphetAnalyticsRequestScheduler(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const schedulerId = url.searchParams.get('schedulerId');

	if (!schedulerId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultData = await ProphetAnalyticsService.deleteProphetAnalyticsRequestScheduler(
		parseInt(userId),
		parseInt(schedulerId)
	);

	if (!resultData) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(resultData);
}
