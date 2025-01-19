import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { UPBitApiUrlCode, UPBitApiUrlCodeUtils } from '$lib/common/enums/UPBitApiUrlCode';
import type { UCandleData, UMarketData, UTickerData } from '$lib/server/models/UPbitApiData';
import axios from 'axios';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export const UPBitApi = {
	getMarketList: getMarketList,
	getTickerAll: getTickerAll,
	getTicker: getTicker,
	getCandleSeconds: getCandleSeconds,
	getCandleMinutes: getCandleMinutes,
	getCandleDays: getCandleDays,
	getCandleWeeks: getCandleWeeks,
	getCandleMonths: getCandleMonths,
	getCandleYears: getCandleYears
};

async function getMarketList(): Promise<UMarketData[] | []> {
	const params = await CurrentStringUtils.generateQueryParam({ is_details: true });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.marketAll, params);

	return await requestGET(url);
}

async function getTickerAll(currencies: string): Promise<UTickerData[] | []> {
	const params = await CurrentStringUtils.generateQueryParam({ quote_currencies: currencies });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.tickerAll, params);

	return await requestGET(url);
}

async function getTicker(markets: string): Promise<UTickerData[] | []> {
	const params = await CurrentStringUtils.generateQueryParam({ markets });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.ticker, params);

	return await requestGET(url);
}

async function getCandleSeconds(
	market: string,
	to: string,
	count: number
): Promise<UCandleData[]> {
	const params = await CurrentStringUtils.generateQueryParam({ market, count, to });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.candleSeconds, params);

	return await requestGET(url);
}

async function getCandleMinutes(
	unit: number | undefined,
	market: string,
	to: string,
	count: number
): Promise<UCandleData[]> {
	if (!unit) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} ### UPBitApi.getCandleMinutes Error: unit is undefined`
		);
		return [];
	}

	const params = await CurrentStringUtils.generateQueryParam({ market, count, to });

	const url = UPBitApiUrlCodeUtils.getUrlWithUnit(UPBitApiUrlCode.candleMinutes, unit, params);

	return await requestGET(url);
}

async function getCandleDays(market: string, to: string, count: number): Promise<UCandleData[]> {
	const params = await CurrentStringUtils.generateQueryParam({ market, to, count });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.candleDays, params);

	return await requestGET(url);
}

async function getCandleWeeks(market: string, to: string, count: number): Promise<UCandleData[]> {
	const params = await CurrentStringUtils.generateQueryParam({ market, to, count });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.candleWeeks, params);

	return await requestGET(url);
}

async function getCandleMonths(market: string, to: string, count: number): Promise<UCandleData[]> {
	const params = await CurrentStringUtils.generateQueryParam({ market, to, count });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.candleMonths, params);

	return await requestGET(url);
}

async function getCandleYears(market: string, to: string, count: number): Promise<UCandleData[]> {
	const params = await CurrentStringUtils.generateQueryParam({ market, to, count });

	const url = UPBitApiUrlCodeUtils.getUrl(UPBitApiUrlCode.candleYears, params);

	return await requestGET(url);
}

async function requestGET(url: string) {
	return axios
		.get(url)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			if (error.response?.data) {
				console.error(`### UPBitApi.requestGET Error: ${JSON.stringify(error.response.data)}`);
			} else {
				console.error(`### UPBitApi.requestGET Error: ${error}`);
			}

			return [];
		});
}
