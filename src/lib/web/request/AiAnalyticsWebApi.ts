import type { ResponseObject } from '$lib/common/models/ResponseData';
import type { AiModelData } from '$lib/common/models/AiModelData';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/api/WebApiRequestUtils';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import type { AiResponsesData } from '$lib/common/models/AiResponsesData';
import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';
import type {
	AiPromptsCreateRequestData,
	AiPromptsData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';

export const AiAnalyticsWebApi = {
	getAiModelList: getAiModelList,
	getAiResponsesList: getAiResponsesList,
	getAiResponsesTodayInference: getAiResponsesTodayInference,
	getAiResponseModelsList: getAiResponseModelsList,
	getAiPromptsList: getAiPromptsList,
	createAiPrompts: createAiPrompts,
	updateAiPrompts: updateAiPrompts,
	requestAiAnalysis: requestAiAnalysis,
	deleteAiResponses: deleteAiResponses
};

async function getAiModelList(): Promise<ResponseObject<AiModelData[]>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiModelList);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiModelData[]>;
}

async function getAiResponsesList(market: string) {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponsesList, params);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiResponsesData[]>;
}

async function getAiResponsesTodayInference(candleType: string): Promise<ResponseObject<AiResponsesData[]>> {
	const params = await CurrentStringUtils.generateQueryParam({ candleType });
	
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponsesTodayInference, params);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiResponsesData[]>;
}

async function getAiResponseModelsList(
	aiModelId: number
): Promise<ResponseObject<AiResponseModelsData[]>> {
	const params = await CurrentStringUtils.generateQueryParam({ aiModelId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponseModelsList, params);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiResponseModelsData[]>;
}

async function getAiPromptsList(aiModelId: number): Promise<ResponseObject<AiPromptsData[]>> {
	const params = await CurrentStringUtils.generateQueryParam({ aiModelId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiPromptsList, params);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiPromptsData[]>;
}

async function createAiPrompts(
	requestData: AiPromptsCreateRequestData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiPromptsCreate);

	return await WebApiRequestUtils.post(url, requestData);
}

async function updateAiPrompts(
	updateRequestData: AiPromptsUpdateRequestData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiPromptsUpdate);

	return await WebApiRequestUtils.put(url, updateRequestData);
}

async function requestAiAnalysis(
	market: string,
	aiModelId: number,
	aiPromptId: number,
	candleType: string,
	candleCount: number,
	candleTimeZone: string
): Promise<ResponseObject<unknown>> {
	const body = {
		market,
		aiModelId,
		aiPromptId,
		candleType,
		candleCount,
		candleTimeZone
	};

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsRequest);

	return await WebApiRequestUtils.post(url, body);
}

async function deleteAiResponses(id: number): Promise<ResponseObject<boolean>> {
	const params = await CurrentStringUtils.generateQueryParam({ id });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponseDelete, params);

	return await WebApiRequestUtils.del(url);
}
