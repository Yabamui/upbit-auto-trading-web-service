import { type MarketInfoData } from '$lib/common/models/MarketInfoData';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';

export const GET = async ({ params, url }) => {
	const path = params.path;

	if (path === ApiPathCode.marketAll.path) {
		return await getAllMarketInfoList();
	}

	if (path === ApiPathCode.marketInfo.path) {
		return await getMarketInfo(url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
};

async function getAllMarketInfoList() {
	const marketInfoDataList = await MarketInfoService.getAllMarketInfoList();

	return ResponseUtils.ok(marketInfoDataList);
}

async function getMarketInfo(url: URL) {
	const code = url.searchParams.get('code');

	if (!code) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const marketInfoData: MarketInfoData | null = await MarketInfoService.getMarketInfo(code);

	if (!marketInfoData) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(marketInfoData);
}
