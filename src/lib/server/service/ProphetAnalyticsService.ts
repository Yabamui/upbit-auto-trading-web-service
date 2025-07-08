import { ProphetAnalyticsRequestRepository } from '$lib/server/repository/ProphetAnalyticsRequestRepository';
import {
	type ProphetAnalyticsRequestEntity,
	ProphetAnalyticsRequestEntityUtils
} from '$lib/server/entities/ProphetAnalyticsRequestEntity';
import type { ProphetAnalyticsRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';
import { ProphetAnalyticsResultRepository } from '$lib/server/repository/ProphetAnalyticsResultRepository';
import { ProphetAnalyticsResultItemRepository } from '$lib/server/repository/ProphetAnalyticsResultItemRepository';
import {
	type ProphetAnalyticsResultEntity,
	ProphetAnalyticsResultEntityUtils
} from '$lib/server/entities/ProphetAnalyticsResultEntity';
import {
	type ProphetAnalyticsResultItemEntity,
	ProphetAnalyticsResultItemEntityUtils
} from '$lib/server/entities/ProphetAnalyticsResultItemEntity';
import type { ProphetAnalyticsResultAndItemData } from '$lib/common/models/ProphetAnalyticsData';
import {
	type ProphetAnalyticsRequestConfigCreateData,
	type ProphetAnalyticsRequestConfigData,
	ProphetAnalyticsRequestConfigDataUtils,
	type ProphetAnalyticsRequestConfigNotExistMarketCreateResultData,
	type ProphetAnalyticsRequestConfigUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
import {
	type ProphetAnalyticsRequestConfigEntity,
	ProphetAnalyticsRequestConfigEntityUtils
} from '$lib/server/entities/ProphetAnalyticsRequestConfigEntity';
import { ProphetAnalyticsRequestConfigRepository } from '$lib/server/repository/ProphetAnalyticsRequestConfigRepository';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import {
	type ProphetAnalyticsRequestSchedulerCreateData,
	type ProphetAnalyticsRequestSchedulerData,
	ProphetAnalyticsRequestSchedulerDataUtils
} from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';
import { ProphetAnalyticsRequestSchedulerRepository } from '$lib/server/repository/ProphetAnalyticsRequestSchedulerRepository';
import {
	type ProphetAnalyticsRequestSchedulerEntity,
	ProphetAnalyticsRequestSchedulerEntityUtils
} from '$lib/server/entities/ProphetAnalyticsRequestSchedulerEntity';
import { MarketInfoRepository } from '$lib/server/repository/MarketInfoRepository';
import { ProphetAnalyticsSchedulerEnum } from '$lib/common/enums/ProphetAnalyticsSchedulerEnum';
import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';
import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';
import type { ProphetAnalyticsResultData } from '$lib/common/models/ProphetAnalyticsResultData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';

export const ProphetAnalyticsService = {
	getProphetAnalyticsRequestList: getProphetAnalyticsRequestList,
	createProphetAnalyticsRequest: createProphetAnalyticsRequest,
	checkProphetAnalyticsRequestComplete: checkProphetAnalyticsRequestComplete,

	getProphetAnalyticsResult: getProphetAnalyticsResult,
	getProphetAnalyticsResultByRequestId: getProphetAnalyticsResultByRequestId,
	getLatestProphetAnalyticsResult: getLatestProphetAnalyticsResult,
	getLatestProphetAnalyticsResultList: getLatestProphetAnalyticsResultList,
	getLatestProphetAnalyticsResultItemList: getLatestProphetAnalyticsResultItemList,
	deleteProphetAnalyticsResult: deleteProphetAnalyticsResult,

	getProphetAnalyticsRequestConfigList: getProphetAnalyticsRequestConfigList,
	createProphetAnalyticsRequestConfig: createProphetAnalyticsRequestConfig,
	createProphetAnalyticsRequestConfigByNotExistMarket:
		createProphetAnalyticsRequestConfigByNotExistMarket,
	updateProphetAnalyticsRequestConfig: updateProphetAnalyticsRequestConfig,

	getProphetAnalyticsRequestSchedulerList: getProphetAnalyticsRequestSchedulerList,
	createProphetAnalyticsRequestScheduler: createProphetAnalyticsRequestScheduler,
	updateProphetAnalyticsRequestScheduler: updateProphetAnalyticsRequestScheduler,
	deleteProphetAnalyticsRequestScheduler: deleteProphetAnalyticsRequestScheduler
};

// --- prophet analytics request ---
async function getProphetAnalyticsRequestList(
	userId: number,
	market: string
): Promise<ProphetAnalyticsRequestData[]> {
	const requestEntities = await ProphetAnalyticsRequestRepository.findAllByUserIdAndMarket(
		userId,
		market
	);

	if (!requestEntities || requestEntities.length === 0) {
		return [];
	}

	return requestEntities.map((requestEntity) => {
		return ProphetAnalyticsRequestEntityUtils.toProphetAnalyticsRequestData(requestEntity);
	});
}

async function createProphetAnalyticsRequest(
	userId: number,
	market: string,
	configId: number,
	priceTypeList: string[]
): Promise<number | null> {
	const requestConfigEntity: ProphetAnalyticsRequestConfigEntity | null =
		await ProphetAnalyticsRequestConfigRepository.findTopByUserIdAndMarket(
			userId,
			market,
			configId
		);

	if (!requestConfigEntity) {
		throw Error(ResponseCode.notFound.message);
	}

	const requestEntity: ProphetAnalyticsRequestEntity | null =
		await ProphetAnalyticsRequestRepository.insertProphetAnalyticsRequest(
			userId,
			requestConfigEntity,
			priceTypeList
		);

	if (!requestEntity) {
		throw Error(ResponseCode.internalServerError.message);
	}

	return requestEntity.id;
}

async function checkProphetAnalyticsRequestComplete(
	userId: number,
	requestIdList: number[]
): Promise<boolean> {
	const resultCount: number =
		await ProphetAnalyticsRequestRepository.countAllByUserIdAndRequestIdIn(userId, requestIdList);

	return resultCount > 0;
}

// --- prophet analytics result ---
async function getProphetAnalyticsResult(
	userId: number,
	resultId: number
): Promise<ProphetAnalyticsResultAndItemData | null> {
	const resultEntity: ProphetAnalyticsResultEntity | null =
		await ProphetAnalyticsResultRepository.findTopByUserIdAndId(userId, resultId);

	if (!resultEntity) {
		return null;
	}

	const resultData: ProphetAnalyticsResultData =
		ProphetAnalyticsResultEntityUtils.toProphetAnalyticsResultData(resultEntity);

	if (!resultData) {
		return null;
	}

	const resultItemDataList: ProphetAnalyticsResultItemData[] =
		await getProphetAnalyticsResultItemDataList(userId, resultData.id);

	return {
		result: resultData,
		resultItemList: resultItemDataList
	} as ProphetAnalyticsResultAndItemData;
}

async function getProphetAnalyticsResultByRequestId(
	userId: number,
	requestId: number
): Promise<ProphetAnalyticsResultAndItemData[]> {
	const resultEntities: ProphetAnalyticsResultEntity[] =
		await ProphetAnalyticsResultRepository.findAllByUserIdAndRequestId(userId, requestId);

	if (!resultEntities.length) {
		return [];
	}

	const resultItemEntities: ProphetAnalyticsResultItemEntity[] =
		await ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultIdIn(
			userId,
			resultEntities.map((item) => item.id)
		);

	if (!resultItemEntities || resultItemEntities.length === 0) {
		return [];
	}

	const resultItemDataListByResultIdRecord: Record<number, ProphetAnalyticsResultItemData[]> =
		await getProphetAnalyticsResultItemListByResultId(resultItemEntities);

	return resultEntities
		.map((resultEntity) => {
			const resultItemDataList: ProphetAnalyticsResultItemData[] | undefined =
				resultItemDataListByResultIdRecord[resultEntity.id];

			if (!resultItemDataList) {
				return null;
			}

			return {
				result: ProphetAnalyticsResultEntityUtils.toProphetAnalyticsResultData(resultEntity),
				resultItemList: resultItemDataList.reverse()
			} as ProphetAnalyticsResultAndItemData;
		})
		.filter((item) => item !== null);
}

async function getLatestProphetAnalyticsResult(
	userId: number,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string
): Promise<ProphetAnalyticsResultData | null> {
	if (!userId || userId <= 0) {
		return null;
	}

	if (!market) {
		return null;
	}

	const resultEntity: ProphetAnalyticsResultEntity | null =
		await ProphetAnalyticsResultRepository.findTopByUserIdAndMarketOrderByIdDesc(
			userId,
			market,
			candleUnit,
			candleTimeZone,
			priceType
		);

	if (!resultEntity) {
		return null;
	}

	return ProphetAnalyticsResultEntityUtils.toProphetAnalyticsResultData(resultEntity);
}

async function getLatestProphetAnalyticsResultList(
	userId: number,
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string,
	startDate: string = ''
): Promise<ProphetAnalyticsResultAndItemData[]> {

	const resultEntities =
		await ProphetAnalyticsResultRepository.findAllByUserIdAndCandleUnitAndCandleTimeZoneAndRowNumber(
			userId,
			marketCurrency,
			candleUnit,
			candleTimeZone,
			priceType
		);
	
	if (!resultEntities || resultEntities.length === 0) {
		console.log('resultEntities is empty');
		return [];
	}
	
	const nowDate: string = startDate ? startDate : CurrentDateUtils.getNowDateString(UPBitCandleTimeZones.utc);

	const resultIdList: number[] = resultEntities.map((item) => item.id);
	
	const resultItemEntities: ProphetAnalyticsResultItemEntity[] =
		await ProphetAnalyticsResultItemRepository.findAllDSAndYhatByUserIdAndResultIdInAndDs(
			userId,
			resultIdList,
			nowDate
		);

	if (!resultItemEntities || resultItemEntities.length === 0) {
		console.log('resultItemEntities is empty');
		return [];
	}

	const resultItemDataListByResultIdRecord: Record<number, ProphetAnalyticsResultItemData[]> =
		await getProphetAnalyticsResultItemListByResultId(resultItemEntities);

	return resultEntities.map((resultEntity) => {
		const resultItemDataList: ProphetAnalyticsResultItemData[] | undefined =
			resultItemDataListByResultIdRecord[resultEntity.id];

		if (!resultItemEntities) {
			return {
				result: ProphetAnalyticsResultEntityUtils.toProphetAnalyticsResultData(resultEntity),
				resultItemList: []
			} as ProphetAnalyticsResultAndItemData;
		}

		return {
			result: ProphetAnalyticsResultEntityUtils.toProphetAnalyticsResultData(resultEntity),
			resultItemList: resultItemDataList
		} as ProphetAnalyticsResultAndItemData;
	});
}

async function getLatestProphetAnalyticsResultItemList(
	userId: number,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string
): Promise<ProphetAnalyticsResultItemData[]> {
	const resultEntity: ProphetAnalyticsResultEntity | null =
		await ProphetAnalyticsResultRepository.findTopByUserIdAndMarketOrderByIdDesc(
			userId,
			market,
			candleUnit,
			candleTimeZone,
			priceType
		);

	if (!resultEntity) {
		return [];
	}

	const resultItemEntities: ProphetAnalyticsResultItemEntity[] =
		await ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultId(userId, resultEntity.id);

	if (!resultItemEntities || resultItemEntities.length === 0) {
		return [];
	}

	return resultItemEntities.map((resultItemEntity) => {
		return ProphetAnalyticsResultItemEntityUtils.toProphetAnalyticsResultItemData(resultItemEntity);
	});
}

async function deleteProphetAnalyticsResult(userId: number, requestId: number): Promise<boolean> {

	const resultList = await ProphetAnalyticsResultRepository.findAllByUserIdAndRequestId(
		userId,
		requestId
	);
	
	console.log(resultList);

	if (resultList && resultList.length > 0) {
		await ProphetAnalyticsResultItemRepository.deleteAllByUserIdAndResultIdIn(
			userId,
			resultList.map((result) => result.id)
		);
		
		await ProphetAnalyticsResultRepository.deleteAllByUserIdAndRequestId(userId, requestId);
	}
	
	return await ProphetAnalyticsRequestRepository.deleteProphetAnalyticsRequest(
		userId,
		requestId
	);
}

// --- prophet analytics request config ---
async function getProphetAnalyticsRequestConfigList(
	userId: number,
	market: string
): Promise<ProphetAnalyticsRequestConfigData[]> {
	if (!userId || userId <= 0) {
		return [];
	}

	const requestEntities: ProphetAnalyticsRequestConfigEntity[] =
		await ProphetAnalyticsRequestConfigRepository.findAllByUserIdAndMarket(userId, market);

	if (!requestEntities || requestEntities.length === 0) {
		return [];
	}

	return requestEntities.map((requestEntity) => {
		return ProphetAnalyticsRequestConfigEntityUtils.toProphetAnalyticsRequestConfigData(
			requestEntity
		);
	});
}

async function createProphetAnalyticsRequestConfig(
	userId: number,
	createData: ProphetAnalyticsRequestConfigCreateData
): Promise<ProphetAnalyticsRequestConfigData | undefined> {
	const validResult = ProphetAnalyticsRequestConfigDataUtils.validRequestData(createData);

	if (!validResult) {
		throw Error(ResponseCode.wrongParameter.message);
	}

	const existCount: number | undefined =
		await ProphetAnalyticsRequestConfigRepository.countAllByUserIdAndMarketAndCandleUnit(
			userId,
			createData.market,
			createData.candleUnit
		);

	if (existCount === undefined) {
		throw Error(ResponseCode.internalServerError.message);
	}

	if (existCount > 0) {
		throw Error(ResponseCode.alreadyExists.message);
	}

	const createdRequestEntity: ProphetAnalyticsRequestConfigEntity | null =
		await ProphetAnalyticsRequestConfigRepository.insertProphetAnalyticsRequestConfig(
			userId,
			createData
		);

	if (!createdRequestEntity) {
		throw Error(ResponseCode.internalServerError.message);
	}

	return ProphetAnalyticsRequestConfigEntityUtils.toProphetAnalyticsRequestConfigData(
		createdRequestEntity
	);
}

async function createProphetAnalyticsRequestConfigByNotExistMarket(
	userId: number,
	marketCurrency: string,
	candleUnit: string,
	includeExclude: string,
	marketList: string[]
): Promise<ProphetAnalyticsRequestConfigNotExistMarketCreateResultData | undefined> {
	const marketInfoEntities: MarketInfoEntity[] = await getMarketInfoEntities(
		marketCurrency,
		includeExclude,
		marketList
	);

	if (!marketInfoEntities || marketInfoEntities.length === 0) {
		return undefined;
	}

	const existMarketList: string[] | undefined =
		await ProphetAnalyticsRequestConfigRepository.findAllMarketByUserIdAndMarketInAndCandleUnit(
			userId,
			marketInfoEntities.map((item) => item.market),
			candleUnit
		);

	if (existMarketList === undefined) {
		return undefined;
	}

	const insertMarketList: MarketInfoEntity[] = marketInfoEntities.filter((item) => {
		return !existMarketList.includes(item.market);
	});

	if (insertMarketList.length === 0) {
		return {
			newConfigCount: 0,
			createFailCount: 0
		};
	}

	let newConfigCount = 0;
	let createFailCount = 0;

	for (const marketInfoEntity of insertMarketList) {
		const createData: ProphetAnalyticsRequestConfigCreateData =
			ProphetAnalyticsRequestConfigDataUtils.createProphetAnalyticsRequestCreateDataByDefaultData(
				marketInfoEntity.market,
				candleUnit
			);

		const createdRequestEntity: ProphetAnalyticsRequestConfigEntity | null =
			await ProphetAnalyticsRequestConfigRepository.insertProphetAnalyticsRequestConfig(
				userId,
				createData
			);

		if (!createdRequestEntity) {
			createFailCount += 1;
		} else {
			newConfigCount += 1;
		}
	}

	return {
		newConfigCount,
		createFailCount
	};
}

async function updateProphetAnalyticsRequestConfig(
	userId: number,
	updateData: ProphetAnalyticsRequestConfigUpdateData
): Promise<ProphetAnalyticsRequestConfigData> {
	const validResult = ProphetAnalyticsRequestConfigDataUtils.validUpdateData(updateData);

	if (!validResult) {
		throw Error(ResponseCode.wrongParameter.message);
	}

	const existCount: number | undefined =
		await ProphetAnalyticsRequestConfigRepository.countAllByUserIdAndMarketAndCandleUnit(
			userId,
			updateData.market,
			updateData.candleUnit
		);

	if (existCount === undefined) {
		throw Error(ResponseCode.internalServerError.message);
	}

	if (existCount <= 0) {
		throw Error(ResponseCode.notFound.message);
	}

	const updatedRequestEntity: ProphetAnalyticsRequestConfigEntity | null =
		await ProphetAnalyticsRequestConfigRepository.updateProphetAnalyticsRequestConfig(updateData);

	console.log('updatedRequestEntity', updatedRequestEntity);

	if (!updatedRequestEntity) {
		throw Error(ResponseCode.internalServerError.message);
	}

	return ProphetAnalyticsRequestConfigEntityUtils.toProphetAnalyticsRequestConfigData(
		updatedRequestEntity
	);
}

// --- prophet analytics request scheduler ---
async function getProphetAnalyticsRequestSchedulerList(
	userId: number
): Promise<ProphetAnalyticsRequestSchedulerData[]> {
	const schedulerEntities: ProphetAnalyticsRequestSchedulerEntity[] =
		await ProphetAnalyticsRequestSchedulerRepository.findAllByUserId(userId);

	if (!schedulerEntities || schedulerEntities.length === 0) {
		return [];
	}

	return schedulerEntities.map((schedulerEntity) => {
		return ProphetAnalyticsRequestSchedulerEntityUtils.toProphetAnalyticsRequestSchedulerData(
			schedulerEntity
		);
	});
}

async function createProphetAnalyticsRequestScheduler(
	userId: number,
	createData: ProphetAnalyticsRequestSchedulerCreateData
): Promise<ProphetAnalyticsRequestSchedulerData | undefined> {
	const validResult = ProphetAnalyticsRequestSchedulerDataUtils.validCreateData(createData);

	if (!validResult) {
		throw Error(ResponseCode.wrongParameter.message);
	}

	const count: number | undefined =
		await ProphetAnalyticsRequestSchedulerRepository.countAllByUserIdAndCandleUnitAndExecuteHoursAndExecuteMinutes(
			userId,
			createData
		);

	if (count === undefined) {
		throw Error(ResponseCode.internalServerError.message);
	}

	if (count > 0) {
		throw Error(ResponseCode.alreadyExists.message);
	}

	const schedulerEntity: ProphetAnalyticsRequestSchedulerEntity | null =
		await ProphetAnalyticsRequestSchedulerRepository.insertProphetAnalyticsRequestScheduler(
			userId,
			createData
		);

	if (!schedulerEntity) {
		throw Error(ResponseCode.internalServerError.message);
	}

	return ProphetAnalyticsRequestSchedulerEntityUtils.toProphetAnalyticsRequestSchedulerData(
		schedulerEntity
	);
}

async function updateProphetAnalyticsRequestScheduler(
	userId: number,
	updateData: ProphetAnalyticsRequestSchedulerData
): Promise<ProphetAnalyticsRequestSchedulerData> {
	const validResult = ProphetAnalyticsRequestSchedulerDataUtils.validUpdateData(updateData);

	if (!validResult) {
		throw Error(ResponseCode.wrongParameter.message);
	}

	const schedulerEntity: number | undefined =
		await ProphetAnalyticsRequestSchedulerRepository.countAllByUserIdAndId(userId, updateData.id);

	if (!schedulerEntity) {
		throw Error(ResponseCode.notFound.message);
	}

	const updatedSchedulerEntity: ProphetAnalyticsRequestSchedulerEntity | null =
		await ProphetAnalyticsRequestSchedulerRepository.updateProphetAnalyticsRequestScheduler(
			userId,
			updateData
		);

	if (!updatedSchedulerEntity) {
		throw Error(ResponseCode.internalServerError.message);
	}

	return ProphetAnalyticsRequestSchedulerEntityUtils.toProphetAnalyticsRequestSchedulerData(
		updatedSchedulerEntity
	);
}

async function deleteProphetAnalyticsRequestScheduler(
	userId: number,
	schedulerId: number
): Promise<boolean> {
	return await ProphetAnalyticsRequestSchedulerRepository.deleteByUserIdAndId(userId, schedulerId);
}

/**
 * Private functions
 * @param userId
 * @param resultId
 */
async function getProphetAnalyticsResultItemDataList(
	userId: number,
	resultId: number
): Promise<ProphetAnalyticsResultItemData[]> {
	const resultItemEntities = await ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultId(
		userId,
		resultId
	);

	if (!resultItemEntities || resultItemEntities.length === 0) {
		return [];
	}

	return resultItemEntities
		.map((resultItemEntity) => {
			return ProphetAnalyticsResultItemEntityUtils.toProphetAnalyticsResultItemData(
				resultItemEntity
			);
		})
		.sort((a, b) => {
			return a.ds.localeCompare(b.ds);
		});
}

async function getMarketInfoEntities(
	marketCurrency: string,
	includeExclude: string,
	marketList: string[]
): Promise<MarketInfoEntity[]> {
	const marketInfoEntities = await MarketInfoRepository.findAllByMarketLike(marketCurrency);

	if (!marketInfoEntities || marketInfoEntities.length === 0) {
		return [];
	}

	if (ProphetAnalyticsSchedulerEnum.include.key === includeExclude) {
		return marketInfoEntities.filter((item) => {
			return marketList.includes(item.market);
		});
	}

	if (ProphetAnalyticsSchedulerEnum.exclude.key === includeExclude) {
		return marketInfoEntities.filter((item) => {
			return !marketList.includes(item.market);
		});
	}

	return marketInfoEntities;
}

async function getProphetAnalyticsResultItemListByResultId(
	resultItemEntities: ProphetAnalyticsResultItemEntity[]
): Promise<Record<number, ProphetAnalyticsResultItemData[]>> {
	
	return resultItemEntities.reduce(
		(
			acc: Record<number, ProphetAnalyticsResultItemData[]>,
			item: ProphetAnalyticsResultItemEntity
		): Record<number, ProphetAnalyticsResultItemData[]> => {
			if (!acc[item.result_id]) {
				acc[item.result_id] = [];
			}
			
			acc[item.result_id].push(
				ProphetAnalyticsResultItemEntityUtils.toProphetAnalyticsResultItemData(item)
			);
			
			return acc;
		},
		{} as Record<number, ProphetAnalyticsResultItemData[]>
	);
}
