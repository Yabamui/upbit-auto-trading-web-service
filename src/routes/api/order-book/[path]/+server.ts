import { ApiPathCode } from '$lib/common/enums/ApiPathCode';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { OutBookService } from '$lib/server/service/OutBookService';
import type {
	OrderBookData,
	OrderBookSupportedLevelData
} from '$lib/common/models/OrderBookData';

export async function GET({ url, params }) {
	const path = params.path;

	if (ApiPathCode.orderBook.path === path) {
		return await getOrderBook(url);
	}

	if (ApiPathCode.orderBookSupportedLevel.path === path) {
		return await getOrderBookSupportedLevel(url);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function getOrderBook(url: URL): Promise<Response> {
	const market = url.searchParams.get('market');
	const level = url.searchParams.get('level');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const levelNumber: number = level ? parseInt(level) : 0;

	const orderBook: OrderBookData | null = await OutBookService.getOutBook(market, levelNumber);

	if (!orderBook) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	return ResponseUtils.ok(orderBook);
}

async function getOrderBookSupportedLevel(url: URL): Promise<Response> {
	const market = url.searchParams.get('market');

	if (!market) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const orderBookSupportedLevelList: OrderBookSupportedLevelData[] =
		await OutBookService.getOrderBookSupportedLevel(market);

	return ResponseUtils.ok(orderBookSupportedLevelList);
}
