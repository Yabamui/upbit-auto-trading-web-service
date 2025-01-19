import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { type CandleData } from '$lib/common/models/CandleData';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { MarketCandleDaysService } from '$lib/server/service/MarketCandleDaysService';
import { CandleService } from '$lib/server/service/CandleService';

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

	return ResponseUtils.error(ResponseCode.wrongParameter);
};

async function getCandleDataList(url: URL) {
	const market = url.searchParams.get('market');
	const candleType = url.searchParams.get('candleType');
	const candleCount = url.searchParams.get('candleCount');
	const to = url.searchParams.get('to');

	if (!market || !candleType || !candleCount) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const candleDataList: CandleData[] = await CandleService.getCandleDataList(
		market,
		candleType,
		parseInt(candleCount),
		to || ''
	);

	return ResponseUtils.ok(candleDataList);
}

/**
 * POST Request
 * @param params
 * @param request
 * @constructor
 */
export async function POST({ params, request }) {
	const path = params.path;

	if (ApiPathCode.candleDaysUpdate.path === path) {
		return await candleDaysUpdate(request);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function candleDaysUpdate(request: Request) {
	const { market } = await request.json();

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await MarketCandleDaysService.updateMarketCandleDays(market);

	return ResponseUtils.ok(result);
}
