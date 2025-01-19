import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import type { UCandleData } from '$lib/server/models/UPbitApiData';
import { MarketCandleDaysRepository } from '$lib/server/repository/MarketCandleDaysRepository';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { MarketCandleDaysEntityUtils } from '$lib/server/entities/MarketCandleDaysEntity';
import type { CandleData } from '$lib/common/models/CandleData';

export const MarketCandleDaysService = {
	updateMarketCandleDays: updateMarketCandleDays,
	getMarketCandleDays: getMarketCandleDays
};

async function updateMarketCandleDays(market: string) {
	const count = 200;
	const to = CurrentDateUtils.getTodayISOString();

	const resultCount = await MarketCandleDaysRepository.countAllByMarketAndCandleDateTimeUtc(
		market,
		to
	);

	if (resultCount > 0) {
		return await updateTodayMarketCandleDays(market);
	}

	let continueYn = true;
	let targetDateTime = CurrentDateUtils.getNowISOString();
	let totalCount = 0;

	while (continueYn) {
		const uCandleIData: UCandleData[] = await UPBitApi.getCandleDays(market, targetDateTime, count);

		if (uCandleIData.length === 0) {
			console.log('### createMarketCandleDays break uCandleIData is empty');
			continueYn = false;
			break;
		}

		targetDateTime = uCandleIData[uCandleIData.length - 1].candle_date_time_utc;

		totalCount = await MarketCandleDaysRepository.saveOrUpdate(market, uCandleIData);

		if (totalCount === 0) {
			continueYn = false;
			break;
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	return totalCount;
}

async function updateTodayMarketCandleDays(market: string): Promise<number> {
	const count = 10;
	const targetDateTime = '';

	const uCandleIData: UCandleData[] = await UPBitApi.getCandleDays(market, targetDateTime, count);

	if (uCandleIData.length > 0) {
		await MarketCandleDaysRepository.saveOrUpdate(market, uCandleIData);
	}

	return await MarketCandleDaysRepository.countAllByMarket(market);
}

async function getMarketCandleDays(
	market: string,
	to: string | null,
	count: number
): Promise<CandleData[]> {
	const result = await MarketCandleDaysRepository.findAllByMarket(market, to, count);

	if (result.length === 0) {
		return [];
	}

	return result.map((item) => {
		return MarketCandleDaysEntityUtils.toCandleData(item);
	});
}
