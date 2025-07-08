import { ResponseCode } from '$lib/common/enums/ResponseCode';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';
import { error } from '@sveltejs/kit';

export const prerender = false; // Disable prerendering since this page depends on URL search parameters

export const load = async ({ url, cookies }) => {
	const market: string = url.searchParams.get('code') || '';
	const userId: string = cookies.get('user_id') || '';

	if (!market) {
		throw error(ResponseCode.wrongParameter.status, {
			errorId: '',
			code: ResponseCode.wrongParameter.code,
			message: ResponseCode.wrongParameter.message
		});
	}

	const marketInfoDataList: MarketInfoData[] = await MarketInfoService.getAllMarketInfoList();

	const marketInfoData: MarketInfoData | undefined = marketInfoDataList.find(
		(item) => item.market === market
	);

	if (!marketInfoData) {
		throw error(ResponseCode.notFound.status, {
			errorId: '',
			code: ResponseCode.notFound.code,
			message: ResponseCode.notFound.message
		});
	}

	return {
		loginYn: !!userId,
		marketInfoList: marketInfoDataList,
		marketInfo: marketInfoData
	};
};
