import { MarketCurrencyCode } from '$lib/common/enums/MarketCurrencyType';
import { type TickerData, TickerDataUtils } from '$lib/common/models/TickerData';
import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import { RedisService } from '$lib/server/service/RedisService';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';
import type { CandleData } from '$lib/common/models/CandleData';
import { CandleService } from '$lib/server/service/CandleService';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import type { IndicatorAnalyzeData } from '$lib/common/models/TechnicalIndicatorData';

export const BatchService = {
	executeUpdateMarketCurrencyTickerToRedis: executeUpdateMarketCurrencyTickerToRedis,
	executeCreateAnalyzeTechnicalIndicatorToRedis: executeCreateAnalyzeTechnicalIndicatorToRedis
};

async function executeUpdateMarketCurrencyTickerToRedis(): Promise<void> {
	const keyPrefix = 'TICKER_';
	const expire = 60;

	const marketCurrencyList = [
		MarketCurrencyCode.KRW.code,
		MarketCurrencyCode.BTC.code,
		MarketCurrencyCode.USDT.code
	];

	for (const marketCurrency of marketCurrencyList) {
		const tickerList = await getTickerByUPBitApi(marketCurrency);

		await RedisService.set(keyPrefix + marketCurrency, JSON.stringify(tickerList), expire);
	}
}

async function getTickerByUPBitApi(marketCurrency: string): Promise<TickerData[]> {
	const response = await UPBitApi.getTickerAll(marketCurrency);

	if (response?.length === 0) {
		return [];
	}

	return response.map((item) => TickerDataUtils.toTickerData(item));
}

async function executeCreateAnalyzeTechnicalIndicatorToRedis(): Promise<void> {
	const keyPrefix = 'TECHNICAL_INDICATOR_';
	const expire = 60;
	const marketCurrency = 'KRW';
	const to: string | null = null;

	const marketList: MarketInfoData[] =
		await MarketInfoService.getMarketInfoListByMarketCurrency(marketCurrency);

	if (marketList.length === 0) {
		return;
	}

	const candleList: CandleData[] = await CandleService.getSavedCandleDataListByMarketCurrency(
		marketCurrency,
		UPBitCandleUnitEnum.days.key,
		UPBitCandleTimeZones.utc,
		300,
		to
	);

	if (candleList.length === 0) {
		return;
	}

	const candleListByMarket: Record<string, CandleData[]> = candleList.reduce(
		(acc, candle) => {
			const market = candle.market;
			if (!acc[market]) {
				acc[market] = [];
			}
			acc[market].push(candle);
			return acc;
		},
		{} as Record<string, CandleData[]>
	);

	const resultList: IndicatorAnalyzeData[] = await Promise.all(
		marketList.map(async (marketData) => {
			const candleList: CandleData[] = candleListByMarket[marketData.market] || [];

			return CandleService.createCandleTechnicalIndicatorAnalyze(marketData, candleList);
		})
	);

	if (resultList.length === 0) {
		return;
	}

	await RedisService.set(keyPrefix + marketCurrency, JSON.stringify(resultList), expire);
}
