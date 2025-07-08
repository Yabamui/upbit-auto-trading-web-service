export interface RSIData {
	rsi: number;
	signal: number;
}

export interface MACDData {
	macd: number;
	signal: number;
	histogram: number;
}

export interface StochasticData {
	k: number;
	d: number;
}

export interface StochasticRSIData {
	rsi: number;
	k: number;
	d: number;
}

export interface BollingerBandsData {
	middle: number;
	upper: number;
	lower: number;
	pb: number;
}

export interface IndicatorIndividualScoreData {
	ma: number;
	rsi: number;
	macd: number;
	stochastic: number;
	stochasticRsi: number;
	bollingerBand: number;
}

export interface IndicatorMarketConditionWeightData {
	ma: number;
	rsi: number;
	macd: number;
	stochastic: number;
	stochasticRsi: number;
	bollingerBand: number;
}

export interface IndicatorMarketConditionData {
	marketCondition: string;
	weight: IndicatorMarketConditionWeightData;
}

export interface IndicatorInterpretationData {
	signal: string;
	strength: string;
	recommendation: string;
}

export interface IndicatorAnalyzeData {
	market: string;
	koreanName: string;
	englishName: string;
	individualScore?: IndicatorIndividualScoreData;
	finalScore: number;
	avgScore: number;
	marketCondition?: IndicatorMarketConditionData;
	interpretation?: IndicatorInterpretationData;
	lastCandleDateTimeUtc?: string;
	lastCandleDateTimeKst?: string;
	createdAt: string;
}