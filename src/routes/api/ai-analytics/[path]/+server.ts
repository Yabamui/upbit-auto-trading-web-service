import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';
import type {
	AiPromptsCreateRequestData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import type {
	AiInferenceData,
	AiLatestInferenceData,
	AiResponsesCreateRequestData
} from '$lib/common/models/AiResponsesData';
import type {
	AiAnalyticsRequestSchedulerCreateData,
	AiAnalyticsRequestSchedulerData,
	AiAnalyticsRequestSchedulerUpdateData
} from '$lib/common/models/AiAnalyticsRequestSchedulerData';

/**
 * GET method
 * @param params
 * @param url
 * @param cookies
 * @constructor
 */
export async function GET({ params, url, cookies }) {
	const userId = cookies.get('user_id');

	const path = params.path;

	if (ApiPathCode.aiAnalyticsAiModelList.path === path) {
		return await getAiModelList();
	}

	if (ApiPathCode.aiAnalyticsAiResponses.path === path) {
		return await getAiResponses(userId, url);
	}

	if (ApiPathCode.aiAnalyticsAiResponsesList.path === path) {
		return await getAiResponsesList(url, userId);
	}

	if (ApiPathCode.aiAnalyticsAiLatestInferenceList.path === path) {
		return await getAiLatestInferenceList(userId, url);
	}

	if (ApiPathCode.aiAnalyticsAiResponseModelsList.path === path) {
		return await getAiResponseModelsList(url);
	}

	if (ApiPathCode.aiAnalyticsAiPromptsList.path === path) {
		return await getAiPromptsList(url, userId);
	}

	if (ApiPathCode.aiAnalyticsRequestSchedulerList.path === path) {
		return await getAiAnalyticsRequestSchedulerList(userId);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function getAiModelList(): Promise<Response> {
	const resultList = await AiAnalyticsService.getAiModelList();

	return ResponseUtils.ok(resultList);
}

async function getAiResponses(userId: string | undefined, url: URL): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const aiResponsesId = url.searchParams.get('aiResponsesId');
	const market = url.searchParams.get('market');

	if (!aiResponsesId || !market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const aiInference: AiInferenceData | null = await AiAnalyticsService.getAiResponses(
		parseInt(userId),
		parseInt(aiResponsesId),
		market
	);

	if (!aiInference) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(aiInference);
}

async function getAiResponsesList(url: URL, userId: string | undefined): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const market = url.searchParams.get('market');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList = await AiAnalyticsService.getAiResponsesList(market, userId);

	return ResponseUtils.ok(resultList);
}

async function getAiLatestInferenceList(userId: string | undefined, url: URL): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const marketCurrency = url.searchParams.get('marketCurrency') || '';
	const market = url.searchParams.get('market') || '';
	const candleUnit = url.searchParams.get('candleUnit');
	const candleTimeZone = url.searchParams.get('candleTimeZone');
	const judgementYn = url.searchParams.get('judgementYn') || 'false';

	if (!candleUnit || !candleTimeZone) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}
	
	const aiLatestInferenceList: AiLatestInferenceData[] =
		await AiAnalyticsService.getAiLatestInferenceList(
			parseInt(userId),
			marketCurrency,
			market,
			candleUnit,
			candleTimeZone,
			judgementYn === 'true'
		);
	
	return ResponseUtils.ok(aiLatestInferenceList);
}

async function getAiResponseModelsList(url: URL): Promise<Response> {
	const aiModelId = url.searchParams.get('aiModelId');

	if (!aiModelId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList = await AiAnalyticsService.getAiResponseModelsList(parseInt(aiModelId));

	return ResponseUtils.ok(resultList);
}

async function getAiPromptsList(url: URL, userId: string | undefined): Promise<Response> {
	if (userId === undefined) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const aiModelId = url.searchParams.get('aiModelId');

	const resultList = await AiAnalyticsService.getAiPromptsList(
		parseInt(userId),
		aiModelId ? parseInt(aiModelId) : 0
	);

	return ResponseUtils.ok(resultList);
}

async function getAiAnalyticsRequestSchedulerList(userId: string | undefined): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const resultList: AiAnalyticsRequestSchedulerData[] =
		await AiAnalyticsService.getAiAnalyticsRequestSchedulerList(parseInt(userId));

	return ResponseUtils.ok(resultList);
}

/**
 * POST method
 * @param params
 * @param request
 * @param cookies
 * @constructor
 */
export async function POST({ params, request, cookies }) {
	const userId = cookies.get('user_id');
	const path = params.path;

	if (ApiPathCode.aiAnalyticsResponsesCreate.path === path) {
		return await createAiResponses(userId, request);
	}

	if (ApiPathCode.aiAnalyticsAiPromptsCreate.path === path) {
		return await createAiPrompts(userId, request);
	}

	if (ApiPathCode.aiAnalyticsRequestSchedulerCreate.path === path) {
		return await createAiAnalyticsRequestScheduler(userId, request);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function createAiResponses(userId: string | undefined, request: Request): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const body: AiResponsesCreateRequestData = await request.json();

	if (!body) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await AiAnalyticsService.createAiResponses(parseInt(userId), body);

	return ResponseUtils.ok(result);
}

async function createAiPrompts(userId: string | undefined, request: Request): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const createRequestData: AiPromptsCreateRequestData =
		(await request.json()) as AiPromptsCreateRequestData;

	if (
		!createRequestData.aiModelId ||
		!createRequestData.title ||
		!createRequestData.userPromptsList ||
		!createRequestData.userPromptsList.length
	) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await AiAnalyticsService.createAiPrompts(parseInt(userId), createRequestData);

	if (!result) {
		return ResponseUtils.error(ResponseCode.internalServerError);
	}

	return ResponseUtils.ok(result);
}

async function createAiAnalyticsRequestScheduler(
	userId: string | undefined,
	request: Request
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const createData: AiAnalyticsRequestSchedulerCreateData =
		(await request.json()) as AiAnalyticsRequestSchedulerCreateData;

	if (!createData) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result: number = await AiAnalyticsService.createAiAnalyticsRequestScheduler(
		parseInt(userId),
		createData
	);

	return ResponseUtils.ok(result);
}

/**
 * PUT method
 * @param params
 * @param request
 * @param cookies
 * @constructor
 */
export async function PUT({ params, request, cookies }) {
	const userId = cookies.get('user_id');
	const path = params.path;

	if (ApiPathCode.aiAnalyticsAiPromptsUpdate.path === path) {
		return await updateAiPrompts(userId, request);
	}

	if (ApiPathCode.aiAnalyticsRequestSchedulerUpdate.path === path) {
		return await updateAiAnalyticsRequestScheduler(userId, request);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function updateAiPrompts(userId: string | undefined, request: Request): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const updateRequestData: AiPromptsUpdateRequestData =
		(await request.json()) as AiPromptsUpdateRequestData;

	if (
		!updateRequestData.id ||
		!updateRequestData.aiModelId ||
		!updateRequestData.title ||
		!updateRequestData.userPromptsList ||
		!updateRequestData.userPromptsList.length
	) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await AiAnalyticsService.updateAiPrompts(parseInt(userId), updateRequestData);

	return ResponseUtils.ok(result);
}

async function updateAiAnalyticsRequestScheduler(
	userId: string | undefined,
	request: Request
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const updateData: AiAnalyticsRequestSchedulerUpdateData =
		(await request.json()) as AiAnalyticsRequestSchedulerUpdateData;

	if (!updateData) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await AiAnalyticsService.updateAiAnalyticsRequestScheduler(
		parseInt(userId),
		updateData
	);

	return ResponseUtils.ok(result);
}

/**
 * DELETE method
 * @param url
 * @param params
 * @param cookies
 * @constructor
 */
export async function DELETE({ url, params, cookies }) {
	const userId = cookies.get('user_id');
	const path = params.path;

	if (ApiPathCode.aiAnalyticsAiResponseDelete.path === path) {
		return await deleteAiResponses(userId, url);
	}

	if (ApiPathCode.aiAnalyticsRequestSchedulerDelete.path === path) {
		return await deleteAiAnalyticsRequestScheduler(userId, url);
	}

	if (ApiPathCode.aiAnalyticsAiPromptsDelete.path === path) {
		return await deleteAiPrompts(userId, url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function deleteAiResponses(userId: string | undefined, url: URL): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized, false);
	}

	const id = url.searchParams.get('id');

	if (!id) {
		return ResponseUtils.error(ResponseCode.wrongParameter, false);
	}

	const result = await AiAnalyticsService.deleteAiResponses(parseInt(userId), parseInt(id));

	return ResponseUtils.ok(result);
}

async function deleteAiAnalyticsRequestScheduler(
	userId: string | undefined,
	url: URL
): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized, false);
	}

	const schedulerId: string | null = url.searchParams.get('schedulerId');

	if (!schedulerId) {
		return ResponseUtils.error(ResponseCode.wrongParameter, false);
	}

	const result = await AiAnalyticsService.deleteAiAnalyticsRequestScheduler(
		parseInt(userId),
		parseInt(schedulerId)
	);

	return ResponseUtils.ok(result);
}

async function deleteAiPrompts(userId: string | undefined, url: URL): Promise<Response> {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized, false);
	}

	const aiPromptsId = url.searchParams.get('aiPromptsId');

	if (!aiPromptsId) {
		return ResponseUtils.error(ResponseCode.wrongParameter, false);
	}

	const result = await AiAnalyticsService.deleteAiPrompts(parseInt(userId), parseInt(aiPromptsId));

	return ResponseUtils.ok(result);
}
