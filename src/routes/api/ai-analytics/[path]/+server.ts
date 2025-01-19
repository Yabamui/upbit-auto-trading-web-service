import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';
import type {
	AiPromptsCreateRequestData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import type { AiResponsesTodayInferenceData } from '$lib/common/models/AiResponsesData';

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

	if (ApiPathCode.aiAnalyticsAiResponsesList.path === path) {
		return await getAiResponses(url, userId);
	}

	if (ApiPathCode.aiAnalyticsAiResponseModelsList.path === path) {
		return await getAiResponseModelsList(url);
	}

	if (ApiPathCode.aiAnalyticsAiPromptsList.path === path) {
		return await getAiPromptsList(url, userId);
	}

	if (ApiPathCode.aiAnalyticsAiResponsesTodayInference.path === path) {
		return await getAiResponsesTodayInference(userId, url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function getAiModelList() {
	const resultList = await AiAnalyticsService.getAiModelList();

	return ResponseUtils.ok(resultList);
}

async function getAiResponses(url: URL, userId: string | undefined) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const market = url.searchParams.get('market');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList = await AiAnalyticsService.getAiResponses(market, userId);

	return ResponseUtils.ok(resultList);
}

async function getAiResponseModelsList(url: URL) {
	const aiModelId = url.searchParams.get('aiModelId');

	if (!aiModelId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList = await AiAnalyticsService.getAiResponseModelsList(parseInt(aiModelId));

	return ResponseUtils.ok(resultList);
}

async function getAiPromptsList(url: URL, userId: string | undefined) {
	if (userId === undefined) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const aiModelId = url.searchParams.get('aiModelId');

	if (!aiModelId) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList = await AiAnalyticsService.getAiPromptsList(
		parseInt(userId),
		parseInt(aiModelId)
	);

	return ResponseUtils.ok(resultList);
}

async function getAiResponsesTodayInference(userId: string | undefined, url: URL) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const candleType = url.searchParams.get('candleType');

	if (!candleType) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const resultList: AiResponsesTodayInferenceData[] =
		await AiAnalyticsService.getAiResponsesTodayInference(parseInt(userId), candleType);

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

	if (ApiPathCode.aiAnalyticsRequest.path === path) {
		return await requestAiAnalytics(userId, request);
	}

	if (ApiPathCode.aiAnalyticsAiPromptsCreate.path === path) {
		return await createAiPrompts(userId, request);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function requestAiAnalytics(userId: string | undefined, request: Request) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const { market, aiModelId, aiPromptId, candleType, candleCount, candleTimeZone } =
		await request.json();

	if (!market || !aiModelId || !aiPromptId || !candleType || !candleCount || !candleTimeZone) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await AiAnalyticsService.createAiResponses(
		parseInt(userId),
		market,
		aiModelId,
		aiPromptId,
		candleType,
		candleCount,
		candleTimeZone
	);

	return ResponseUtils.ok(result);
}

async function createAiPrompts(userId: string | undefined, request: Request) {
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

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function updateAiPrompts(userId: string | undefined, request: Request) {
	if (!userId) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const updateRequestData: AiPromptsUpdateRequestData =
		(await request.json()) as AiPromptsUpdateRequestData;

	if (
		!updateRequestData.id ||
		!updateRequestData.userId ||
		!updateRequestData.aiModelId ||
		!updateRequestData.title ||
		!updateRequestData.userPromptsList ||
		!updateRequestData.userPromptsList.length
	) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	if (userId !== updateRequestData.userId.toString()) {
		return ResponseUtils.error(ResponseCode.unauthorized);
	}

	const result = await AiAnalyticsService.updateAiPrompts(parseInt(userId), updateRequestData);

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

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function deleteAiResponses(userId: string | undefined, url: URL) {
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
