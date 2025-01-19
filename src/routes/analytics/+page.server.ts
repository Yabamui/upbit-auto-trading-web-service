import type { AiModelData } from '$lib/common/models/AiModelData';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';

export async function load() {
	const aiModelDataList: AiModelData[] = await AiAnalyticsService.getAiModelList();

	const marketInfoDataList = await MarketInfoService.getAllMarketInfoList();

	return {
		aiModelDataList,
		marketInfoDataList
	};
}
