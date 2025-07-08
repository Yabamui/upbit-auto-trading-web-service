import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import type { ResponseObject } from '$lib/common/models/ResponseData';
import { WebApiRequestUtils } from '$lib/web/api/WebApiRequestUtils';

export const TickerWebApi = {
	getTicker: getTicker,
	getTickerAll: getTickerAll
};

async function getTicker(markets: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ markets });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.tickerMarketCode, params);

	return await WebApiRequestUtils.get(url);
}

async function getTickerAll(currencies: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ currencies });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.tickerCurrency, params);
	
	console.log(url);

	return await WebApiRequestUtils.get(url);
}
