import { json } from '@sveltejs/kit';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { ResponseObject } from '$lib/common/models/ResponseData';
import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { TickerDataUtils } from '$lib/common/models/TickerData';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';

export const GET = async ({ params, url }) => {
	const path = params.path;

	if (path === ApiPathCode.tickerCurrency.path) {
		return await getTickerListByMarketCurrency(url);
	}

	if (path === ApiPathCode.tickerMarketCode.path) {
		return await getTickerListByMarketCodeList(url);
	}

	return json(ResponseObject.of(ResponseCode.wrongParameter), {
		status: ResponseCode.wrongParameter.status
	});
};

async function getTickerListByMarketCurrency(url: URL) {
	const currencies = url.searchParams.get('currencies');

	if (!currencies) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const response = await UPBitApi.getTickerAll(currencies);
	
	if (response?.length === 0) {
		return ResponseUtils.error(ResponseCode.notFound, []);
	}

	const tickerList = response.map((item) => TickerDataUtils.toTickerData(item));

	return ResponseUtils.ok(tickerList);
}

async function getTickerListByMarketCodeList(url: URL) {
	const markets = url.searchParams.get('markets');

	if (!markets) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const response = await UPBitApi.getTicker(markets);

	if (response?.length === 0) {
		return ResponseUtils.error(ResponseCode.notFound, []);
	}

	const tickerList = response.map((item) => TickerDataUtils.toTickerData(item));

	return ResponseUtils.ok(tickerList);
}
