import type { CandleData } from '$lib/common/models/CandleData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface MarketCandleDaysEntity {
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
	prev_closing_price: number;
	change_price: number;
	change_rate: number;
	converted_trade_price: number | undefined;
}

export const MarketCandleDaysEntityUtils = {
	toCandleData: (data: MarketCandleDaysEntity): CandleData => {
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
			prevClosingPrice: data.prev_closing_price,
			changePrice: data.change_price,
			changeRate: data.change_rate,
			unit: undefined,
			convertedTradePrice: data.converted_trade_price,
			firstDayOfPeriod: undefined
		};
	}
};
