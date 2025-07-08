export const ProphetAnalyticsPriceTypeEnum = {
	CLOSE_PRICE: {
		key: 'CLOSE_PRICE',
		value: '종가'
	},
	CLOSE_PRICE_RATE: {
		key: 'CLOSE_PRICE_RATE',
		value: '종가 변동률'
	}
}


export const ProphetAnalyticsPriceTypeEnumUtils = {
	existYn: (keyList: string[]): boolean => {
		if (!keyList || keyList.length === 0) {
			return false;
		}

		const priceTypeKeyList = Object.values(ProphetAnalyticsPriceTypeEnum)
			.map((item) => item.key);
		
		return keyList.every((key) => priceTypeKeyList.includes(key));
	}
}