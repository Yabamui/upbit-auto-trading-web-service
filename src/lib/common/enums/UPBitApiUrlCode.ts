export const UPBitApiUrlCode = {
	marketAll: {
		url: 'https://api.upbit.com/v1/market/all',
		title: '종목 코드 조회',
		description: '업비트에서 거래 가능한 종목 목록'
	},
	ticker: {
		url: 'https://api.upbit.com/v1/ticker',
		title: '종목 단위 현재가 정보',
		description: '요청 당시 종목의 스냅샷을 반환한다.'
	},
	tickerAll: {
		url: 'https://api.upbit.com/v1/ticker/all',
		title: '마켓 단위 현재가 정보',
		description: '마켓 단위 종목들의 스냅샷을 반환한다.'
	},
	candleSeconds: {
		url: 'https://api.upbit.com/v1/candles/seconds',
		title: '초(Second) 캔들',
		description: '초 단위로 봉 데이터를 반환한다'
	},
	candleMinutes: {
		url: 'https://api.upbit.com/v1/candles/minutes/{unit}',
		title: '분(Minute) 캔들',
		description: '분 단위로 봉 데이터를 반환한다.(분 단위. 가능한 값 : 1, 3, 5, 15, 10, 30, 60, 240)'
	},
	candleDays: {
		url: 'https://api.upbit.com/v1/candles/days',
		title: '일(Day) 캔들',
		description: '일 단위로 봉 데이터를 반환한다.'
	},
	candleWeeks: {
		url: 'https://api.upbit.com/v1/candles/weeks',
		title: '주(Week) 캔들',
		description: '주 단위로 봉 데이터를 반환한다.'
	},
	candleMonths: {
		url: 'https://api.upbit.com/v1/candles/months',
		title: '월(Month) 캔들',
		description: '월 단위로 봉 데이터를 반환한다.'
	},
	candleYears: {
		url: 'https://api.upbit.com/v1/candles/years',
		title: '년(Year) 캔들',
		description: '년 단위로 봉 데이터를 반환한다.'
	},
	orderBook: {
		url: 'https://api.upbit.com/v1/orderbook',
		title: '호가 정보',
		description: '호가 정보 조회 (원화마켓만 지원)',
	},
	orderBookSupportedLevels: {
		url: 'https://api.upbit.com/v1/orderbook/supported_levels',
		title: '호가 모아보기 단위 정보 조회',
		description: '호가 모아보기 단위 정보 조회 (원화마켓만 지원)',
	}
};

export type UPBitApiUrlCode = (typeof UPBitApiUrlCode)[keyof typeof UPBitApiUrlCode];

export const UPBitApiUrlCodeUtils = {
	getUrl: (apiUrlCode: UPBitApiUrlCode, params: string = '') => {
		if (params) {
			return `${apiUrlCode.url}?${params}`;
		}
		
		return apiUrlCode.url;
	},
	getUrlWithUnit: (apiUrlCode: UPBitApiUrlCode, unit: number, params: string = '') => {
		const url = apiUrlCode.url.replace('{unit}', unit.toString());
		
		if (params) {
			return `${url}?${params}`;
		}
		
		return url;
	}
};
