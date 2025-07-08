import type { ResponseObject } from '$lib/common/models/ResponseData';
import type { AiModelData } from '$lib/common/models/AiModelData';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import type {
	AiInferenceData,
	AiLatestInferenceData,
	AiResponsesCreateRequestData
} from '$lib/common/models/AiResponsesData';
import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';
import type {
	AiPromptsCreateRequestData,
	AiPromptsData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import type {
	AiAnalyticsRequestSchedulerCreateData,
	AiAnalyticsRequestSchedulerUpdateData
} from '$lib/common/models/AiAnalyticsRequestSchedulerData';

export const AiAnalyticsWebApi = {
	getAiModelList: getAiModelList,

	getAiResponses: getAiResponses,
	getAiResponsesList: getAiResponsesList,
	getAiLatestInferenceList: getAiLatestInferenceList,
	deleteAiResponses: deleteAiResponses,
	getAiResponseModelsList: getAiResponseModelsList,

	getAiPromptsList: getAiPromptsList,
	createAiPrompts: createAiPrompts,
	updateAiPrompts: updateAiPrompts,
	deleteAiPrompts: deleteAiPrompts,

	createAiResponses: createAiResponses,

	getAiAnalyticsRequestSchedulerList: getAiAnalyticsRequestSchedulerList,
	createAiAnalyticsRequestScheduler: createAiAnalyticsRequestScheduler,
	updateAiAnalyticsRequestScheduler: updateAiAnalyticsRequestScheduler,
	deleteAiAnalyticsRequestScheduler: deleteAiAnalyticsRequestScheduler
};

async function getAiModelList(): Promise<ResponseObject<AiModelData[]>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiModelList);

	return (await WebApiRequestUtils.get(url)) as ResponseObject<AiModelData[]>;
}

async function getAiResponses(
	aiResponsesId: number,
	market: string
): Promise<ResponseObject<AiInferenceData | null>> {
	const params = await CurrentStringUtils.generateQueryParam({ aiResponsesId, market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponses, params);

	return await WebApiRequestUtils.get(url);
}

async function getAiResponsesList(market: string): Promise<ResponseObject<AiInferenceData[]>> {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponsesList, params);

	return await WebApiRequestUtils.get(url);
}

async function getAiLatestInferenceList(
	marketCurrency: string,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	judgementYn: boolean
): Promise<ResponseObject<AiLatestInferenceData[]>> {
	const params = await CurrentStringUtils.generateQueryParam({
		marketCurrency,
		market,
		candleUnit,
		candleTimeZone,
		judgementYn
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiLatestInferenceList, params);

	return await WebApiRequestUtils.get(url);
}

async function createAiResponses(
	createRequestData: AiResponsesCreateRequestData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsResponsesCreate);

	return await WebApiRequestUtils.post(url, createRequestData);
}

async function deleteAiResponses(id: number): Promise<ResponseObject<boolean>> {
	const params = await CurrentStringUtils.generateQueryParam({ id });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiResponseDelete, params);

	return await WebApiRequestUtils.del(url);
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

async function deleteAiPrompts(aiPromptsId: number): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ aiPromptsId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsAiPromptsDelete, params);

	return await WebApiRequestUtils.del(url);
}

async function getAiAnalyticsRequestSchedulerList(): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsRequestSchedulerList);

	return await WebApiRequestUtils.get(url);
}

async function createAiAnalyticsRequestScheduler(
	createData: AiAnalyticsRequestSchedulerCreateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsRequestSchedulerCreate);

	return await WebApiRequestUtils.post(url, createData);
}

async function updateAiAnalyticsRequestScheduler(
	updateData: AiAnalyticsRequestSchedulerUpdateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsRequestSchedulerUpdate);

	return await WebApiRequestUtils.put(url, updateData);
}

async function deleteAiAnalyticsRequestScheduler(
	schedulerId: number
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ schedulerId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.aiAnalyticsRequestSchedulerDelete, params);

	return await WebApiRequestUtils.del(url);
}
