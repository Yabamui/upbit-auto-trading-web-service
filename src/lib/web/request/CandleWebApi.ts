import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { ResponseObject } from '$lib/common/models/ResponseData';
import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';

export const CandleWebApi = {
	getCandleList: getCandleList,
	getSavedCandleList: getSavedCandleList,
	getSavedCandleListByMarketCurrency: getSavedCandleListByMarketCurrency,
	getCandleTechnicalIndicatorAnalyze: getCandleTechnicalIndicatorAnalyze
};

async function getCandleList(
	market: string,
	candleUnit: string,
	candleCount: number,
	to: string
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		candleUnit,
		candleCount,
		to
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleList, params);

	return await WebApiRequestUtils.get(url);
}

async function getSavedCandleList(
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	candleCount: number,
	to: string
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		candleUnit,
		candleTimeZone,
		candleCount,
		to
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleSavedList, params);

	return await WebApiRequestUtils.get(url);
}

async function getSavedCandleListByMarketCurrency(
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string,
	candleCount: number,
	to: string | null
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		marketCurrency,
		candleUnit,
		candleTimeZone,
		candleCount,
		to
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleSavedListByMarketCurrency, params);

	return await WebApiRequestUtils.get(url);
}

async function getCandleTechnicalIndicatorAnalyze(
	marketCurrency: string,
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		marketCurrency,
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleTechnicalIndicatorAnalyze, params);

	return await WebApiRequestUtils.get(url);
}
