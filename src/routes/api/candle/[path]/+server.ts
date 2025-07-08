import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { type CandleData } from '$lib/common/models/CandleData';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { CandleService } from '$lib/server/service/CandleService';
import type { IndicatorAnalyzeData } from '$lib/common/models/TechnicalIndicatorData';

/**
 * GET Request
 * @param params
 * @param url
 * @constructor
 */
export const GET = async ({ params, url }): Promise<Response> => {
	const path = params.path;

	if (ApiPathCode.candleList.path === path) {
		return await getCandleDataList(url);
	}

	if (ApiPathCode.candleSavedList.path === path) {
		return await getSavedCandleDataList(url);
	}
	
	if (ApiPathCode.candleSavedListByMarketCurrency.path === path) {
		return await getSavedCandleDataListByMarketCurrency(url);
	}
	
	if (ApiPathCode.candleTechnicalIndicatorAnalyze.path === path) {
		return await getCandleTechnicalIndicatorAnalyze(url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
};

async function getCandleDataList(url: URL) {
	const market = url.searchParams.get('market');
	const candleUnit = url.searchParams.get('candleUnit');
	const candleCount = url.searchParams.get('candleCount');
	const to = url.searchParams.get('to');

	if (!market || !candleUnit || !candleCount) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const candleDataList: CandleData[] = await CandleService.getCandleDataList(
		market,
		candleUnit,
		parseInt(candleCount),
		to || ''
	);

	return ResponseUtils.ok(candleDataList);
}

async function getSavedCandleDataList(url: URL) {
	const market = url.searchParams.get('market');
	const candleUnit = url.searchParams.get('candleUnit');
	const candleTimeZone = url.searchParams.get('candleTimeZone');
	const candleCount = url.searchParams.get('candleCount');
	const to = url.searchParams.get('to');

	if (!market || !candleUnit || !candleTimeZone) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const candleDataList: CandleData[] = await CandleService.getSavedCandleDataList(
		market,
		candleUnit,
		candleTimeZone,
		candleCount ? parseInt(candleCount) : 0,
		to || null,
	);

	return ResponseUtils.ok(candleDataList);
}

async function getSavedCandleDataListByMarketCurrency(url: URL) {
	const marketCurrency = url.searchParams.get('marketCurrency');
	const candleUnit = url.searchParams.get('candleUnit');
	const candleTimeZone = url.searchParams.get('candleTimeZone');
	const candleCount = url.searchParams.get('candleCount');
	const to = url.searchParams.get('to') || null;

	if (!marketCurrency || !candleUnit || !candleTimeZone || !candleCount) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const candleDataList: CandleData[] = await CandleService.getSavedCandleDataListByMarketCurrency(
		marketCurrency,
		candleUnit,
		candleTimeZone,
		Number(candleCount),
		to,
	);

	return ResponseUtils.ok(candleDataList);
}

async function getCandleTechnicalIndicatorAnalyze(url: URL) {
	const marketCurrency = url.searchParams.get('marketCurrency');
	
	if (!marketCurrency) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}
	
	const indicatorAnalyzeDataList: IndicatorAnalyzeData[] = await CandleService.getCandleTechnicalIndicatorAnalyze(
		marketCurrency,
	);
	
	return ResponseUtils.ok(indicatorAnalyzeDataList);
}
