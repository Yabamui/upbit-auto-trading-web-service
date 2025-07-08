import type { UTickerData } from '$lib/server/models/UPbitApiData';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';

export interface TickerData {
	market: string;
	tradeDate: string;
	tradeTime: string;
	tradeDateKst: string;
	tradeTimeKst: string;
	tradeTimestamp: number;
	openingPrice: number;
	highPrice: number;
	lowPrice: number;
	tradePrice: number;
	prevClosingPrice: number;
	change: string;
	changePrice: number;
	changeRate: number;
	signedChangePrice: number;
	signedChangeRate: number;
	tradeVolume: number;
	accTradePrice: number;
	accTradePrice24h: number;
	accTradeVolume: number;
	accTradeVolume24h: number;
	highest52WeekPrice: number;
	highest52WeekDate: string;
	lowest52WeekPrice: number;
	lowest52WeekDate: string;
	timestamp: number;
}

export interface TickerCalculationData {
	market: string;
	koreanName: string;
	englishName: string;
	decimalDepth: number;
	
	openingPrice: number;
	highPrice: number;
	lowPrice: number;
	tradePrice: number;
	diffRate: number;
	diffPrice: number;
	accTradePrice: number;
	accTradePrice24h: number;
	accTradeVolume: number;
	accTradeVolume24h: number;
}

export const TickerDataUtils = {
	toTickerData: (uTickerData: UTickerData): TickerData => ({
		market: uTickerData.market,
		tradeDate: uTickerData.trade_date,
		tradeTime: uTickerData.trade_time,
		tradeDateKst: uTickerData.trade_date_kst,
		tradeTimeKst: uTickerData.trade_time_kst,
		tradeTimestamp: uTickerData.trade_timestamp,
		openingPrice: uTickerData.opening_price,
		highPrice: uTickerData.high_price,
		lowPrice: uTickerData.low_price,
		tradePrice: uTickerData.trade_price,
		prevClosingPrice: uTickerData.prev_closing_price,
		change: uTickerData.change,
		changePrice: uTickerData.change_price,
		changeRate: uTickerData.change_rate,
		signedChangePrice: uTickerData.signed_change_price,
		signedChangeRate: uTickerData.signed_change_rate,
		tradeVolume: uTickerData.trade_volume,
		accTradePrice: uTickerData.acc_trade_price,
		accTradePrice24h: uTickerData.acc_trade_price_24h,
		accTradeVolume: uTickerData.acc_trade_volume,
		accTradeVolume24h: uTickerData.acc_trade_volume_24h,
		highest52WeekPrice: uTickerData.highest_52_week_price,
		highest52WeekDate: uTickerData.highest_52_week_date,
		lowest52WeekPrice: uTickerData.lowest_52_week_price,
		lowest52WeekDate: uTickerData.lowest_52_week_date,
		timestamp: uTickerData.timestamp
	}),
	toTickerCalculationData: (marketInfo: MarketInfoData, tickerData: TickerData): TickerCalculationData => ({
		market: marketInfo.market,
		koreanName: marketInfo.koreanName,
		englishName: marketInfo.englishName,
		decimalDepth: CurrentNumberUtils.getDecimalDepth(tickerData.tradePrice),
		openingPrice: tickerData.openingPrice,
		highPrice: tickerData.highPrice,
		lowPrice: tickerData.lowPrice,
		tradePrice: tickerData.tradePrice,
		diffRate: CurrentNumberUtils.calculateRate(tickerData.tradePrice, tickerData.prevClosingPrice),
		diffPrice: CurrentNumberUtils.subtractPrice(tickerData.tradePrice, tickerData.prevClosingPrice),
		accTradePrice: tickerData.accTradePrice,
		accTradePrice24h: tickerData.accTradePrice24h,
		accTradeVolume: tickerData.accTradeVolume,
		accTradeVolume24h: tickerData.accTradeVolume24h
	}),
};
