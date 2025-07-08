import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { ResponseObject } from '$lib/common/models/ResponseData';
import { WebApiRequestUtils } from '$lib/web/api/WebApiRequestUtils';

export const MarketInfoWebApi = {
	getMarketInfo: getMarketInfo,
	getAllMarketInfoList: getAllMarketInfoList
};

async function getMarketInfo(code: string): Promise<ResponseObject<MarketInfoData | null>> {
	const params = await CurrentStringUtils.generateQueryParam({ code });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.marketInfo, params);

	return await WebApiRequestUtils.get(url);
}

async function getAllMarketInfoList(): Promise<ResponseObject<MarketInfoData[]>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.marketAll);

	return await WebApiRequestUtils.get(url);
}
