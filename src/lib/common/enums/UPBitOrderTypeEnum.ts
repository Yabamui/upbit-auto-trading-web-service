export const UPBitOrderTypeEnum = {
	LIMIT: {
		key: 'limit',
		value: '지정가 주문'
	},
	PRICE: {
		key: 'price',
		value: '시장가 주문(매수)'
	},
	MARKET: {
		key: 'market',
		value: '시장가 주문(매도)'
	},
	BEST: {
		key: 'best',
		value: '최유리 주문 (time_in_force 설정 필수)'
	}
};