import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import {
	type UOrderBookData,
	type UOrderBookSupportedLevelData,
	UPbitApiDataUtils
} from '$lib/server/models/UPbitApiData';
import type { OrderBookData, OrderBookSupportedLevelData } from '$lib/common/models/OrderBookData';

export const OutBookService = {
	getOutBook: getOutBook,
	getOrderBookSupportedLevel: getOrderBookSupportedLevel
};

async function getOutBook(market: string, level: number = 0): Promise<OrderBookData | null> {
	const uOrderBookDataList: UOrderBookData[] = await UPBitApi.getOrderBook(market, level);

	if (!uOrderBookDataList || uOrderBookDataList.length === 0) {
		return null;
	}

	const uOrderBookData = uOrderBookDataList.find((item) => item.market === market);

	if (!uOrderBookData) {
		return null;
	}

	return UPbitApiDataUtils.toOrderBookData(uOrderBookData);
}

async function getOrderBookSupportedLevel(market: string): Promise<OrderBookSupportedLevelData[]> {
	const uOrderBookSupportedLevel: UOrderBookSupportedLevelData[] =
		await UPBitApi.getOrderBookSupportedLevel(market);

	if (!uOrderBookSupportedLevel) {
		return [];
	}

	return uOrderBookSupportedLevel.map((item) => {
		return UPbitApiDataUtils.toOrderBookSupportedLevelData(item);
	});
}
