import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';
import { MarketInfoRepository } from '$lib/server/repository/MarketInfoRepository';
import { MarketInfoDataUtils } from '$lib/common/models/MarketInfoData';
import { UPBitApi } from '$lib/server/external-api/UPBitApi';

export const MarketInfoService = {
	getAllMarketInfoList: getAllMarketInfoList,
	getMarketInfoListByMarketCurrency: getMarketInfoListByMarketCurrency,
	getMarketInfo: getMarketInfo
};

async function getAllMarketInfoList() {
	const marketInfoEntityList: MarketInfoEntity[] = await MarketInfoRepository.findAllBy();

	if (marketInfoEntityList.length > 0) {
		return marketInfoEntityList.map((item) => MarketInfoDataUtils.toMarketInfoData(item));
	}

	const response = await UPBitApi.getMarketList();

	if (response.length === 0) {
		return [];
	}

	const resultEntities = await MarketInfoRepository.saveAll(response);

	return resultEntities.map((item) => MarketInfoDataUtils.toMarketInfoData(item));
}

async function getMarketInfoListByMarketCurrency(marketCurrency: string) {
	const marketInfoEntityList: MarketInfoEntity[] =
		await MarketInfoRepository.findAllByMarketLike(marketCurrency);
	
	if (!marketInfoEntityList.length) {
		return [];
	}
	
	return marketInfoEntityList.map((item) =>
		MarketInfoDataUtils.toMarketInfoData(item)
	);
}

async function getMarketInfo(market: string) {
	const marketInfoEntity: MarketInfoEntity | null =
		await MarketInfoRepository.findTopByMarket(market);

	if (!marketInfoEntity) {
		return null;
	}

	return MarketInfoDataUtils.toMarketInfoData(marketInfoEntity);
}
