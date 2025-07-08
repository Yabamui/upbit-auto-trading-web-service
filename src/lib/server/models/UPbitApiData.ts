import type { OrderBookData, OrderBookSupportedLevelData } from '$lib/common/models/OrderBookData';

export interface UMarketData {
	market: string;
	korean_name: string;
	english_name: string;
	market_event: UMarketEvent;
}

export interface UMarketEvent {
	warning: boolean;
	caution: UMarketCaution;
}

export interface UMarketCaution {
	PRICE_FLUCTUATIONS: boolean;
	TRADING_VOLUME_SOARING: boolean;
	DEPOSIT_AMOUNT_SOARING: boolean;
	GLOBAL_PRICE_DIFFERENCES: boolean;
	CONCENTRATION_OF_SMALL_ACCOUNTS: boolean;
}

export interface UTickerData {
	market: string;
	trade_date: string;
	trade_time: string;
	trade_date_kst: string;
	trade_time_kst: string;
	trade_timestamp: number;
	opening_price: number;
	high_price: number;
	low_price: number;
	trade_price: number;
	prev_closing_price: number;
	change: string;
	change_price: number;
	change_rate: number;
	signed_change_price: number;
	signed_change_rate: number;
	trade_volume: number;
	acc_trade_price: number;
	acc_trade_price_24h: number;
	acc_trade_volume: number;
	acc_trade_volume_24h: number;
	highest_52_week_price: number;
	highest_52_week_date: string;
	lowest_52_week_price: number;
	lowest_52_week_date: string;
	timestamp: number;
}

export interface UCandleData {
	timestamp: number;
	market: string;
	candle_date_time_utc: string;
	candle_date_time_kst: string;
	opening_price: number;
	high_price: number;
	low_price: number;
	trade_price: number;
	candle_acc_trade_price: number;
	candle_acc_trade_volume: number;
	prev_closing_price: number | undefined;
	change_price: number | undefined;
	change_rate: number | undefined;
	unit: number | undefined;
	converted_trade_price: number | undefined;
	first_day_of_period: string | undefined;
	error: UErrorData | undefined;
}

export interface UOrderBookData {
	market: string;
	timestamp: number;
	total_ask_size: number;
	total_bid_size: number;
	orderbook_units: UOrderBookUnitData[];
	level: number;
}

export interface UOrderBookUnitData {
	ask_price: number;
	bid_price: number;
	ask_size: number;
	bid_size: number;
}

export interface UOrderBookSupportedLevelData {
	market: string;
	supported_levels: number[];
}

export interface UAccountData {
	// 화폐를 의미하는 영문 대문자 코드
	currency: string;
	// 주문가능 금액/수량
	balance: string;
	// 주문 중 묶여있는 금액/수량
	locked: string;
	// 매수평균가
	avg_buy_price: string;
	// 매수평균가 수정 여부
	avg_buy_price_modified: boolean;
	// 평단가 기준 화폐
	unit_currency: string;
}

export interface UOrderChanceData {
	// 매수 수수료 비율
	bid_fee: string;
	// 매도 수수료 비율
	ask_fee: string;
	maker_bid_fee: string;
	maker_ask_fee: string;
	// 마켓에 대한 정보
	market: UOrderChanceMarketData;
	// 매수 시 사용하는 화폐의 계좌 상태
	bid_account: UOrderChanceAccountData;
	// 매도 시 사용하는 화폐의 계좌 상태
	ask_account: UOrderChanceAccountData;
}

export interface UOrderChanceMarketData {
	// 마켓의 유일 키
	id: string;
	// 마켓 이름
	name: string;
	// 지원 주문 방식 (만료)
	order_types: string[];
	// 지원 주문 종류
	order_sides: string[];
	// 매수 주문 지원 방식
	bid_types: string[];
	// 매도 주문 지원 방식
	ask_types: string[];
	// 매수 시 제약 사항
	bid: UOrderChanceMarketConstraintData;
	// 매도 시 제약 사항
	ask: UOrderChanceMarketConstraintData;
	// 최대 매도/매수 금액
	max_total: string;
	// 마켓 운영 상태
	state: string;
}

export interface UOrderChanceMarketConstraintData {
	// 화폐를 의미하는 영문 대문자 코드
	currency: string;
	// 최소 매도/매수 금액
	min_total: string;
}

export interface UOrderChanceAccountData {
	// 화폐를 의미하는 영문 대문자 코드
	currency: string;
	// 주문가능 금액/수량
	balance: string;
	// 주문 중 묶여있는 금액/수량
	locked: string;
	// 매수평균가
	avg_buy_price: string;
	// 매수평균가 수정 여부
	avg_buy_price_modified: boolean;
	// 평단가 기준 화폐
	unit_currency: string;
}

export interface UOrderData {
	// 주문의 고유 아이디
	uuid: string;
	// 주문 종류
	side: string;
	// 주문 방식 - limit : 지정가 주문, price : 시장가 주문(매수), market : 시장가 주문(매도), best : 최유리 주문
	ord_type: string;
	// 주문 당시 화폐 가격
	price: string;
	// 주문 상태
	state: string;
	// 마켓 ID
	market: string;
	// 주문 생성 시간
	created_at: string;
	// 사용자가 입력한 주문 양
	volume: string;
	// 체결 후 남은 주문 양
	remaining_volume: string;
	// 수수료로 예약된 비용
	reserved_fee: string;
	// 남은 수수료
	remaining_fee: string;
	// 사용된 수수료
	paid_fee: string;
	// 거래에 사용 중인 비용
	locked: string;
	// 체결된 양
	executed_volume: string;
	// 현재까지 체결된 금액
	executed_funds: string;
	// 해당 주문에 걸린 체결 수
	trades_count: number;
	// IOC, FOK 설정 - IOC : Immediate or Cancel, FOK : Fill or Kill
	time_in_force: string;
	// 조회용 사용자 지정값 *identifier 필드는 2024-10-18 이후에 생성된 주문에 대해서 만 제공합니다.
	identifier: string;
	// 체결 내역 - 개별 주문 조회 API를 통해서만 확인 가능
	trades: UOrderTradeData[];
}

export interface UOrderTradeData {
	// 마켓의 유일 키
	market: string;
	// 체결의 고유 아이디
	uuid: string;
	// 체결 가격
	price: string;
	// 체결 양
	volume: string;
	// 체결된 총 가격
	funds: string;
	
	trend: string;
	// 체결 시각
	created_at: string;
	// 체결 종류
	side: string;
	// IOC, FOK 설정 - IOC : Immediate or Cancel, FOK : Fill or Kill
	time_in_force: string;
}

export interface UErrorData {
	error: {
		message: string;
		name: string;
	};
}

export const UPbitApiDataUtils = {
	toOrderBookData: (uOrderBookData: UOrderBookData): OrderBookData => {
		return {
			market: uOrderBookData.market,
			timestamp: uOrderBookData.timestamp,
			totalAskSize: uOrderBookData.total_ask_size,
			totalBidSize: uOrderBookData.total_bid_size,
			orderBookUnitList: uOrderBookData.orderbook_units.map(
				(uOrderBookUnitData: UOrderBookUnitData) => {
					return {
						askPrice: uOrderBookUnitData.ask_price,
						bidPrice: uOrderBookUnitData.bid_price,
						askSize: uOrderBookUnitData.ask_size,
						bidSize: uOrderBookUnitData.bid_size
					};
				}
			)
		} as OrderBookData;
	},
	toOrderBookSupportedLevelData: (
		uOrderBookSupportedLevelData: UOrderBookSupportedLevelData
	): OrderBookSupportedLevelData => {
		return {
			market: uOrderBookSupportedLevelData.market,
			supportedLevelList: uOrderBookSupportedLevelData.supported_levels
		};
	}
};
