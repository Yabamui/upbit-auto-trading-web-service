import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import { type TickerData, TickerDataUtils } from '$lib/common/models/TickerData';
import { RedisService } from '$lib/server/service/RedisService';

export const TickerService = {
	getTickerListByMarketCurrency: getTickerListByMarketCurrency,
};

async function getTickerListByMarketCurrency(marketCurrency: string): Promise<TickerData[]> {
	const tickerList = await getTickerListByRedis(marketCurrency);

	if (tickerList.length > 0) {
		return tickerList;
	}

	const response = await UPBitApi.getTickerAll(marketCurrency);

	if (response?.length === 0) {
		return [];
	}

	return response.map((item) => TickerDataUtils.toTickerData(item));
}

async function getTickerListByRedis(marketCurrency: string): Promise<TickerData[]> {
	const redisKey = `TICKER_${marketCurrency}`;

	const result = await RedisService.get(redisKey);

	if (!result) {
		return [];
	}

	return JSON.parse(result) as TickerData[];
}
