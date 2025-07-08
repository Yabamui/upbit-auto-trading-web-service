import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';
import type { ResponseObject } from '$lib/common/models/ResponseData';

export const OrderBookWebApi = {
	getOrderBook: getOrderBook,
	getOrderBookSupportedLevel: getOrderBookSupportedLevel
};

async function getOrderBook(market: string, level: number = 0): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		level
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.orderBook, params);

	return await WebApiRequestUtils.get(url);
}

async function getOrderBookSupportedLevel(market: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		market
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.orderBookSupportedLevel, params);

	return await WebApiRequestUtils.get(url);
}
