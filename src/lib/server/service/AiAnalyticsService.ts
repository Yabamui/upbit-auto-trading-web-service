import type {
	AiResponsesData,
	AiResponsesTodayInferenceData
} from '$lib/common/models/AiResponsesData';
import { AiResponsesRepository } from '$lib/server/repository/AiResponsesRepository';
import { AiResponsesEntityUtils } from '$lib/server/entities/AiResponsesEntity';
import { type AiModelEntity, AiModelEntityUtils } from '$lib/server/entities/AiModelEntity';
import { AiModelRepository } from '$lib/server/repository/AiModelRepository';
import { AIModelCode } from '$lib/common/enums/AIModelCode';
import { GeminiAiService } from '$lib/server/service/GeminiAiService';
import { AiResponseModelsRepository } from '$lib/server/repository/AiResponseModelsRepository';
import {
	type AiResponseModelsEntity,
	AiResponseModelsEntityUtils
} from '$lib/server/entities/AiResponseModelsEntity';
import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';
import { AiPromptsRepository } from '$lib/server/repository/AiPromptsRepository';
import type {
	AiPromptsCreateRequestData,
	AiPromptsData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import { type AiPromptsEntity, AiPromptsEntityUtils } from '$lib/server/entities/AiPromptsEntity';
import { MarketInfoRepository } from '$lib/server/repository/MarketInfoRepository';
import { AiAnalyticsRequestRepository } from '$lib/server/repository/AiAnalyticsRequestRepository';
import type { AiAnalyticsRequestEntity } from '$lib/server/entities/AiAnalyticsRequestEntity';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import type { ResponseSchema } from '@google/generative-ai';
import type { CandleData } from '$lib/common/models/CandleData';
import { CandleService } from '$lib/server/service/CandleService';
import {
	type AiRequestModelCase1Data,
	type AiRequestModelCase1DataItem,
	AiRequestModelDataUtils
} from '$lib/common/models/AiRequestModelData';
import { CandleTypeZoneCode } from '$lib/common/enums/CandleTypeZoneCode';
import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';

export const AiAnalyticsService = {
	getAiModelList: getAiModelList,

	createAiResponses: createAiResponses,
	createAiResponsesByAiAnalyticsRequest: createAiResponsesByAiAnalyticsRequest,
	createAiAnalyticsRequest: createAiAnalyticsRequest,

	getAiResponses: getAiResponses,
	getAiResponseModelsList: getAiResponseModelsList,
	getAiPromptsList: getAiPromptsList,

	getAiResponsesTodayInference: getAiResponsesTodayInference,

	createAiPrompts: createAiPrompts,
	updateAiPrompts: updateAiPrompts,

	deleteAiResponses: deleteAiResponses
};

async function getAiModelList() {
	const aiModelEntityList: AiModelEntity[] = await AiModelRepository.findAll();

	return aiModelEntityList.map((item) => {
		return AiModelEntityUtils.toAiModelData(item);
	});
}

async function createAiResponses(
	userId: number,
	market: string,
	aiModelId: number,
	aiPromptId: number,
	candleType: string,
	candleCount: number,
	candleTimeZone: string
) {
	const aiModelEntity: AiModelEntity | null = await AiModelRepository.findTopById(aiModelId);

	if (aiModelEntity === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses AiModelEntity is null`
		);
		return null;
	}

	if (AIModelCode.GEMINI.code !== aiModelEntity.ai_code) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses AIModelCode is not GEMINI`
		);
		return null;
	}

	const marketEntity = await MarketInfoRepository.findTopByMarket(market);

	if (marketEntity === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses marketEntity is null`
		);
		return null;
	}

	const aiPromptEntity: AiPromptsEntity | null = await AiPromptsRepository.findTopByUserIdAndId(
		userId,
		aiPromptId
	);

	if (aiPromptEntity === null || !aiPromptEntity.ai_response_models_id) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses aiPromptEntity is null or ai_response_models_id is null`
		);
		return null;
	}

	const responseSchema: ResponseSchema | null = await getAiResponseModelJson(
		aiModelEntity.id,
		aiPromptEntity.ai_response_models_id
	);

	if (responseSchema === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses responseSchema is null`
		);
		return null;
	}

	const requestModelData: AiRequestModelCase1Data | null = await getAiRequestModelCase1Data(
		marketEntity,
		candleType,
		candleCount,
		candleTimeZone
	);

	if (requestModelData === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses requestModelData is null`
		);
		return null;
	}

	const responseText: string | null | undefined = await GeminiAiService.generateContent(
		aiModelEntity.model_code,
		responseSchema,
		aiPromptEntity.system_prompts_array,
		aiPromptEntity.user_prompts_array,
		requestModelData
	);

	if (!responseText) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses responseJson is null`
		);
		return null;
	}

	const aiResponseEntity = await AiResponsesRepository.insertAiResponses(
		userId,
		market,
		aiModelEntity.id,
		aiPromptEntity.id,
		aiPromptEntity.ai_response_models_id,
		JSON.parse(responseText),
		candleType,
		candleCount,
		candleTimeZone,
		requestModelData.beginDate,
		requestModelData.endDate
	);

	return aiResponseEntity?.id || null;
}

async function createAiResponsesByAiAnalyticsRequest(requestLimitCount: number) {
	const requestYn = false;

	const aiAnalyticsRequestEntities: AiAnalyticsRequestEntity[] =
		await AiAnalyticsRequestRepository.findAllByRequestYnLimit(requestYn, requestLimitCount);

	if (aiAnalyticsRequestEntities.length === 0) {
		return;
	}

	const analyticsRequestEntitiesByUserIdRecord: Record<number, AiAnalyticsRequestEntity[]> =
		aiAnalyticsRequestEntities.reduce(
			(acc, item) => {
				if (!acc[item.user_id]) {
					acc[item.user_id] = [];
				}

				acc[item.user_id].push(item);

				return acc;
			},
			{} as Record<number, AiAnalyticsRequestEntity[]>
		);

	for (const key in analyticsRequestEntitiesByUserIdRecord) {
		const userId = parseInt(key);
		const entities = analyticsRequestEntitiesByUserIdRecord[userId];

		for (const entity of entities) {
			const aiResponsesId = await createAiResponses(
				userId,
				entity.market,
				entity.ai_model_id,
				entity.ai_prompts_id,
				entity.candle_type,
				entity.candle_count,
				entity.candle_time_zone
			);

			if (!aiResponsesId) {
				entity.request_yn = true;
				entity.result_code = ResponseCode.notFound.code;
				entity.result = ResponseCode.notFound.message;
			} else {
				entity.request_yn = true;
				entity.result_code = ResponseCode.success.code;
				entity.result = ResponseCode.success.message;
				entity.ai_response_id = aiResponsesId;
			}

			await AiAnalyticsRequestRepository.updateAiAnalyticsRequest(entity);
		}
	}
}

async function createAiAnalyticsRequest(
	userId: number,
	marketCurrency: string,
	aiModelId: number,
	aiPromptsId: number,
	candleType: string,
	candleCount: number,
	candleTimeZone: string
) {
	const requestYn = false;

	const aiModelEntity: AiModelEntity | null = await AiModelRepository.findTopById(aiModelId);

	if (aiModelEntity === null) {
		console.log(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### jobCreateAiAnalyticsRequest aiModelEntity is null`
		);

		return;
	}
	
	const aiPromptsEntity: AiPromptsEntity | null = await AiPromptsRepository.findTopByUserIdAndId(
		userId,
		aiPromptsId
	);
	
	if (aiPromptsEntity === null) {
		console.log(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### jobCreateAiAnalyticsRequest aiPromptsEntity is null`
		);

		return;
	}
	
	if (aiPromptsEntity.ai_response_models_id === null) {
		console.log(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### jobCreateAiAnalyticsRequest aiPromptsEntity.ai_response_models_id is null`
		);

		return;
	}

	const marketEntities = await MarketInfoRepository.findAllByMarketLike(marketCurrency);

	if (marketEntities.length === 0) {
		console.log(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### jobCreateAiAnalyticsRequest marketEntities is empty`
		);

		return;
	}

	let resultCount = 0;

	for (const marketEntity of marketEntities) {
		const aiAnalyticsRequestCreateRequestData = {
			userId: userId,
			market: marketEntity.market,
			aiModelId: aiModelId,
			aiPromptsId: aiPromptsId,
			candleType: candleType,
			candleCount: candleCount,
			candleTimeZone: candleTimeZone,
			requestYn: requestYn
		};

		const aiAnalyticsRequestEntity = await AiAnalyticsRequestRepository.insertAiAnalyticsRequest(
			aiAnalyticsRequestCreateRequestData
		);

		if (aiAnalyticsRequestEntity !== null) {
			resultCount += 1;
		}
	}

	console.log(
		`${CurrentDateUtils.getNowDateTimeString()} :: ### jobCreateAiAnalyticsRequest resultCount : ${resultCount}`
	);
}

async function getAiResponses(market: string, userId: string): Promise<AiResponsesData[]> {
	const entities = await AiResponsesRepository.findAllByUserIdAndMarket(parseInt(userId), market);

	const aiModelEntityList: AiModelEntity[] = await AiModelRepository.findAll();

	const idAndAiModelRecord = aiModelEntityList.reduce(
		(acc, item) => {
			acc[item.id] = item;
			return acc;
		},
		{} as Record<number, AiModelEntity>
	);

	return entities.map((item) => {
		const aiModelEntity = idAndAiModelRecord[item.ai_model_id];
		return AiResponsesEntityUtils.toAiResponsesData(item, aiModelEntity);
	});
}

async function deleteAiResponses(userId: number, id: number): Promise<boolean> {
	return await AiResponsesRepository.deleteAiResponses(userId, id);
}

async function getAiResponseModelsList(aiModelId: number): Promise<AiResponseModelsData[]> {
	const aiResponseModelsEntities: AiResponseModelsEntity[] =
		await AiResponseModelsRepository.findAllByAiModelId(aiModelId);

	return aiResponseModelsEntities.map((item) => {
		return AiResponseModelsEntityUtils.toAiResponseModelData(item) as AiResponseModelsData;
	});
}

async function getAiPromptsList(userId: number, aiModelId: number): Promise<AiPromptsData[]> {
	const aiPromptsEntities: AiPromptsEntity[] =
		await AiPromptsRepository.findAllByUserIdAndAiModelId(userId, aiModelId);

	return aiPromptsEntities.map((item) => {
		return AiPromptsEntityUtils.toAiPromptsData(item);
	});
}

async function createAiPrompts(
	userId: number,
	createRequestData: AiPromptsCreateRequestData
): Promise<number | null> {
	if (createRequestData.defaultYn) {
		await unsetDefaultYn(userId, createRequestData.aiModelId);
	}

	const entity = await AiPromptsRepository.insertAiPrompts(userId, createRequestData);

	if (entity === null) {
		return null;
	}

	return entity.id;
}

async function updateAiPrompts(
	userId: number,
	updateRequestData: AiPromptsUpdateRequestData
): Promise<number | null> {
	const aiPromptsEntity: AiPromptsEntity | null = await AiPromptsRepository.findTopByUserIdAndId(
		userId,
		updateRequestData.id
	);

	if (aiPromptsEntity === null) {
		return null;
	}

	if (updateRequestData.defaultYn) {
		await unsetDefaultYn(userId, updateRequestData.aiModelId);
	}

	const updatedEntity = await AiPromptsRepository.updateAiPrompts(userId, updateRequestData);

	if (updatedEntity === null) {
		return null;
	}

	return updatedEntity.id;
}

async function getAiResponsesTodayInference(
	userId: number,
	candleType: string
): Promise<AiResponsesTodayInferenceData[]> {
	const nowDate = CurrentDateUtils.getNowDateString();

	const entities = await AiResponsesRepository.findAllByTodayInference(userId, candleType, nowDate);

	if (entities.length === 0) {
		return [];
	}

	return entities.map((item) => {
		return AiResponsesEntityUtils.toAiResponseTodayInferenceData(item);
	});
}

/**
 * Private Functions
 *
 * @param aiModelId
 * @param aiResponseModelId
 */
async function getAiResponseModelJson(
	aiModelId: number,
	aiResponseModelId: number | null
): Promise<ResponseSchema | null> {
	if (aiResponseModelId === null) {
		return null;
	}

	const aiResponseModelEntity: AiResponseModelsEntity | null =
		await AiResponseModelsRepository.findTopByIdAndAiModelId(aiResponseModelId, aiModelId);

	if (aiResponseModelEntity === null || aiResponseModelEntity.response_model_json === null) {
		return null;
	}

	return aiResponseModelEntity.response_model_json as ResponseSchema;
}

/**
 * Private Functions
 *
 * @param userId
 * @param aiModelId
 */
async function unsetDefaultYn(userId: number, aiModelId: number): Promise<void> {
	const defaultYnList: AiPromptsEntity[] =
		await AiPromptsRepository.findAllByUserIdAndAiModelIdAndDefaultYn(userId, aiModelId, true);

	if (defaultYnList.length === 0) {
		return;
	}

	for (const item of defaultYnList) {
		await AiPromptsRepository.updateAiPromptsDefaultYn(item.user_id, item.id, false);
	}
}

/**
 * Private Functions
 *
 * @param marketEntity
 * @param candleType
 * @param candleCount
 * @param candleTimeZone
 */
async function getAiRequestModelCase1Data(
	marketEntity: MarketInfoEntity,
	candleType: string,
	candleCount: number,
	candleTimeZone: string
): Promise<AiRequestModelCase1Data | null> {
	const candleDataList: CandleData[] = await CandleService.getCandleDataList(
		marketEntity.market,
		candleType,
		candleCount,
		''
	);

	if (candleDataList.length === 0) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### getAiRequestModelCase1Data candleDataList is empty`
		);
		return null;
	}

	const currency = marketEntity.market.split('-')[0];

	let beginDate: Date | undefined = undefined;
	let endDate: Date | undefined = undefined;

	const itemList: AiRequestModelCase1DataItem[] = candleDataList.map((item) => {
		const date =
			CandleTypeZoneCode.UTC === candleTimeZone
				? CurrentDateUtils.toDateTimeByDate(item.candleDateTimeUtc)
				: CurrentDateUtils.toDateTimeByDate(item.candleDateTimeKst);

		if (!beginDate || beginDate > date) {
			beginDate = date;
		}

		if (!endDate || endDate < date) {
			endDate = date;
		}

		return AiRequestModelDataUtils.toAiRequestModelCase1DataItem(item, candleTimeZone);
	});

	return AiRequestModelDataUtils.toAiRequestModelCase1Data(
		marketEntity.market,
		marketEntity.korean_name,
		marketEntity.english_name,
		currency,
		beginDate,
		endDate,
		candleTimeZone,
		itemList
	);
}
