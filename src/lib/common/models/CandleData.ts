import type { UCandleData } from '$lib/server/models/UPbitApiData';

export interface CandleData {
	timestamp: number;
	market: string;
	candleDateTimeUtc: string;
	candleDateTimeKst: string;
	openingPrice: number;
	highPrice: number;
	lowPrice: number;
	tradePrice: number;
	candleAccTradePrice: number;
	candleAccTradeVolume: number;
	prevClosingPrice: number | undefined;
	changePrice: number | undefined;
	changeRate: number | undefined;
	unit: number | undefined;
	convertedTradePrice: number | undefined;
	firstDayOfPeriod: string | undefined;
}


export const CandleDataUtils = {
	toMarketInfoData: (data: UCandleData): CandleData => {
		return {
			timestamp: data.timestamp,
			market: data.market,
			candleDateTimeUtc: data.candle_date_time_utc,
			candleDateTimeKst: data.candle_date_time_kst,
			openingPrice: data.opening_price,
			highPrice: data.high_price,
			lowPrice: data.low_price,
			tradePrice: data.trade_price,
			candleAccTradePrice: data.candle_acc_trade_price,
			candleAccTradeVolume: data.candle_acc_trade_volume,
			prevClosingPrice: data.prev_closing_price,
			changePrice: data.change_price,
			changeRate: data.change_rate,
			unit: data.unit,
			convertedTradePrice: data.converted_trade_price,
			firstDayOfPeriod: data.first_day_of_period,
		}
	}
}