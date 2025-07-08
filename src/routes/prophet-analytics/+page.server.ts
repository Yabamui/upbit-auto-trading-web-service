import { MarketCurrencyTypeUtils } from '$lib/common/enums/MarketCurrencyType';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';
import { ProphetAnalyticsService } from '$lib/server/service/ProphetAnalyticsService';

export const prerender = false;

export async function load({ url, cookies }) {
	const userId = cookies.get('user_id') || '0';

	const market = url.searchParams.get('code') || '';

	const marketCurrency = MarketCurrencyTypeUtils.getMarketCurrencyType(market);

	const result = await Promise.all([
		MarketInfoService.getAllMarketInfoList(),
		ProphetAnalyticsService.getProphetAnalyticsRequestConfigList(parseInt(userId), market)
	]);

	const marketInfoData: MarketInfoData | undefined =
		result[0].find((item) => item.market === market) || result[0][0];

	return {
		marketInfoData: marketInfoData,
		marketCurrency: marketCurrency?.code || '',
		marketInfoDataList: result[0],
		loggInYn: !!userId,
		requestConfigList: result[1]
	};
}
