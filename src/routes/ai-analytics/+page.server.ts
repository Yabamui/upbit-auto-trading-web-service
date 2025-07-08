import type { AiModelData } from '$lib/common/models/AiModelData';
import type { AiPromptsData } from '$lib/common/models/AiPromptsData';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';

export const prerender = false;

export async function load({ url, cookies }) {
	const userId: string = cookies.get('user_id') || '';
	const market: string = url.searchParams.get('code') || '';

	if (!market) {
		throw new Error('Market code is required');
	}

	const marketInfoDataList: MarketInfoData[] = await MarketInfoService.getAllMarketInfoList();

	const marketInfoData: MarketInfoData | undefined = marketInfoDataList.find(
		(item) => item.market === market
	);

	if (!marketInfoData) {
		throw new Error('MarketInfoData not found');
	}

	const aiModelDataList: AiModelData[] = await AiAnalyticsService.getAiModelList();

	const aiPromptsDataList: AiPromptsData[] = await AiAnalyticsService.getAiPromptsList(
		Number(userId),
		0
	);

	return {
		market: market,
		marketInfoData: marketInfoData,
		marketInfoDataList: marketInfoDataList,
		aiModelDataList: aiModelDataList,
		aiPromptsDataList: aiPromptsDataList
	};
}
