import { error } from '@sveltejs/kit';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';

export const load = async ({ url }) => {
	console.log('trade server load');
	const code = url.searchParams.get('code');

	if (!code) {
		throw error(ResponseCode.wrongParameter.status, {
			errorId: '',
			code: ResponseCode.wrongParameter.code,
			message: ResponseCode.wrongParameter.message
		});
	}

	const marketInfoList = await MarketInfoService.getAllMarketInfoList();

	const marketInfo = marketInfoList.find((item) => item.market === code);

	return {
		marketInfoList: marketInfoList,
		marketInfo: marketInfo
	};
};
