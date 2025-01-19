export const MarketCurrencyCode = {
	KRW: {
		code: 'KRW',
		name: '원화',
	},
	BTC: {
		code: 'BTC',
		name: 'BTC',
	},
	USDT: {
		code: 'USDT',
		name: 'USDT',
	},
} as const;

export const MarketCurrencyTypeUtils = {
	getMarketCurrencyType: (marketCode: string) => {
		if (marketCode.startsWith(MarketCurrencyCode.KRW.code)) {
			return MarketCurrencyCode.KRW;
		}
		
		if (marketCode.startsWith(MarketCurrencyCode.BTC.code)) {
			return MarketCurrencyCode.BTC;
		}
		
		if (marketCode.startsWith(MarketCurrencyCode.USDT.code)) {
			return MarketCurrencyCode.USDT;
		}
		
		return null;
	},
	getMainCurrencyTypeList: () => {
		return [
			MarketCurrencyCode.KRW,
			MarketCurrencyCode.BTC,
			MarketCurrencyCode.USDT,
		];
	}
}