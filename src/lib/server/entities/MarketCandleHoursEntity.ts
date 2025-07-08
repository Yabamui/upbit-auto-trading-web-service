import type { CandleData } from '$lib/common/models/CandleData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface MarketCandleHoursEntity {
	id: number;
	timestamp: number;
	market: string;
	candle_date_time_utc: Date;
	candle_date_time_kst: Date;
	opening_price: number;
	high_price: number;
	low_price: number;
	trade_price: number;
	candle_acc_trade_price: number;
	candle_acc_trade_volume: number;
}

export const MarketCandleHoursEntityUtils = {
	toCandleData: (data: MarketCandleHoursEntity): CandleData => {
		return {
			timestamp: data.timestamp,
			market: data.market,
			candleDateTimeUtc: CurrentDateUtils.toFormatStringByDate(data.candle_date_time_utc),
			candleDateTimeKst: CurrentDateUtils.toFormatStringByDate(data.candle_date_time_kst),
			openingPrice: data.opening_price,
			highPrice: data.high_price,
			lowPrice: data.low_price,
			tradePrice: data.trade_price,
			candleAccTradePrice: data.candle_acc_trade_price,
			candleAccTradeVolume: data.candle_acc_trade_volume,
			prevClosingPrice: undefined,
			changePrice: undefined,
			changeRate: undefined,
			unit: undefined,
			convertedTradePrice: undefined,
			firstDayOfPeriod: undefined
		};
	}
};
