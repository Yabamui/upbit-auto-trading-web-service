export interface TradeInferenceEChartRequestData {
	market: string;
	marketName: string;
	candleUnit: string;
	candleTimeZone: string;
	dateTimeFormat: string;
}

export interface TradeMarketPriceIndicatorData {
	macd: IndicatorMACDData;
	rsi: IndicatorRSIData;
	stochastic: IndicatorStochasticData;
	stochasticRSI: IndicatorStochasticRSIData;
	prophetIndex: number;
	aiIndex: number;
	prophetDate: string;
	aiDate: string;
	tfDate: string
}

export interface IndicatorMACDData {
	fastPeriod: number;
	slowPeriod: number;
	signalPeriod: number;
}
export interface IndicatorRSIData {
	period: number;
	signalPeriod: number;
}

export interface IndicatorStochasticData {
	period: number;
	signalPeriod: number;
	maPeriod: number;
}

export interface IndicatorStochasticRSIData {
	rsiPeriod: number;
	stochasticPeriod: number;
	signalPeriod: number;
	maPeriod: number;
}