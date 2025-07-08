import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { ResponseObject } from '$lib/common/models/ResponseData';
import { WebApiRequestUtils } from '$lib/web/api/WebApiRequestUtils';

export const CandleWebApi = {
	getCandleList: getCandleList,
	getSavedCandleList: getSavedCandleList
};

async function getCandleList(
	market: string,
	candleType: string,
	candleCount: number,
	to: string
): Promise<ResponseObject<unknown>> {
	
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		candleType,
		candleCount,
		to
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleList, params);

	return await WebApiRequestUtils.get(url);
}

async function getSavedCandleList(
	market: string,
	candleType: string,
	candleTimeZone: string,
	candleCount: number,
	to: string
): Promise<ResponseObject<unknown>> {
	
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		candleType,
		candleTimeZone,
		candleCount,
		to
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.candleSavedList, params);

	return await WebApiRequestUtils.get(url);
}