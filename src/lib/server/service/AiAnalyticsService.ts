import {
	type AiInferenceData,
	type AiInferenceItemData,
	type AiLatestInferenceData,
	type AiResponsesCreateRequestData
} from '$lib/common/models/AiResponsesData';
import { AiResponsesRepository } from '$lib/server/repository/AiResponsesRepository';
import {
	type AiLatestInferenceEntity,
	type AiResponsesEntity,
	AiResponsesEntityUtils
} from '$lib/server/entities/AiResponsesEntity';
import { type AiModelEntity, AiModelEntityUtils } from '$lib/server/entities/AiModelEntity';
import { AiModelRepository } from '$lib/server/repository/AiModelRepository';
import { AIModelCode } from '$lib/common/enums/AIModelCode';
import { GeminiAiService } from '$lib/server/service/GeminiAiService';
import { AiResponseModelsRepository } from '$lib/server/repository/AiResponseModelsRepository';
import {
	type AiResponseModelsEntity,
	AiResponseModelsEntityUtils
} from '$lib/server/entities/AiResponseModelsEntity';
import {
	AiResponseModelDataUtils,
	type AiResponseModelProperty,
	type AiResponseModelPropertyItem,
	type AiResponseModelsData
} from '$lib/common/models/AiResponseModelsData';
import { AiPromptsRepository } from '$lib/server/repository/AiPromptsRepository';
import {
	type AiPromptsCreateRequestData,
	type AiPromptsData,
	AiPromptsDataUtils,
	type AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import { type AiPromptsEntity, AiPromptsEntityUtils } from '$lib/server/entities/AiPromptsEntity';
import { MarketInfoRepository } from '$lib/server/repository/MarketInfoRepository';
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
import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';
import {
	type AiAnalyticsRequestSchedulerCreateData,
	type AiAnalyticsRequestSchedulerData,
	AiAnalyticsRequestSchedulerDataUtils,
	type AiAnalyticsRequestSchedulerUpdateData
} from '$lib/common/models/AiAnalyticsRequestSchedulerData';
import { AiAnalyticsRequestSchedulerRepository } from '$lib/server/repository/AiAnalyticsRequestSchedulerRepository';
import {
	type AiAnalyticsRequestSchedulerEntity,
	AiAnalyticsRequestSchedulerEntityUtils
} from '$lib/server/entities/AiAnalyticsRequestSchedulerEntity';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import moment from 'moment';

export const AiAnalyticsService = {
	getAiModelList: getAiModelList,

	getAiResponses: getAiResponses,
	getAiResponsesList: getAiResponsesList,
	getAiLatestInferenceList: getAiLatestInferenceList,
	createAiResponses: createAiResponses,
	deleteAiResponses: deleteAiResponses,

	getAiResponseModelsList: getAiResponseModelsList,

	getAiPromptsList: getAiPromptsList,
	createAiPrompts: createAiPrompts,
	updateAiPrompts: updateAiPrompts,
	deleteAiPrompts: deleteAiPrompts,

	getAiAnalyticsRequestSchedulerList: getAiAnalyticsRequestSchedulerList,
	createAiAnalyticsRequestScheduler: createAiAnalyticsRequestScheduler,
	updateAiAnalyticsRequestScheduler: updateAiAnalyticsRequestScheduler,
	deleteAiAnalyticsRequestScheduler: deleteAiAnalyticsRequestScheduler
};

// Ai Model
async function getAiModelList() {
	const aiModelEntityList: AiModelEntity[] = await AiModelRepository.findAll();

	return aiModelEntityList.map((item) => {
		return AiModelEntityUtils.toAiModelData(item);
	});
}

// Ai Responses
async function getAiResponses(
	userId: number,
	aiResponsesId: number,
	market: string
): Promise<AiInferenceData | null> {
	
	const entity: AiResponsesEntity | null =
		await AiResponsesRepository.findTopByUserIdAndIdAndMarket(userId, aiResponsesId, market);

	if (!entity) {
		return null;
	}

	return getAiInferenceData(entity, true);
}

async function getAiResponsesList(market: string, userId: string): Promise<AiInferenceData[]> {
	if (!userId || !market) {
		return [];
	}

	const entities: AiResponsesEntity[] = await AiResponsesRepository.findAllByUserIdAndMarket(
		parseInt(userId),
		market
	);

	if (entities.length === 0) {
		return [];
	}

	return entities.map((item) => {
		return getAiInferenceData(item, true);
	});
}

async function getAiLatestInferenceList(
	userId: number,
	marketCurrency: string,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	judgementYn: boolean
): Promise<AiLatestInferenceData[]> {
	if (!userId || !candleUnit || !candleTimeZone) {
		return [];
	}
	
	const nowDateUtc = CurrentDateUtils.getNowDateString(candleTimeZone);

	let entities: AiLatestInferenceEntity[] = []
	
	if (marketCurrency) {
		entities = await AiResponsesRepository.findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone(
			userId,
			marketCurrency,
			candleUnit,
			candleTimeZone,
			nowDateUtc
		);
	} else if (market) {
		entities = await AiResponsesRepository.findAllLatestByUserIdAndMarketAndCandleUnitAndCandleTimeZone(
			userId,
			market,
			candleUnit,
			candleTimeZone,
			nowDateUtc
		);
	}

	if (entities.length === 0) {
		return [];
	}

	return entities.map((entity: AiLatestInferenceEntity): AiLatestInferenceData => {
		return AiResponsesEntityUtils.toAiLatestInferenceData(entity, judgementYn);
	});
}

async function createAiResponses(userId: number, createRequestData: AiResponsesCreateRequestData) {
	const aiModelEntity: AiModelEntity | null = await AiModelRepository.findTopById(
		createRequestData.aiModelId
	);

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

	const marketEntity = await MarketInfoRepository.findTopByMarket(createRequestData.market);

	if (marketEntity === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### createAiResponses marketEntity is null`
		);
		return null;
	}

	const aiPromptEntity: AiPromptsEntity | null = await AiPromptsRepository.findTopByUserIdAndId(
		userId,
		createRequestData.aiPromptsId
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
		createRequestData.candleUnit,
		createRequestData.candleCount,
		createRequestData.candleTimeZone
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
		createRequestData.market,
		aiModelEntity.id,
		aiPromptEntity.id,
		aiPromptEntity.ai_response_models_id,
		JSON.parse(responseText),
		createRequestData.candleUnit,
		createRequestData.candleCount,
		createRequestData.candleTimeZone,
		requestModelData.beginDate,
		requestModelData.endDate
	);

	return aiResponseEntity?.id || null;
}

async function deleteAiResponses(userId: number, id: number): Promise<boolean> {
	return await AiResponsesRepository.deleteAiResponses(userId, id);
}

// Ai Response Models
async function getAiResponseModelsList(aiModelId: number): Promise<AiResponseModelsData[]> {
	const aiResponseModelsEntities: AiResponseModelsEntity[] =
		await AiResponseModelsRepository.findAllByAiModelId(aiModelId);

	return aiResponseModelsEntities.map((item) => {
		return AiResponseModelsEntityUtils.toAiResponseModelData(item) as AiResponseModelsData;
	});
}

// Ai Prompts
async function getAiPromptsList(userId: number, aiModelId: number): Promise<AiPromptsData[]> {
	if (!userId) {
		return [];
	}

	const aiPromptsEntities: AiPromptsEntity[] =
		aiModelId === 0
			? await AiPromptsRepository.findAllByUserId(userId)
			: await AiPromptsRepository.findAllByUserIdAndAiModelId(userId, aiModelId);

	return aiPromptsEntities.map((item) => {
		return AiPromptsEntityUtils.toAiPromptsData(item);
	});
}

async function createAiPrompts(
	userId: number,
	createRequestData: AiPromptsCreateRequestData
): Promise<number | null> {
	const validResult = AiPromptsDataUtils.validCreateData(createRequestData);

	if (!validResult.valid) {
		throw new Error(validResult.message);
	}

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
	const validResult = AiPromptsDataUtils.validUpdateData(updateRequestData);

	if (!validResult.valid) {
		throw new Error(validResult.message);
	}

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

async function deleteAiPrompts(userId: number, aiPromptsId: number): Promise<boolean> {
	if (!userId || !aiPromptsId) {
		return false;
	}

	return await AiPromptsRepository.deleteAiPrompts(userId, aiPromptsId);
}

// Ai Analytics Request Scheduler
async function getAiAnalyticsRequestSchedulerList(
	userId: number
): Promise<AiAnalyticsRequestSchedulerData[]> {
	const entities = await AiAnalyticsRequestSchedulerRepository.findAllByUserId(userId);

	return entities.map(
		(item: AiAnalyticsRequestSchedulerEntity): AiAnalyticsRequestSchedulerData => {
			return AiAnalyticsRequestSchedulerEntityUtils.toAiAnalyticsRequestSchedulerData(item);
		}
	);
}

async function createAiAnalyticsRequestScheduler(
	userId: number,
	createData: AiAnalyticsRequestSchedulerCreateData
): Promise<number> {
	const validResult = AiAnalyticsRequestSchedulerDataUtils.validCreateData(createData);

	if (!validResult.valid) {
		throw new Error(validResult.message);
	}

	const existCount: number | undefined =
		await AiAnalyticsRequestSchedulerRepository.countAllByUserIdAndAiModelIdAndCandleUnitAndExecuteHoursAndExecuteMinutes(
			userId,
			createData.aiModelId,
			createData.candleUnit,
			createData.executeHours,
			createData.executeMinutes
		);

	const promptsCount: number | undefined = await AiPromptsRepository.countAllByUserIdAndId(
		userId,
		createData.aiPromptsId
	);

	if (!promptsCount) {
		throw new Error(ResponseCode.notFound.message);
	}

	if (!CurrentNumberUtils.isNumber(existCount)) {
		throw new Error(ResponseCode.alreadyExists.message);
	}

	const entity: AiAnalyticsRequestSchedulerEntity | undefined =
		await AiAnalyticsRequestSchedulerRepository.insertByAiAnalyticsRequestSchedulerCreateData(
			userId,
			createData
		);

	if (!entity) {
		throw new Error(ResponseCode.internalServerError.message);
	}

	return entity.id;
}

async function updateAiAnalyticsRequestScheduler(
	userId: number,
	updateData: AiAnalyticsRequestSchedulerUpdateData
): Promise<number> {
	const validResult = AiAnalyticsRequestSchedulerDataUtils.validUpdateData(updateData);

	if (!validResult.valid) {
		throw new Error(validResult.message);
	}

	const existCount: number | undefined =
		await AiAnalyticsRequestSchedulerRepository.countAllByUserIdAndId(userId, updateData.id);

	if (!existCount) {
		throw new Error(ResponseCode.notFound.message);
	}

	const promptsCount: number | undefined = await AiPromptsRepository.countAllByUserIdAndId(
		userId,
		updateData.aiPromptsId
	);

	if (!promptsCount) {
		throw new Error(ResponseCode.notFound.message);
	}

	const entity: AiAnalyticsRequestSchedulerEntity | undefined =
		await AiAnalyticsRequestSchedulerRepository.updateByAiAnalyticsRequestSchedulerUpdateData(
			userId,
			updateData
		);

	if (!entity) {
		throw new Error(ResponseCode.internalServerError.message);
	}

	return entity.id;
}

async function deleteAiAnalyticsRequestScheduler(userId: number, id: number): Promise<boolean> {
	const result = await AiAnalyticsRequestSchedulerRepository.deleteByUserIdAndId(userId, id);

	if (!result) {
		throw new Error(ResponseCode.internalServerError.message);
	}

	return result;
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
 * @param candleUnit
 * @param candleCount
 * @param candleTimeZone
 */
async function getAiRequestModelCase1Data(
	marketEntity: MarketInfoEntity,
	candleUnit: string,
	candleCount: number,
	candleTimeZone: string
): Promise<AiRequestModelCase1Data | null> {
	const candleDataList: CandleData[] = await CandleService.getCandleDataList(
		marketEntity.market,
		candleUnit,
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

	const itemList: AiRequestModelCase1DataItem[] = candleDataList
		.sort((a, b) => {
			return a.timestamp - b.timestamp;
		})
		.map((item) => {
			const date =
				UPBitCandleTimeZones.utc === candleTimeZone
					? CurrentDateUtils.toDateByString(item.candleDateTimeUtc)
					: CurrentDateUtils.toDateByString(item.candleDateTimeKst);

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

function getAiInferenceData(
	aiResponsesEntity: AiResponsesEntity,
	judgementYn: boolean
): AiInferenceData {
	const property: AiResponseModelProperty = AiResponseModelDataUtils.toAiResponseModelProperty(
		aiResponsesEntity.response
	);

	const aiInferenceItemList: AiInferenceItemData[] = property.items.map(
		(item: AiResponseModelPropertyItem): AiInferenceItemData => {
			const momentDate = moment(item.date);

			if (UPBitCandleUnitEnum.hours.key === aiResponsesEntity.candle_unit) {
				momentDate.set('hour', parseInt(item.time.split(':')[0]));
			}

			const dateTime = momentDate.format(CurrentDateUtils.dateTimeFormat);

			if (judgementYn) {
				return {
					dateTime: dateTime,
					openPrice: item.openPrice,
					highPrice: item.highPrice,
					lowPrice: item.lowPrice,
					closePrice: item.closePrice,
					evaluation: item.evaluation,
					judgementBasis: item.judgementBasis,
					judgementBasisKr: item.judgementBasisKr
				};
			}

			return {
				dateTime: dateTime,
				openPrice: item.openPrice,
				highPrice: item.highPrice,
				lowPrice: item.lowPrice,
				closePrice: item.closePrice,
				evaluation: item.evaluation,
				judgementBasis: '',
				judgementBasisKr: ''
			};
		}
	);

	const aiInference: AiInferenceData = {
		aiResponsesCreatedAt: CurrentDateUtils.toFormatStringByDate(aiResponsesEntity.created_at),
		market: aiResponsesEntity.market,
		aiResponsesId: aiResponsesEntity.id,
		aiModelId: aiResponsesEntity.ai_model_id,
		aiPromptsId: aiResponsesEntity.ai_prompts_id,
		aiResponseModesId: aiResponsesEntity.ai_response_models_id,
		candleUnit: aiResponsesEntity.candle_unit,
		candleCount: aiResponsesEntity.candle_count,
		candleTimeZone: aiResponsesEntity.candle_time_zone,
		candleDateTimeBegin: aiResponsesEntity.candle_date_time_begin,
		candleDateTimeEnd: aiResponsesEntity.candle_date_time_end,
		totalJudgement: '',
		totalJudgementKr: '',
		itemList: aiInferenceItemList
	};

	if (judgementYn) {
		aiInference.totalJudgementKr = property.totalJudgementKr;
		aiInference.totalJudgement = property.totalJudgement;

		return aiInference;
	}

	return aiInference;
}
