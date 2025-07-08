import { ATR, BollingerBands, MACD, RSI, SMA, Stochastic } from 'technicalindicators';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import type {
	BollingerBandsData,
	IndicatorAnalyzeData,
	IndicatorIndividualScoreData,
	IndicatorInterpretationData,
	IndicatorMarketConditionData,
	IndicatorMarketConditionWeightData,
	MACDData,
	StochasticData,
	StochasticRSIData
} from '$lib/common/models/TechnicalIndicatorData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

interface ExtremaResult {
	index: number;
	value: number;
	strength: number;
	duration?: number;
}

interface ExtremaOptions {
	threshold?: number;
	window?: number;
	minDuration?: number;
	returnReversed?: boolean;
}

// 상수 정의
const STOCHASTIC_THRESHOLDS = {
	RECENT_CROSS: 7,
	RECENT_DIRECTION: 5,
	OVERSOLD: 20,
	OVERBOUGHT: 80,
	EXTREME_OVERSOLD: 10,
	EXTREME_OVERBOUGHT: 90,
	NEUTRAL_LEVEL: 50,
	LOW_LEVEL: 30,
	HIGH_LEVEL: 70,
	LOW_VOLATILITY: 2,
	HIGH_VOLATILITY: 5
};

const STOCHASTIC_WEIGHTS = {
	DEFAULT: {
		LEVEL: 0.4,
		CROSS: 0.4,
		DIRECTION: 0.2
	},
	EXTREME_LEVEL: {
		LEVEL: 0.5,
		CROSS: 0.35,
		DIRECTION: 0.15
	},
	RECENT_CROSS: {
		LEVEL: 0.35,
		CROSS: 0.5,
		DIRECTION: 0.15
	}
};

const STOCHASTIC_RSI_THRESHOLDS = {
	RECENT_LEVEL: 5,
	RECENT_CROSS: 5,
	RECENT_DIRECTION: 5,
	RECENT_VOLATILITY: 7,
	RECENT_RSI_CONSISTENCY: 5,
	RECENT_HISTORY_PATTERN: 10,
	OVERSOLD: 20,
	LOWSOLD: 30,
	NEUTRAL: 50,
	HIGHBOUGHT: 70,
	OVERBOUGHT: 80,
	TREND_UP_STRONG: 0.7,
	TREND_UP: 0.5,
	TREND_DOWN_WEAK: 0.7
};

export const AnalyzeTechnicalIndicatorUtils = {
	analyzeTechnicalIndicators: analyzeTechnicalIndicators,
	calculateMA: calculateMA,
	calculateMACD: calculateMACD,
	calculateRSI: calculateRSI,
	calculateStochastic: calculateStochastic,
	calculateStochasticRSI: calculateStochasticRSI,
	calculateATR: calculateATR,
	calculateBollingerBands: calculateBollingerBands,
	calculateMAScore: calculateMAScore,
	calculateRSIScore: calculateRSIScore,
	calculateMACDScore: calculateMACDScore,
	calculateStochasticScore: calculateStochasticScore,
	calculateStochasticRSIScore: calculateStochasticRSIScore,
	calculateBollingerBandsScore: calculateBollingerBandsScore,
	determineMarketCondition: determineMarketCondition
};

async function analyzeTechnicalIndicators({
	priceList,
	shortMAList,
	midMAList,
	longMAList,
	longTermMAList,
	rsiList,
	macdList,
	stochasticList,
	stochasticRSIList,
	bollingerBandsList,
	atrList
}: {
	priceList: number[];
	shortMAList: number[];
	midMAList: number[];
	longMAList: number[];
	longTermMAList: number[];
	rsiList: number[];
	macdList: MACDData[];
	stochasticList: StochasticData[];
	stochasticRSIList: StochasticRSIData[];
	bollingerBandsList: BollingerBandsData[];
	atrList: number[];
}): Promise<IndicatorAnalyzeData> {
	const maScore = await AnalyzeTechnicalIndicatorUtils.calculateMAScore({
		shortMA: shortMAList,
		midMA: midMAList,
		longMA: longMAList,
		currentPrice: priceList[priceList.length - 1]
	});

	const rsiScore = await AnalyzeTechnicalIndicatorUtils.calculateRSIScore({
		rsiList: rsiList,
		priceList: priceList
	});

	const macdScore = await AnalyzeTechnicalIndicatorUtils.calculateMACDScore({
		macdList: macdList,
		priceList: priceList
	});

	const stochasticScore = await AnalyzeTechnicalIndicatorUtils.calculateStochasticScore({
		stochasticList: stochasticList
	});

	const stochasticRSIScore = await AnalyzeTechnicalIndicatorUtils.calculateStochasticRSIScore({
		stochasticRSIList: stochasticRSIList
	});

	const bollingerBandsScore = await AnalyzeTechnicalIndicatorUtils.calculateBollingerBandsScore({
		bollingerBandsList: bollingerBandsList,
		priceList: priceList,
		rsiList: rsiList
	});

	const individualScore = {
		ma: maScore,
		rsi: rsiScore,
		macd: macdScore,
		stochastic: stochasticScore,
		stochasticRsi: stochasticRSIScore,
		bollingerBand: bollingerBandsScore
	};

	const availableIndicators: string[] = Object.entries(individualScore)
		.map((item: [string, number]): string | null => {
			if (isNaN(item[1]) || item[1] === null || item[1] === undefined) {
				return null;
			}

			return item[0];
		})
		.filter((item) => item !== null);

	const marketCondition: IndicatorMarketConditionData =
		await AnalyzeTechnicalIndicatorUtils.determineMarketCondition({
			longMA: longTermMAList,
			atrList: atrList,
			availableIndicators
		});

	const finalScore = await calculateTotalScore({
		individualScore,
		marketCondition
	});

	const avgScore =
		Object.values(individualScore)
			.filter((score) => !isNaN(score))
			.reduce((sum, score) => sum + score, 0) / 5;

	const interpretation: IndicatorInterpretationData = await interpretScore({
		finalScore
	});

	return {
		market: '',
		koreanName: '',
		englishName: '',
		individualScore,
		finalScore,
		avgScore,
		marketCondition,
		interpretation,
		lastCandleDateTimeUtc: '',
		lastCandleDateTimeKst: '',
		createdAt: CurrentDateUtils.getNowDateTimeString()
	};
}

/**
 * 시장 상황 판단 및 가중치 결정
 * @param {Object} params 시장 관련 정보
 * @param {Array} params.longMA 장기 이동평균선 값 리스트
 * @param {Array} params.atrList ATR 값 리스트
 * @param {Array} params.availableIndicators 사용 가능한 지표 목록
 * @param {Object} params.thresholds 시장 상황 판단 임계값
 * @param {number} params.slopeRecentCount 기울기 계산에 사용할 최근 데이터 수
 * @return {Object} 시장 상황 및 가중치 정보
 */
async function determineMarketCondition({
	longMA,
	atrList,
	availableIndicators = ['ma', 'rsi', 'macd', 'stochastic', 'stochasticRsi', 'bollingerBand'],
	thresholds = {
		strongUptrend: 0.15,
		uptrend: 0.08,
		strongDowntrend: -0.15,
		downtrend: -0.08,
		highVolatility: 3
	},
	slopeRecentCount = 20
}: {
	longMA: number[];
	atrList: number[];
	availableIndicators: string[];
	thresholds?: {
		strongUptrend: number;
		uptrend: number;
		strongDowntrend: number;
		downtrend: number;
		highVolatility: number;
	};
	slopeRecentCount?: number;
}): Promise<IndicatorMarketConditionData> {
	// 기본 가중치 정의
	let baseWeights: IndicatorMarketConditionWeightData = {
		ma: 0.2,
		rsi: 0.2,
		macd: 0.2,
		stochastic: 0.2,
		stochasticRsi: 0.1,
		bollingerBand: 0.1
	};

	// 입력값 검증
	if (!longMA || longMA.length === 0 || !atrList || atrList.length === 0) {
		return {
			marketCondition: '데이터 부족',
			weight: baseWeights
		};
	}

	// 장기 이동평균선 기울기 계산
	const longMASlope = calculateSlope(longMA.slice(-slopeRecentCount));

	// ATR 기반 변동성 계산 (NaN 값 처리)
	const currentATR = atrList[atrList.length - 1] || 0;
	const avgPrice = longMA[longMA.length - 1] || 1;
	// 가격 대비 ATR 비율 (%)
	const volatility = (currentATR / avgPrice) * 100;

	// 시장 상황 문자열 결정
	let marketCondition;

	// 시장 상황별 가중치 설정 - 상승/하락 추세 차별화
	if (longMASlope > thresholds.strongUptrend) {
		marketCondition = '강한 상승 추세';
		baseWeights = {
			ma: 0.35, // 추세 추종에 유리
			rsi: 0.15, // 과매수 감지
			macd: 0.25, // 강한 상승 추세 확인
			stochastic: 0.1, // 과매수 확인용
			stochasticRsi: 0.05, // 보조 지표
			bollingerBand: 0.1 // 추세 이탈 확인
		};
	} else if (longMASlope > thresholds.uptrend) {
		marketCondition = '상승 추세';
		baseWeights = {
			ma: 0.3, // 추세 방향 확인
			rsi: 0.15, // 과매수 감지
			macd: 0.25, // 추세 강도 확인
			stochastic: 0.15, // 단기 고점 확인
			stochasticRsi: 0.05, // 보조 지표
			bollingerBand: 0.1 // 변동성 확인
		};
	} else if (longMASlope < thresholds.strongDowntrend) {
		marketCondition = '강한 하락 추세';
		baseWeights = {
			ma: 0.25, // 추세 확인
			rsi: 0.3, // 과매도 반등 감지에 중요
			macd: 0.15, // 하락 추세 확인
			stochastic: 0.15, // 과매도 확인
			stochasticRsi: 0.1, // 급반등 감지
			bollingerBand: 0.05 // 밴드 하단 지지
		};
	} else if (longMASlope < thresholds.downtrend) {
		marketCondition = '하락 추세';
		baseWeights = {
			ma: 0.25, // 추세 확인
			rsi: 0.25, // 반등 포인트 감지
			macd: 0.2, // 추세 약화 감지
			stochastic: 0.15, // 단기 저점 확인
			stochasticRsi: 0.1, // 단기 반등 신호
			bollingerBand: 0.05 // 하단 밴드 확인
		};
	} else if (volatility > thresholds.highVolatility) {
		marketCondition = '높은 변동성 횡보';
		baseWeights = {
			ma: 0.15, // 횡보시 낮은 중요도
			rsi: 0.2, // 과매수/과매도 확인
			macd: 0.15, // 방향성 파악
			stochastic: 0.2, // 단기 변동 활용
			stochasticRsi: 0.15, // 급반등 감지
			bollingerBand: 0.15 // 밴드 이탈 확인
		};
	} else {
		marketCondition = '낮은 변동성 횡보';
		baseWeights = {
			ma: 0.15, // 횡보시 낮은 중요도
			rsi: 0.2, // 범위 확인
			macd: 0.15, // 약한 신호
			stochastic: 0.2, // 고점/저점 확인
			stochasticRsi: 0.15, // 단기 변동
			bollingerBand: 0.15 // 변동성 축소 확인
		};
	}

	// 사용 가능한 지표만 필터링
	const filteredWeights: Partial<IndicatorMarketConditionWeightData> = {};
	let totalAvailableWeight = 0;

	// 사용 가능한 지표 확인 및 가중치 합계 계산
	availableIndicators.forEach((indicator) => {
		if (indicator in baseWeights) {
			const weight = baseWeights[indicator as keyof IndicatorMarketConditionWeightData];
			if (!isNaN(weight) && weight > 0) {
				filteredWeights[indicator as keyof IndicatorMarketConditionWeightData] = weight;
				totalAvailableWeight += weight;
			}
		}
	});

	// 가중치 합이 0이거나 정상 범위를 벗어난 경우 (모든 지표가 NaN인 경우 등)
	if (totalAvailableWeight <= 0 || isNaN(totalAvailableWeight)) {
		// 기본값으로 균등 분배
		const availableCount = availableIndicators.length || 1;
		const equalWeight = 1 / availableCount;

		availableIndicators.forEach((indicator) => {
			filteredWeights[indicator as keyof IndicatorMarketConditionWeightData] = equalWeight;
		});

		totalAvailableWeight = 1;
	}

	// 가중치 재조정 (합이 1이 되도록)
	const adjustedWeights: IndicatorMarketConditionWeightData = {
		ma: 0,
		rsi: 0,
		macd: 0,
		stochastic: 0,
		stochasticRsi: 0,
		bollingerBand: 0
	};

	// 가중치 정규화 수정
	Object.keys(filteredWeights).forEach((key) => {
		const typedKey = key as keyof IndicatorMarketConditionWeightData;
		adjustedWeights[typedKey] = (filteredWeights[typedKey] || 0) / totalAvailableWeight;
	});

	return {
		marketCondition,
		weight: adjustedWeights
	};
}

/**
 * 최종 점수 해석
 * @param {Object} params 최종 점수 관련 정보
 * @param {number} params.finalScore 최종 점수
 * @return {Object} 신호, 강도 및 추천 사항
 */
async function interpretScore({
	finalScore
}: {
	finalScore: number;
}): Promise<IndicatorInterpretationData> {
	if (finalScore >= 90) {
		return {
			signal: '매수',
			strength: '매우 강한',
			recommendation: '적극적인 매수를 고려하세요.'
		};
	} else if (finalScore >= 70) {
		return {
			signal: '매수',
			strength: '강한',
			recommendation: '매수 포지션을 고려하세요.'
		};
	} else if (finalScore >= 60) {
		return {
			signal: '매수',
			strength: '약한',
			recommendation: '부분적 매수를 고려하세요.'
		};
	} else if (finalScore >= 40) {
		return {
			signal: '관망',
			strength: '중립',
			recommendation: '추가 확인 전까지 대기하세요.'
		};
	} else if (finalScore >= 30) {
		return {
			signal: '매도',
			strength: '약한',
			recommendation: '부분적 매도를 고려하세요.'
		};
	} else if (finalScore >= 10) {
		return {
			signal: '매도',
			strength: '강한',
			recommendation: '매도 포지션을 고려하세요.'
		};
	} else {
		return {
			signal: '매도',
			strength: '매우 강한',
			recommendation: '적극적인 매도를 고려하세요.'
		};
	}
}

async function calculateTotalScore({
	individualScore,
	marketCondition
}: {
	individualScore: IndicatorIndividualScoreData;
	marketCondition: IndicatorMarketConditionData;
}) {
	let scoreSum = 0;

	for (const individualScoreKey in individualScore) {
		const score = individualScore[individualScoreKey as keyof IndicatorIndividualScoreData];

		if (score === undefined || score === null || isNaN(score)) {
			continue;
		}

		const weight =
			marketCondition.weight[individualScoreKey as keyof IndicatorMarketConditionWeightData];

		scoreSum += score * (weight || 0);
	}

	return Math.min(100, Math.max(0, scoreSum));
}

async function calculateMA(
	dataList: number[],
	period: number,
	decimalPlace: number
): Promise<number[]> {
	const sma = new SMA({
		period: period,
		values: []
	});

	return dataList.map((value: number) => {
		if (isNaN(value)) {
			return NaN;
		}

		const result = sma.nextValue(value);

		if (result === undefined) {
			return NaN;
		}

		return CurrentNumberUtils.ceilPrice(result, decimalPlace);
	});
}

async function calculateMACD(
	values: number[],
	decimalDepth: number,
	fastPeriod: number,
	slowPeriod: number,
	signalPeriod: number,
	SimpleMAOscillator: boolean,
	SimpleMASignal: boolean
): Promise<MACDData[]> {
	const macd = new MACD({
		values: [],
		fastPeriod: fastPeriod,
		slowPeriod: slowPeriod,
		signalPeriod: signalPeriod,
		SimpleMAOscillator: SimpleMAOscillator,
		SimpleMASignal: SimpleMASignal
	});

	return values.map((value: number) => {
		if (isNaN(value)) {
			return {
				macd: NaN,
				signal: NaN,
				histogram: NaN
			};
		}

		const result = macd.nextValue(value);

		if (result === undefined) {
			return {
				macd: NaN,
				signal: NaN,
				histogram: NaN
			};
		}

		return {
			macd:
				result.MACD !== undefined ? CurrentNumberUtils.ceilPrice(result.MACD, decimalDepth) : NaN,
			signal:
				result.signal !== undefined
					? CurrentNumberUtils.ceilPrice(result.signal, decimalDepth)
					: NaN,
			histogram:
				result.histogram !== undefined
					? CurrentNumberUtils.ceilPrice(result.histogram, decimalDepth)
					: NaN
		};
	});
}

async function calculateRSI(dataList: number[], period: number): Promise<number[]> {
	const rsi = new RSI({
		values: [],
		period: period
	});

	return dataList.map((value: number) => {
		if (isNaN(value)) {
			return NaN;
		}

		const result = rsi.nextValue(value);

		if (result === undefined) {
			return NaN;
		}

		return CurrentNumberUtils.ceilPrice(result, 2);
	});
}

async function calculateStochastic(
	dataListInList: number[][],
	period: number,
	signalPeriod: number,
	dPeriod: number
): Promise<StochasticData[]> {
	const stochastic = new Stochastic({
		period: period,
		high: [],
		low: [],
		close: [],
		signalPeriod: signalPeriod
	});

	const dList: number[] = dataListInList.map((itemList: number[]) => {
		if (!itemList || itemList.length === 0) {
			return NaN;
		}

		const input = {
			high: itemList[0],
			low: itemList[1],
			close: itemList[2]
		};

		// @ts-expect-error type not match
		const result = stochastic.nextValue(input);

		if (!result) {
			return NaN;
		}

		return result.d !== undefined ? CurrentNumberUtils.ceilPrice(result.d, 3) : NaN;
	});

	const dMAList = await calculateMA(dList, dPeriod, 3);

	return dList.map((item: number, index: number) => {
		if (isNaN(item)) {
			return {
				k: NaN,
				d: NaN
			};
		}

		return {
			k: item,
			d: dMAList[index] || NaN
		};
	});
}

async function calculateStochasticRSI(
	dataList: number[],
	rsiPeriod: number,
	stochasticPeriod: number,
	kPeriod: number,
	dPeriod: number
): Promise<StochasticRSIData[]> {
	const rsiList: number[] = await calculateRSI(dataList, rsiPeriod);

	if (rsiList.length === 0) {
		return [];
	}

	const stochastic = new Stochastic({
		period: stochasticPeriod,
		high: [],
		low: [],
		close: [],
		signalPeriod: kPeriod
	});

	const dList: number[] = rsiList.map((rsi: number) => {
		if (isNaN(rsi)) {
			return NaN;
		}

		const input = {
			high: rsi,
			low: rsi,
			close: rsi
		};

		// @ts-expect-error type not match
		const result = stochastic.nextValue(input);

		if (!result) {
			return NaN;
		}

		return result.d !== undefined ? CurrentNumberUtils.ceilPrice(result.d, 3) : NaN;
	});

	const dMaList = await AnalyzeTechnicalIndicatorUtils.calculateMA(dList, dPeriod, 3);

	return rsiList.map((item: number, index: number) => {
		if (isNaN(item)) {
			return {
				rsi: NaN,
				k: NaN,
				d: NaN
			};
		}

		return {
			rsi: item,
			k: dList[index] || NaN,
			d: dMaList[index] || NaN
		};
	});
}

async function calculateATR(dataListInList: number[][], period: number): Promise<number[]> {
	const atr = new ATR({
		high: [],
		low: [],
		close: [],
		period: period
	});

	return dataListInList.map((itemList: number[]) => {
		if (!itemList || itemList.length === 0) {
			return NaN;
		}

		const result = atr.nextValue({
			high: itemList[0],
			low: itemList[1],
			close: itemList[2]
		});

		if (result === undefined) {
			return NaN;
		}

		return CurrentNumberUtils.ceilPrice(result, 2);
	});
}

async function calculateBollingerBands(
	dataList: number[],
	period: number,
	deviation: number,
	decimalPlace: number
): Promise<BollingerBandsData[]> {
	const bb = new BollingerBands({
		period: period,
		stdDev: deviation,
		values: []
	});

	return dataList.map((item: number) => {
		if (isNaN(item)) {
			return {
				middle: NaN,
				upper: NaN,
				lower: NaN,
				pb: NaN
			};
		}

		const result = bb.nextValue(item);

		if (!result) {
			return {
				middle: NaN,
				upper: NaN,
				lower: NaN,
				pb: NaN
			};
		}

		return {
			middle:
				result.middle !== undefined
					? CurrentNumberUtils.ceilPrice(result.middle, decimalPlace)
					: NaN,
			upper:
				result.upper !== undefined ? CurrentNumberUtils.ceilPrice(result.upper, decimalPlace) : NaN,
			lower:
				result.lower !== undefined ? CurrentNumberUtils.ceilPrice(result.lower, decimalPlace) : NaN,
			pb: result.pb !== undefined ? CurrentNumberUtils.ceilPrice(result.pb, decimalPlace) : NaN
		};
	});
}

/**
 * 이동 평균선 점수 계산
 * @param {Object} params 이동 평균선 관련 정보
 * @param {Array} params.shortMA 단기 이동 평균선
 * @param {Array} params.midMA 중기 이동 평균선
 * @param {Array} params.longMA 장기 이동 평균선
 * @param {number} params.currentPrice 현재 가격
 * @return {number} 0-100 사이의 이동 평균선 점수
 */
async function calculateMAScore({
	shortMA,
	midMA,
	longMA,
	currentPrice
}: {
	shortMA: number[];
	midMA: number[];
	longMA: number[];
	currentPrice: number;
}): Promise<number> {
	if (shortMA.length === 0 || midMA.length === 0 || longMA.length === 0) {
		return NaN;
	}

	// 상수 정의
	const ARRAY_SCORE_WEIGHT = 0.4;
	const CROSS_SCORE_WEIGHT = 0.3;
	const PRICE_RELATION_SCORE_WEIGHT = 0.3;

	const slopeRecentCount = 5;
	const crossRecentCount = 20;

	const currentShortMA: number = shortMA[shortMA.length - 1];
	const currentMidMA: number = midMA[midMA.length - 1];
	const currentLongMA: number = longMA[longMA.length - 1];
	// 이동 평균선 기울기 계산
	const [shortMASlope, midMASlope, longMASlope] = await Promise.all([
		calculateSlope(shortMA.slice(-slopeRecentCount)),
		calculateSlope(midMA.slice(-slopeRecentCount)),
		calculateSlope(longMA.slice(-slopeRecentCount))
	]);
	// 이동 평균선 배열 점수, 크로스 상태 점수, 현재가와 이동 평균선 관계 점수 계산
	const [arrayScore, crossScore, priceRelationScore] = await Promise.all([
		// 1. 이동평균선 배열 점수 (40%)
		calculateMAArrayScore({
			currentShortMA,
			currentMidMA,
			currentLongMA,
			shortMASlope,
			midMASlope,
			longMASlope
		}),
		// 2. 크로스 상태 점수 (30%)
		calculateMACrossScore({
			shortMA,
			midMA,
			crossRecentCount
		}),
		// 3. 현재가와 이동평균선 관계 점수 (30%)
		calculateMAPriceRelationScore({
			currentPrice,
			currentShortMA,
			currentMidMA,
			currentLongMA
		})
	]);

	// 4. 최종 점수 계산
	const finalScore =
		arrayScore * ARRAY_SCORE_WEIGHT +
		crossScore * CROSS_SCORE_WEIGHT +
		priceRelationScore * PRICE_RELATION_SCORE_WEIGHT;

	return Math.min(100, Math.max(0, finalScore));
}

function calculateMAArrayScore({
	currentShortMA,
	currentMidMA,
	currentLongMA,
	shortMASlope,
	midMASlope,
	longMASlope
}: {
	currentShortMA: number;
	currentMidMA: number;
	currentLongMA: number;
	shortMASlope: number;
	midMASlope: number;
	longMASlope: number;
}) {
	// 기울기 관련 상수
	const MA_LINES_COUNT = 3;
	const SIDEWAYS_THRESHOLD = 0.1;

	const isAscendingArray = currentShortMA > currentMidMA && currentMidMA > currentLongMA;
	const isDescendingArray = currentShortMA < currentMidMA && currentMidMA < currentLongMA;

	// 기울기 상태 분석
	const upSlopeCount =
		(shortMASlope > 0 ? 1 : 0) + (midMASlope > 0 ? 1 : 0) + (longMASlope > 0 ? 1 : 0);

	const downSlopeCount =
		(shortMASlope < 0 ? 1 : 0) + (midMASlope < 0 ? 1 : 0) + (longMASlope < 0 ? 1 : 0);

	const isSideways =
		Math.abs(shortMASlope) < SIDEWAYS_THRESHOLD &&
		Math.abs(midMASlope) < SIDEWAYS_THRESHOLD &&
		Math.abs(longMASlope) < SIDEWAYS_THRESHOLD;

	// 1. 완벽한 상승 배열: 단기>중기>장기, 모두 우상향
	if (isAscendingArray && upSlopeCount === MA_LINES_COUNT) {
		return 100;
	}

	// 2. 대체로 상승 배열: 단기>중기>장기, 일부만 우상향
	if (isAscendingArray && upSlopeCount > 0) {
		return 70 + (20 * upSlopeCount) / MA_LINES_COUNT;
	}

	// 3. 횡보 배열: 모든 이평선이 낮은 기울기
	if (isSideways) {
		// 약한 방향성에 따라 점수 조정
		return 50 + (20 * upSlopeCount) / MA_LINES_COUNT;
	}

	// 4. 완벽한 하락 배열: 단기<중기<장기, 모두 우하향
	if (isDescendingArray && downSlopeCount === MA_LINES_COUNT) {
		return 0;
	}

	// 5. 일부 하락 배열: 일부 이평선 역전, 일부 우하향
	if ((currentShortMA < currentMidMA || currentMidMA < currentLongMA) && downSlopeCount > 0) {
		return 40 - (20 * downSlopeCount) / MA_LINES_COUNT;
	}

	// 6. 혼합 패턴: 상승/하락 배열은 아니지만 일부 특성 존재
	if (isDescendingArray) {
		// 하락 배열이지만 일부 상승 기울기 (반등 가능성)
		return 20 + (15 * upSlopeCount) / MA_LINES_COUNT;
	}

	// 7. 기타 분류되지 않은 패턴 (중립적 성향)
	return 30;
}

function calculateMACrossScore({
	shortMA,
	midMA,
	crossRecentCount
}: {
	shortMA: number[];
	midMA: number[];
	crossRecentCount: number;
}) {
	// 상수 정의
	const NEUTRAL_SCORE = 50; // 크로스 없을 때 기본 점수
	const MAX_SCORE = 100; // 최대 점수 (신규 골든 크로스)
	const DECAY_FACTOR = 40; // 시간 경과에 따른 감소 계수
	const MAX_DECAY_DAYS = 19; // 최대 감소 적용 일수

	const crossHistory = detectCross(shortMA, midMA);

	// 배열이 비어있거나 크로스가 없는 경우 중립 점수 반환
	if (crossHistory.length === 0) {
		return NEUTRAL_SCORE;
	}

	// 분석할 기간 범위 설정 (배열 크기 넘지 않도록)
	const effectiveCount = Math.min(crossRecentCount, crossHistory.length);

	// 최근 크로스 검색 (slice 없이 배열 직접 탐색)
	for (let daysAfterCross = 0; daysAfterCross < effectiveCount; daysAfterCross++) {
		const idx = crossHistory.length - 1 - daysAfterCross;
		const crossValue = crossHistory[idx];

		if (crossValue !== 0) {
			const timeDecay = (DECAY_FACTOR * daysAfterCross) / MAX_DECAY_DAYS;

			// 골든 크로스: 시간 경과에 따라 100점에서 감소
			if (crossValue === 1) {
				return MAX_SCORE - timeDecay;
			}
			// 데드 크로스: 시간 경과에 따라 0점에서 증가
			else {
				return timeDecay;
			}
		}
	}

	// 분석 기간 내 크로스 없음
	return NEUTRAL_SCORE;
}

function calculateMAPriceRelationScore({
	currentPrice,
	currentShortMA,
	currentMidMA,
	currentLongMA
}: {
	currentPrice: number;
	currentShortMA: number;
	currentMidMA: number;
	currentLongMA: number;
}) {
	// 상수 정의
	const SIGNIFICANT_THRESHOLD = 5; // 유의미한 가격 차이 기준 (%)
	const MA_LINES_COUNT = 3; // 이동평균선 개수

	// 가격-이평선 관계 계산
	const aboveMACount = [currentShortMA, currentMidMA, currentLongMA].filter(
		(item) => currentPrice > item
	).length;
	const avgMA = (currentShortMA + currentMidMA + currentLongMA) / MA_LINES_COUNT;
	const priceDiffRatio = ((currentPrice - avgMA) / avgMA) * 100;
	const priceDiffAbs = Math.abs(priceDiffRatio);

	// 케이스별 점수 계산
	// 케이스 1: 현재가가 모든 이평선 상회 + 큰 차이 (80-100점)
	if (aboveMACount === MA_LINES_COUNT && priceDiffRatio > SIGNIFICANT_THRESHOLD) {
		const additionalScore = Math.min(20, (priceDiffRatio - SIGNIFICANT_THRESHOLD) * 4);
		return 80 + additionalScore;
	}

	// 케이스 2: 현재가가 모든 이평선 상회 + 작은 차이 (60-80점)
	if (aboveMACount === MA_LINES_COUNT && priceDiffRatio > 0) {
		return 60 + priceDiffRatio * 4;
	}

	// 케이스 3: 현재가가 일부 이평선 상회 (40-60점)
	if (aboveMACount > 0) {
		const baseScore = 40 + (aboveMACount * 20) / MA_LINES_COUNT;
		const penaltyForHighDiff = priceDiffAbs > SIGNIFICANT_THRESHOLD ? 5 : 0;
		return baseScore - penaltyForHighDiff;
	}

	// 케이스 4: 현재가가 모든 이평선 하회 + 작은 차이 (20-40점)
	if (priceDiffRatio > -SIGNIFICANT_THRESHOLD && priceDiffRatio <= 0) {
		return 40 - priceDiffAbs * 4;
	}

	// 케이스 5: 현재가가 모든 이평선 하회 + 큰 차이 (0-20점)
	const penaltyScore = Math.min(20, (priceDiffAbs - SIGNIFICANT_THRESHOLD) * 2);
	return 20 - penaltyScore;
}

/**
 * RSI 점수 계산
 * @param {Object} params RSI 관련 정보
 * @param {Array} params.rsiList RSI 값 리스트
 * @param {Array} params.priceList 가격 리스트
 * @return {number} 0-100 사이의 RSI 점수
 */
async function calculateRSIScore({
	rsiList,
	priceList
}: {
	rsiList: number[];
	priceList: number[];
}): Promise<number> {
	if (rsiList.length === 0 || priceList.length === 0) {
		return NaN;
	}

	const directionRecentCount = 5;
	const extremaRecentCount = 20;

	const currentRSI: number = rsiList[rsiList.length - 1];
	// 가격 고점/저점과 RSI 고점/저점 찾기
	const period = Math.min(extremaRecentCount, Math.floor(priceList.length / 2));
	const [priceHighList, priceLowList, rsiHighList, rsiLowList] = await Promise.all([
		findLocalExtrema(priceList.slice(-period), 'high', {
			threshold: 0.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 2,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(priceList.slice(-period), 'low', {
			threshold: 0.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 2,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(rsiList.slice(-period), 'high', {
			threshold: 1.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 2,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(rsiList.slice(-period), 'low', {
			threshold: 1.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 2,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		})
	]);

	// RSI 레벨, 방향성, 다이버전스 점수 계산
	const [levelScore, directionScore, divergenceScore] = await Promise.all([
		// 1. RSI 레벨 점수 (50%)
		calculateRSILevelScore({
			rsiList,
			currentRSI,
			extremaRecentCount
		}),
		// 2. RSI 방향성 점수 (30%)
		calculateRSIDirectionScore({
			rsiList,
			directionRecentCount
		}),
		// 3. RSI 다이버전스 점수 (20%)
		calculateDivergenceScore({
			priceLowList,
			priceHighList,
			targetLowList: rsiLowList,
			targetHighList: rsiHighList
		})
	]);

	// 시장 상황에 따른 동적 가중치 조정
	const { levelWeight, directionWeight, divergenceWeight } = getRSIScoreWeight(currentRSI);

	// 최종 RSI 점수 계산
	const finalRSIScore =
		levelScore * levelWeight +
		directionScore * directionWeight +
		divergenceScore * divergenceWeight;

	return Math.min(100, Math.max(0, finalRSIScore));
}

function calculateRSILevelScore({
	rsiList,
	currentRSI,
	extremaRecentCount
}: {
	rsiList: number[];
	currentRSI: number;
	extremaRecentCount: number;
}) {
	// 시장 변동성에 따른 RSI 레벨 역치 조정
	const volatility = calculatePriceChangeVolatility(rsiList.slice(-extremaRecentCount));
	const oversoldThreshold = volatility > 5 ? 25 : 30;
	const overboughtThreshold = volatility > 5 ? 75 : 70;

	if (currentRSI <= oversoldThreshold) {
		// 과매도 상태 점수 계산
		return 80 + (oversoldThreshold - currentRSI) * 1.5;
	} else if (currentRSI >= overboughtThreshold) {
		// 과매수 상태 점수 계산
		return 20 - (currentRSI - overboughtThreshold);
	} else {
		// 중립 영역 점수 계산 (동적 조정)
		const midPoint = (oversoldThreshold + overboughtThreshold) / 2;
		return 50 - (currentRSI - midPoint) * (60 / (overboughtThreshold - oversoldThreshold));
	}
}

function calculateRSIDirectionScore({
	rsiList,
	directionRecentCount
}: {
	rsiList: number[];
	directionRecentCount: number;
}): number {
	const recentRSIList: number[] = rsiList.slice(-directionRecentCount);

	let consecutiveUp = 0;
	let consecutiveDown = 0;
	let sumChange = 0;

	for (let i = 1; i < recentRSIList.length; i++) {
		const change = recentRSIList[i] - recentRSIList[i - 1];
		sumChange += change;

		if (change > 0) {
			consecutiveUp++;
			consecutiveDown = 0;
		} else if (change < 0) {
			consecutiveDown++;
			consecutiveUp = 0;
		}
	}

	const avgChange = sumChange / (recentRSIList.length - 1);

	// 강한 상승 추세
	if (consecutiveUp >= 3 && avgChange > 2) {
		return Math.min(100, 80 + avgChange * 5);
	}
	// 약한 상승 추세
	else if (consecutiveUp > consecutiveDown && avgChange > 0) {
		return Math.min(80, 60 + avgChange * 10);
	}
	// 횡보
	else if (Math.abs(avgChange) < 1) {
		return 50;
	}
	// 약한 하락 추세
	else if (consecutiveDown > consecutiveUp && avgChange < 0) {
		return Math.max(20, 40 + avgChange * 10);
	}
	// 강한 하락 추세
	else if (consecutiveDown >= 3 && avgChange < -2) {
		return Math.max(0, 20 + avgChange * 5);
	}

	return 0;
}

function getRSIScoreWeight(currentRSI: number) {
	// 극단적인 RSI 값에서는 레벨 점수 중요도 증가
	if (currentRSI < 20 || currentRSI > 80) {
		return {
			levelWeight: 0.6,
			directionWeight: 0.25,
			divergenceWeight: 0.15
		};
	}

	return {
		levelWeight: 0.5,
		directionWeight: 0.3,
		divergenceWeight: 0.2
	};
}

/**
 * MACD 점수 계산
 * @param {Object} params MACD 관련 정보
 * @param {Array} params.macdList MACD 값 리스트
 * @param {Array} params.priceList 가격 리스트
 * @return {number} 0-100 사이의 MACD 점수
 */
async function calculateMACDScore({
	macdList,
	priceList
}: {
	macdList: MACDData[];
	priceList: number[];
}): Promise<number> {
	if (macdList.length === 0 || priceList.length === 0) {
		return NaN;
	}

	const crossRecentCount = 10;
	const histogramRecentCount = 5;
	const extremaRecentCount = 20;

	const macdHistory: number[] = [];
	const signalHistory: number[] = [];
	const histogramHistory: number[] = [];

	for (const macdData of macdList) {
		macdHistory.push(macdData.macd);

		signalHistory.push(macdData.signal);

		histogramHistory.push(macdData.histogram);
	}

	const currentMACD: number = macdHistory[macdHistory.length - 1];
	const currentSignal: number = signalHistory[signalHistory.length - 1];
	const currentHistogram: number = histogramHistory[signalHistory.length - 1];
	// 가격 고점/저점과 MACD 고점/저점 찾기
	const period = Math.min(extremaRecentCount, Math.floor(priceList.length / 2));
	const [priceHighList, priceLowList, macdHighList, macdLowList] = await Promise.all([
		findLocalExtrema(priceList.slice(-period), 'high', {
			threshold: 0.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 3,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(priceList.slice(-period), 'low', {
			threshold: 0.5,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 3,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(macdHistory.slice(-period), 'high', {
			threshold: 1,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 3,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		}),
		findLocalExtrema(macdHistory.slice(-period), 'low', {
			threshold: 1,
			// 더 정확한 고점 검출을 위한 윈도우 크기
			window: 3,
			// 최소 3캔들 이상 유지된 극값만 고려
			minDuration: 3,
			// 최신 극값이 배열 앞쪽에 오도록 정렬
			returnReversed: true
		})
	]);

	// MACD와 시그널 라인의 관계 점수, MACD 히스토그램 점수, MACD 다이버전스 점수 계산
	const [relationScore, histogramScore, divergenceScore] = await Promise.all([
		// 1. MACD와 시그널 라인의 관계 점수 (40%)
		calculateMACDRelationScore({
			macdHistory,
			signalHistory,
			currentMACD,
			currentSignal,
			crossRecentCount,
			extremaRecentCount
		}),
		// 2. MACD 히스토그램 점수 (30%)
		calculateMACDHistogramScore({
			histogramList: histogramHistory,
			currentHistogram,
			histogramRecentCount
		}),
		// 3. MACD 다이버전스 점수 (30%)
		calculateDivergenceScore({
			priceLowList,
			priceHighList,
			targetLowList: macdLowList,
			targetHighList: macdHighList
		})
	]);

	// 시장 상황에 따른 가중치 동적 조정
	const { relationWeight, histogramWeight, divergenceWeight } = getMACDScoreWeight({
		currentMACD,
		currentSignal,
		currentHistogram
	});

	// 최종 MACD 점수 계산
	const finalMACDScore =
		relationScore * relationWeight +
		histogramScore * histogramWeight +
		divergenceScore * divergenceWeight;

	return Math.min(100, Math.max(0, finalMACDScore));
}

function calculateMACDRelationScore({
	macdHistory,
	signalHistory,
	currentMACD,
	currentSignal,
	crossRecentCount,
	extremaRecentCount
}: {
	macdHistory: number[];
	signalHistory: number[];
	currentMACD: number;
	currentSignal: number;
	crossRecentCount: number;
	extremaRecentCount: number;
}) {
	// 상수 정의
	const PROTECT_NUM = 0.0001;
	const RECENT_CROSS_THRESHOLD = 3;
	const ZERO_LINE_THRESHOLD = 0.05;
	const HIGH_VOLATILITY_THRESHOLD = 0.3;

	// MACD와 시그널 라인 격차 분석
	const gapSize: number = Math.abs(currentMACD - currentSignal);
	const prevGapSize: number = Math.abs(
		macdHistory[macdHistory.length - 2] - signalHistory[signalHistory.length - 2]
	);
	const isGapWidening: boolean = gapSize > prevGapSize;

	// 1. MACD와 시그널 라인의 관계 점수
	let relationScore = calculateBaseRelationScore();

	// 양수/음수 영역 추가 분석
	const zeroLineScore = calculateZeroLineScore();

	// 최종 점수에 양수/음수 영역 점수 반영
	relationScore = Math.max(0, Math.min(100, relationScore + zeroLineScore));

	// 변동성 기반 조정
	relationScore = adjustScoreByVolatility(relationScore);

	// 상한/하한 처리
	return Math.max(0, Math.min(100, relationScore));

	// 내부 함수: 기본 관계 점수 계산
	function calculateBaseRelationScore() {
		// 최근 크로스 확인
		const crossHistory = detectCross(macdHistory, signalHistory);
		const recentCross = crossHistory.slice(-crossRecentCount);
		const lastCrossIndex = recentCross.findLastIndex((item) => item !== 0);

		// 최근 크로스가 있는 경우
		if (lastCrossIndex !== -1 && lastCrossIndex < RECENT_CROSS_THRESHOLD) {
			const crossType = recentCross[lastCrossIndex];
			const daysSinceCross = RECENT_CROSS_THRESHOLD - lastCrossIndex;

			// MACD가 시그널 라인을 상향돌파한 직후
			if (crossType === 1) {
				return 90 + (10 * daysSinceCross) / RECENT_CROSS_THRESHOLD;
			}
			// MACD가 시그널 라인을 하향돌파한 직후
			return 10 - (10 * daysSinceCross) / RECENT_CROSS_THRESHOLD;
		}

		// 크로스가 없는 경우 상대적 위치로 점수 계산
		const signalAbsWithProtection = currentSignal === 0 ? PROTECT_NUM : Math.abs(currentSignal);
		const gapRatio = gapSize / signalAbsWithProtection;

		if (currentMACD > currentSignal) {
			// MACD가 시그널 라인 위에 있는 경우
			return isGapWidening
				? 70 + 20 * gapRatio // 격차 확대
				: 50 + 20 * gapRatio; // 격차 축소
		}

		// MACD가 시그널 라인 아래에 있는 경우
		return isGapWidening
			? 10 + 20 * (1 - gapRatio) // 격차 확대
			: 30 + 20 * (1 - gapRatio); // 격차 축소
	}

	// 내부 함수: 0선 교차 분석 점수
	function calculateZeroLineScore() {
		// 양수 영역 분석 (MACD와 시그널 모두 양수)
		if (currentMACD > 0 && currentSignal > 0) {
			// 양수 영역에서 MACD > 시그널
			if (currentMACD > currentSignal) {
				return 15;
			}

			// 격차 축소: 10, 격차 확대: 5
			return isGapWidening ? 5 : 10;
		}

		// 음수 영역 분석 (MACD와 시그널 모두 음수)
		if (currentMACD < 0 && currentSignal < 0) {
			if (currentMACD > currentSignal) {
				// 반등 가능성: 5 약한 반등 신호: 0
				return isGapWidening ? 5 : 0;
			}
			// 약세 지속
			return -10;
		}

		// 0선 교차 분석 (MACD 또는 시그널이 0선 주변에 있는 경우)
		if (
			Math.abs(currentMACD) < ZERO_LINE_THRESHOLD ||
			Math.abs(currentSignal) < ZERO_LINE_THRESHOLD
		) {
			// 상승 반전
			if (currentMACD > 0 && currentMACD > currentSignal) {
				return 10;
			}
			// 하락 반전
			if (currentMACD < 0 && currentMACD < currentSignal) {
				return -10;
			}
		}

		return 0; // 기타 경우
	}

	// 내부 함수: 변동성에 따른 점수 조정
	function adjustScoreByVolatility(score: number) {
		const volatility = calculatePriceChangeVolatility(macdHistory.slice(-extremaRecentCount));

		// 변동성이 높을 때 시그널 크로스 중요도 감소
		if (volatility > HIGH_VOLATILITY_THRESHOLD) {
			return score * 0.8 + 10;
		}

		return score;
	}
}

function calculateMACDHistogramScore({
	histogramList,
	currentHistogram,
	histogramRecentCount
}: {
	histogramList: number[];
	currentHistogram: number;
	histogramRecentCount: number;
}): number {
	// 상수 정의
	const NEUTRAL_SCORE = 50;
	const NEAR_ZERO_THRESHOLD = 0.1;
	const TREND_MULTIPLIER_POSITIVE = 40;
	const TREND_MULTIPLIER_NEGATIVE = 30;
	const HISTOGRAM_MULTIPLIER = 20;

	// 가중 변화율 계산
	const startIdx = Math.max(0, histogramList.length - histogramRecentCount);
	const weightedTrend = calculateWeightedTrend(histogramList, startIdx);

	// 점수 계산
	return calculateScoreFromTrend(currentHistogram, weightedTrend);

	// 내부 함수: 가중 추세 계산
	function calculateWeightedTrend(data: number[], startIndex: number): number {
		if (startIndex >= data.length - 1) {
			return 0;
		}

		let weightedSum = 0;
		let weightSum = 0;

		for (let i = startIndex + 1, weight = 1; i < data.length; i++, weight++) {
			const change = data[i] - data[i - 1];
			weightedSum += change * weight;
			weightSum += weight;
		}

		return weightSum > 0 ? weightedSum / weightSum : 0;
	}

	// 내부 함수: 추세와 현재값으로 점수 계산
	function calculateScoreFromTrend(histogram: number, trend: number): number {
		// 양수 히스토그램
		if (histogram > 0) {
			// 상승 추세 (강한 매수 신호)
			if (trend > 0) {
				return 80 + Math.min(20, trend * TREND_MULTIPLIER_POSITIVE);
			}
			// 하락/안정 추세 (약한 매수 신호)
			return 60 + Math.min(20, histogram * HISTOGRAM_MULTIPLIER);
		}

		// 중립 신호 (0 근처)
		if (Math.abs(histogram) < NEAR_ZERO_THRESHOLD) {
			return NEUTRAL_SCORE;
		}

		// 음수 히스토그램
		if (trend >= 0) {
			// 상승 추세 (반등 가능성)
			return 20 + Math.min(20, trend * TREND_MULTIPLIER_POSITIVE);
		}
		// 하락 추세 (매도 신호)
		return 20 - Math.min(20, Math.abs(trend) * TREND_MULTIPLIER_NEGATIVE);
	}
}

function getMACDScoreWeight({
	currentMACD,
	currentSignal,
	currentHistogram
}: {
	currentMACD: number;
	currentSignal: number;
	currentHistogram: number;
}) {
	// MACD가 0선 근처에서 크로스할 때 크로스 가중치 증가
	if (Math.abs(currentMACD) < 0.1 && Math.abs(currentMACD - currentSignal) < 0.05) {
		return {
			relationWeight: 0.5,
			histogramWeight: 0.3,
			divergenceWeight: 0.2
		};
	}

	// 히스토그램이 극단값일 때 히스토그램 가중치 증가
	if (Math.abs(currentHistogram) > 0.5) {
		return {
			relationWeight: 0.35,
			histogramWeight: 0.4,
			divergenceWeight: 0.25
		};
	}

	return {
		relationWeight: 0.4,
		histogramWeight: 0.3,
		divergenceWeight: 0.3
	};
}

/**
 * Stochastic 점수 계산
 * @param {Object} params Stochastic 관련 정보
 * @param {Array} params.stochasticList Stochastic 값 리스트
 * @return {number} 0-100 사이의 Stochastic 점수
 */
async function calculateStochasticScore({
	stochasticList
}: {
	stochasticList: StochasticData[];
}): Promise<number> {
	if (stochasticList.length === 0) {
		return NaN;
	}

	const kList: number[] = [];
	const dList: number[] = [];

	for (const stochasticData of stochasticList) {
		kList.push(stochasticData.k);
		dList.push(stochasticData.d);
	}

	// 크로스 감지 및 분석
	const crossHistory: number[] = detectCross(kList, dList);
	const recentCross: number[] = crossHistory.slice(-STOCHASTIC_THRESHOLDS.RECENT_CROSS);
	const lastCrossIndex: number = recentCross.findLastIndex((item) => item != 0);

	const currentK: number = kList[kList.length - 1];
	const currentD: number = dList[dList.length - 1];
	const avgLevel = (currentK + currentD) / 2;

	// Stochastic Slow 레벨 점수, %K와 %D 교차 점수, Stochastic Slow 방향성 점수 계산
	const [levelScore, crossScore, directionScore] = await Promise.all([
		// 1. Stochastic Slow 레벨 점수 (40%)
		calculateStochasticLevelScore({
			currentK,
			currentD,
			kList,
			avgLevel
		}),
		// 2. %K와 %D 교차 점수 (40%)
		calculateStochasticCrossScore({
			kList,
			dList,
			currentK,
			currentD,
			avgLevel,
			lastCrossIndex,
			recentCross
		}),
		// 3. Stochastic Slow 방향성 점수 (20%)
		calculateStochasticDirectionScore({
			kList,
			dList
		})
	]);

	// 최종 점수 계산 - 시장 상황에 따른 가중치 동적 조정
	const { LEVEL, CROSS, DIRECTION } = getStochasticScoreWeight({
		avgLevel,
		lastCrossIndex
	});

	// 최종 Stochastic Slow 점수 계산
	const finalStochasticScore = levelScore * LEVEL + crossScore * CROSS + directionScore * DIRECTION;

	return Math.min(100, Math.max(0, finalStochasticScore));
}

async function calculateStochasticLevelScore({
	currentK,
	currentD,
	kList,
	avgLevel
}: {
	currentK: number;
	currentD: number;
	kList: number[];
	avgLevel: number;
}) {
	// 레벨 지속 기간 확인 - 과매도/과매수 상태의 지속 기간
	let oversoldCount = 0;
	let overboughtCount = 0;

	for (const k of kList.slice(-5)) {
		if (k <= STOCHASTIC_THRESHOLDS.OVERSOLD) {
			oversoldCount++;
		}

		if (k >= STOCHASTIC_THRESHOLDS.OVERBOUGHT) {
			overboughtCount++;
		}
	}

	// 1. Stochastic Slow 레벨 점수
	let levelScore;

	// 레벨 점수 계산 개선 - 지속 기간 반영
	if (currentK <= STOCHASTIC_THRESHOLDS.OVERSOLD && currentD <= STOCHASTIC_THRESHOLDS.OVERSOLD) {
		// 과매도 상태 - 지속 기간 가중치 추가
		levelScore = 80 + (STOCHASTIC_THRESHOLDS.OVERSOLD - avgLevel) + Math.min(10, oversoldCount * 2);
	} else if (
		currentK <= STOCHASTIC_THRESHOLDS.LOW_LEVEL &&
		currentD <= STOCHASTIC_THRESHOLDS.LOW_LEVEL
	) {
		levelScore = 70 + (STOCHASTIC_THRESHOLDS.LOW_LEVEL - avgLevel);
	} else if (
		currentK <= STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL &&
		currentD <= STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL
	) {
		levelScore = 50 + (STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL - avgLevel);
	} else if (
		currentK <= STOCHASTIC_THRESHOLDS.HIGH_LEVEL &&
		currentD <= STOCHASTIC_THRESHOLDS.HIGH_LEVEL
	) {
		levelScore = 50 - (avgLevel - STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL);
	} else if (
		currentK <= STOCHASTIC_THRESHOLDS.OVERBOUGHT &&
		currentD <= STOCHASTIC_THRESHOLDS.OVERBOUGHT
	) {
		levelScore = 20 - (avgLevel - STOCHASTIC_THRESHOLDS.HIGH_LEVEL);
	} else {
		// 과매수 상태 - 지속 기간 가중치 추가
		levelScore =
			20 - (avgLevel - STOCHASTIC_THRESHOLDS.OVERBOUGHT) - Math.min(10, overboughtCount * 2);
	}

	// 상한/하한 처리
	return Math.max(0, Math.min(100, levelScore));
}

async function calculateStochasticCrossScore({
	kList,
	dList,
	currentK,
	currentD,
	avgLevel,
	lastCrossIndex,
	recentCross
}: {
	kList: number[];
	dList: number[];
	currentK: number;
	currentD: number;
	avgLevel: number;
	lastCrossIndex: number;
	recentCross: number[];
}): Promise<number> {
	// 교차가 있는 경우와 없는 경우로 로직 분리
	if (lastCrossIndex !== -1) {
		return await calculateCrossWithCrossoverScore(
			kList,
			currentK,
			currentD,
			avgLevel,
			lastCrossIndex,
			recentCross
		);
	} else {
		return await calculateCrossWithoutCrossoverScore(kList, dList, currentK, currentD, avgLevel);
	}

	/**
	 * 교차가 발생한 경우의 교차 점수 계산
	 */
	async function calculateCrossWithCrossoverScore(
		kList: number[],
		currentK: number,
		currentD: number,
		avgLevel: number,
		lastCrossIndex: number,
		recentCross: number[]
	): Promise<number> {
		const crossType = recentCross[lastCrossIndex];
		const crossGap = Math.abs(currentK - currentD);
		const crossStrengthFactor = Math.min(1.2, 1 + crossGap / 10);
		const daysSinceCross = recentCross.length - lastCrossIndex - 1;
		const durationFactor = Math.min(1.1, 1 + daysSinceCross / 10);

		let crossScore = STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL; // 기본값

		if (crossType === 1) {
			// 상향 돌파
			if (avgLevel <= STOCHASTIC_THRESHOLDS.OVERSOLD) {
				crossScore = 90 + (STOCHASTIC_THRESHOLDS.OVERSOLD - avgLevel) * 0.5;
			} else if (avgLevel <= STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL) {
				crossScore = 70 + ((STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL - avgLevel) * 20) / 30;
			} else if (avgLevel <= STOCHASTIC_THRESHOLDS.HIGH_LEVEL) {
				// 별도 처리하고 바로 반환
				crossScore = 50 + STOCHASTIC_THRESHOLDS.HIGH_LEVEL - avgLevel;

				return Math.max(0, Math.min(100, crossScore * 0.9));
			}

			crossScore *= crossStrengthFactor * durationFactor;
		} else if (crossType === -1) {
			// 하향 돌파
			if (avgLevel >= STOCHASTIC_THRESHOLDS.OVERBOUGHT) {
				crossScore = 10 - (avgLevel - STOCHASTIC_THRESHOLDS.OVERBOUGHT) * 0.5;
			} else if (avgLevel >= STOCHASTIC_THRESHOLDS.HIGH_LEVEL) {
				crossScore = 10 + ((STOCHASTIC_THRESHOLDS.OVERBOUGHT - avgLevel) * 20) / 10;
			} else if (avgLevel >= STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL) {
				crossScore = 30 + STOCHASTIC_THRESHOLDS.HIGH_LEVEL - avgLevel;
				// 별도 처리하고 바로 반환
				return Math.max(0, Math.min(100, crossScore * 0.9));
			}

			crossScore *= crossStrengthFactor * durationFactor;
		}

		// 변동성 기반 조정
		const volatility = calculatePriceChangeVolatility(
			kList.slice(-STOCHASTIC_THRESHOLDS.RECENT_CROSS)
		);

		if (volatility > STOCHASTIC_THRESHOLDS.HIGH_VOLATILITY) {
			crossScore *= 0.8;
		} else if (volatility < STOCHASTIC_THRESHOLDS.LOW_VOLATILITY) {
			crossScore *= 1.1;
		}

		return Math.max(0, Math.min(100, crossScore));
	}

	/**
	 * 교차가 없는 경우의 교차 점수 계산
	 */
	async function calculateCrossWithoutCrossoverScore(
		kList: number[],
		dList: number[],
		currentK: number,
		currentD: number,
		avgLevel: number
	): Promise<number> {
		// 최근 데이터만 추출하여 분석
		const recentKList = kList.slice(-STOCHASTIC_THRESHOLDS.RECENT_CROSS);
		const recentDList = dList.slice(-STOCHASTIC_THRESHOLDS.RECENT_CROSS);

		const [kTrend, dTrend] = await Promise.all([
			calculateSlope(recentKList),
			calculateSlope(recentDList)
		]);

		const trendStrength = Math.abs(kTrend) + Math.abs(dTrend) / 2;
		let crossScore; // 기본값

		// 현재 추세 강도에 따른 점수 계산
		if (currentK > currentD && kTrend > 0 && dTrend > 0) {
			// 강한 상승 추세
			crossScore = 70 + Math.min(10, trendStrength * 5);
		} else if (currentK > currentD) {
			// 약한 상승 신호
			crossScore = 60;
		} else if (currentK < currentD && kTrend < 0 && dTrend < 0) {
			// 강한 하락 추세
			crossScore = 30 - Math.min(10, trendStrength * 5);
		} else if (currentK < currentD) {
			// 약한 하락 신호
			crossScore = 40;
		} else {
			// 횡보
			crossScore = STOCHASTIC_THRESHOLDS.NEUTRAL_LEVEL;
		}

		// 극단적인 레벨에서는 점수 조정
		if (
			avgLevel <= STOCHASTIC_THRESHOLDS.OVERSOLD ||
			avgLevel >= STOCHASTIC_THRESHOLDS.OVERBOUGHT
		) {
			crossScore = crossScore * 0.7 + (avgLevel <= STOCHASTIC_THRESHOLDS.OVERSOLD ? 25 : 5);
		}

		return Math.max(0, Math.min(100, crossScore));
	}
}

async function calculateStochasticDirectionScore({
	kList,
	dList
}: {
	kList: number[];
	dList: number[];
}) {
	// 필요한 배열 부분만 한 번씩 추출
	const recentKList: number[] = kList.slice(-STOCHASTIC_THRESHOLDS.RECENT_DIRECTION);
	const recentDList: number[] = dList.slice(-STOCHASTIC_THRESHOLDS.RECENT_DIRECTION);
	const prevKList: number[] = kList.slice(-STOCHASTIC_THRESHOLDS.RECENT_DIRECTION - 3, -3);
	const prevDList: number[] = dList.slice(-STOCHASTIC_THRESHOLDS.RECENT_DIRECTION - 3, -3);

	// 추세 계산
	const [currentKTrend, currentDTrend, prevKTrend, prevDTrend] = await Promise.all([
		calculateSlope(recentKList),
		calculateSlope(recentDList),
		calculateSlope(prevKList),
		calculateSlope(prevDList)
	]);

	// 가속도 계산 (추세 변화량)
	const kAcceleration: number = currentKTrend - prevKTrend;
	const dAcceleration: number = currentDTrend - prevDTrend;
	const avgAcceleration: number = (kAcceleration + dAcceleration) / 2;
	const avgTrend: number = (currentKTrend + currentDTrend) / 2;

	// 방향성 점수 계산
	let directionScore;

	// 방향성과 가속도 모두 고려
	if (currentKTrend > 0.7 && currentDTrend > 0.5) {
		// 강한 상승 추세
		directionScore = 80 + 20 * Math.min(1, avgTrend + Math.max(0, avgAcceleration));
	} else if (currentKTrend > 0 && currentDTrend > 0) {
		// 약한 상승 추세
		directionScore = 60 + 20 * Math.min(1, avgTrend + Math.max(0, avgAcceleration));
	} else if ((currentKTrend > 0 && currentDTrend < 0) || (currentKTrend < 0 && currentDTrend > 0)) {
		// 추세 혼재 - 가속도로 방향 예측
		directionScore = 50 + 10 * Math.min(1, Math.max(-1, avgAcceleration));
	} else if (currentKTrend < 0 && currentDTrend < 0 && Math.abs(avgTrend) < 0.7) {
		// 약한 하락 추세
		directionScore = 40 - 20 * Math.min(1, Math.abs(avgTrend) + Math.max(0, -avgAcceleration));
	} else {
		// 강한 하락 추세
		directionScore = 20 - 20 * Math.min(1, Math.abs(avgTrend) + Math.max(0, -avgAcceleration));
	}

	// 상한/하한 처리
	return Math.max(0, Math.min(100, directionScore));
}

function getStochasticScoreWeight({
	avgLevel,
	lastCrossIndex
}: {
	avgLevel: number;
	lastCrossIndex: number;
}) {
	// 극단적인 과매수/과매도 상태에서 레벨 가중치 증가
	if (
		avgLevel <= STOCHASTIC_THRESHOLDS.EXTREME_OVERSOLD ||
		avgLevel >= STOCHASTIC_THRESHOLDS.EXTREME_OVERBOUGHT
	) {
		return STOCHASTIC_WEIGHTS.EXTREME_LEVEL;
	}

	// 교차 발생 직후에는 교차 가중치 증가
	if (lastCrossIndex >= 0 && lastCrossIndex <= 2) {
		return STOCHASTIC_WEIGHTS.RECENT_CROSS;
	}

	// 기본 가중치
	return STOCHASTIC_WEIGHTS.DEFAULT;
}

/**
 * Stochastic RSI 점수 계산
 * @param {Object} params Stochastic RSI 관련 정보
 * @param {Array} params.stochasticRSIList Stochastic RSI 값 리스트
 * @return {number} 0-100 사이의 Stochastic RSI 점수
 */
async function calculateStochasticRSIScore({
	stochasticRSIList
}: {
	stochasticRSIList: StochasticRSIData[];
}): Promise<number> {
	if (stochasticRSIList.length === 0) {
		return NaN;
	}

	const kList: number[] = [];
	const dList: number[] = [];
	const rsiList: number[] = [];

	for (const stochasticRSIData of stochasticRSIList) {
		kList.push(stochasticRSIData.k);
		dList.push(stochasticRSIData.d);
		rsiList.push(stochasticRSIData.rsi);
	}

	const currentK: number = kList[kList.length - 1];
	const currentD: number = dList[dList.length - 1];
	const currentRSI: number = rsiList[rsiList.length - 1];
	const avgLevel = (currentK + currentD) / 2;

	// Stochastic RSI 레벨 점수, K와 D 교차 점수, 방향성 점수 계산, RSI 일관성 점수, 패턴 점수 계산
	const [levelScore, crossScore, directionScore, rsiConsistencyScore, patternScore] =
		await Promise.all([
			// 1. Stochastic RSI 레벨 점수 (40%)
			calculateStochasticRSILevelScore({
				kList,
				rsiList,
				currentK,
				currentD,
				currentRSI,
				avgLevel
			}),

			// 2. K와 D 교차 점수 (40%)
			calculateStochasticRSICrossScore({
				kList,
				dList,
				rsiList,
				currentK,
				currentD,
				currentRSI,
				avgLevel
			}),

			// 3. Stochastic RSI 방향성 점수 (20%)
			calculateStochasticRSIDirectionScore({
				kList,
				dList,
				rsiList
			}),

			// 4. RSI와 Stochastic RSI 일관성 점수 (10%)
			calculateRSIConsistencyScore({
				kList,
				dList,
				rsiList,
				currentK,
				currentD,
				currentRSI
			}),

			// 5. 반복 패턴 감지 점수 (10%)
			calculatePatternScore({
				kList,
				dList
			})
		]);

	// 시장 상황에 따른 가중치 동적 조정
	const { levelWeight, crossWeight, directionWeight, consistencyWeight, patternWeight } =
		await getStochasticRSIScoreWeight({
			kList,
			dList,
			rsiList,
			avgLevel
		});

	// 최종 Stochastic RSI 점수 계산
	const finalStochasticRSIScore =
		levelScore * levelWeight +
		crossScore * crossWeight +
		directionScore * directionWeight +
		rsiConsistencyScore * consistencyWeight +
		patternScore * patternWeight;

	return Math.min(100, Math.max(0, finalStochasticRSIScore));
}

// 1. Stochastic RSI 레벨 점수 계산
async function calculateStochasticRSILevelScore({
	kList,
	rsiList,
	currentK,
	currentD,
	currentRSI,
	avgLevel
}: {
	kList: number[];
	rsiList: number[];
	currentK: number;
	currentD: number;
	currentRSI: number;
	avgLevel: number;
}): Promise<number> {
	// 최근 데이터 추출 (한 번만 계산)
	const recentKList = kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_LEVEL);
	const recentRSIList = rsiList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_LEVEL);

	// 과매도/과매수 상태 지속 기간
	const oversoldCount = recentKList.filter((k) => k <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD).length;
	const overboughtCount = recentKList.filter(
		(k) => k >= STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT
	).length;

	// RSI와 스토캐스틱 RSI 추세 계산
	const [rsiTrend, stochRSITrend] = await Promise.all([
		calculateSlope(recentRSIList),
		calculateSlope(recentKList)
	]);

	// 추세 분석 및 조정 계수 계산
	const trendDirectionMatch = Math.sign(rsiTrend) === Math.sign(stochRSITrend);
	// 추세 강도 비율 (일치할 때만 계산)
	const trendStrengthRatio =
		trendDirectionMatch && rsiTrend !== 0 && stochRSITrend !== 0
			? Math.min(Math.abs(rsiTrend), Math.abs(stochRSITrend)) /
				Math.max(Math.abs(rsiTrend), Math.abs(stochRSITrend))
			: 0;

	// 추세 조정 계수
	const trendAlignmentFactor = trendDirectionMatch
		? 1 + trendStrengthRatio * 0.2 // 추세 일치 시 최대 20% 보너스
		: 0.8; // 추세 불일치 시 20% 페널티

	// RSI 값 활용하여 신호 품질 강화 (추세 정보 포함)
	const rsiAdjustment = calculateRSIAdjustment(currentRSI, rsiTrend) * trendAlignmentFactor;

	// 레벨 기반 점수 계산
	const levelScore = calculateBaseScoreByLevel();

	return Math.max(0, Math.min(100, levelScore));

	function calculateRSIAdjustment(currentRSI: number, rsiTrend: number): number {
		// RSI 값과 추세를 기반으로 신호 조정 계수 계산
		if (currentRSI < STOCHASTIC_RSI_THRESHOLDS.OVERSOLD && rsiTrend > 0) {
			// 과매도 + 반등 조짐: 매우 강한 매수 신호
			return 1.2;
		} else if (currentRSI < STOCHASTIC_RSI_THRESHOLDS.OVERSOLD) {
			// 과매도 지속: 강한 매수 신호이나 타이밍은 불확실
			return 1.1;
		} else if (currentRSI > STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT && rsiTrend < 0) {
			// 과매수 + 하락 조짐: 매우 강한 매도 신호
			return 0.8;
		} else if (currentRSI > STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT) {
			// 과매수 지속: 강한 매도 신호이나 타이밍은 불확실
			return 0.9;
		} else {
			// 중립 구간: 정상 가중치
			return 1.0;
		}
	}

	// 내부 함수: 레벨 기반 기본 점수 계산
	function calculateBaseScoreByLevel(): number {
		// 과매도 구간: 80-100점
		if (
			currentK <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD &&
			currentD <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD
		) {
			const score = 80 + Math.min(20, oversoldCount * 4);
			return score * rsiAdjustment;
		}

		// 매도 구간: 60-80점
		if (
			currentK <= STOCHASTIC_RSI_THRESHOLDS.LOWSOLD &&
			currentD <= STOCHASTIC_RSI_THRESHOLDS.LOWSOLD
		) {
			const score = 60 + Math.min(20, (30 - avgLevel) * 1.5);
			return score * rsiAdjustment;
		}
		// 중립 구간: 40-60점
		// 추세 방향에 따른 중립대 스코어 조정
		if (
			currentK >= STOCHASTIC_RSI_THRESHOLDS.LOWSOLD &&
			currentK <= STOCHASTIC_RSI_THRESHOLDS.HIGHBOUGHT &&
			currentD >= STOCHASTIC_RSI_THRESHOLDS.LOWSOLD &&
			currentD <= STOCHASTIC_RSI_THRESHOLDS.HIGHBOUGHT
		) {
			const trendBonus = (stochRSITrend + rsiTrend) * 5;
			return 50 + (currentRSI > 50 ? 5 : -5) + trendBonus;
		}

		// 매수 구간: 20-40점
		if (
			currentK >= STOCHASTIC_RSI_THRESHOLDS.HIGHBOUGHT &&
			currentD >= STOCHASTIC_RSI_THRESHOLDS.HIGHBOUGHT &&
			currentK < STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT
		) {
			const score = 40 - Math.min(20, (avgLevel - 70) * 1.5);
			return score * (2 - rsiAdjustment);
		}

		// 과매수 구간: 0-20점
		if (
			currentK >= STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT &&
			currentD >= STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT
		) {
			const score = 20 - Math.min(20, overboughtCount * 4);
			return score * (2 - rsiAdjustment);
		}

		// 기타 상태: 기본값 설정
		// 중간 구간에서는 두 추세의 방향을 반영
		const combinedTrend = (stochRSITrend + rsiTrend) / 2;
		return 50 - (avgLevel - 50) * 0.5 + combinedTrend * 5;
	}
}

// 2. K와 D 교차 점수 계산
async function calculateStochasticRSICrossScore({
	kList,
	dList,
	rsiList,
	currentK,
	currentD,
	currentRSI,
	avgLevel
}: {
	kList: number[];
	dList: number[];
	rsiList: number[];
	currentK: number;
	currentD: number;
	currentRSI: number;
	avgLevel: number;
}): Promise<number> {
	const crossHistory: number[] = detectCross(kList, dList);
	const recentCross: number[] = crossHistory.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_CROSS);
	const lastCrossIndex: number = recentCross.findLastIndex((item) => item != 0);

	return lastCrossIndex !== -1
		? calculateScoreWithCross(lastCrossIndex, recentCross)
		: calculateScoreWithoutCross();

	// 교차가 있는 경우의 점수 계산
	function calculateScoreWithCross(lastCrossIndex: number, recentCross: number[]): number {
		const crossType: number = recentCross[lastCrossIndex];
		const crossGap = Math.abs(currentK - currentD); // 교차 후 이격 정도
		const crossStrengthFactor = Math.min(1.2, 1 + crossGap / 10); // 이격이 클수록 강한 신호
		const daysSinceCross = recentCross.length - lastCrossIndex - 1; // 교차 후 경과 일수
		const durationFactor = Math.min(1.15, 1 + daysSinceCross / 10); // 지속 시간 가중치

		// RSI 지지/저항 돌파 가중치
		const rsiBoost = getRSIBreakoutBoost(
			rsiList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_CROSS),
			currentRSI,
			crossType
		);

		// 교차 유형에 따른 기본 점수 계산
		let baseScore: number;

		if (crossType === 1) {
			// 골든 크로스
			if (avgLevel <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD) {
				// 과매도 구간에서 발생한 골든 크로스는 최상의 매수 신호
				baseScore = 85 + Math.min(15, crossGap * 3);
			} else if (avgLevel <= STOCHASTIC_RSI_THRESHOLDS.NEUTRAL) {
				// 중립~매도 구간에서의 골든 크로스
				baseScore = 70 + Math.min(15, crossGap * 2);
			} else {
				// 과매수 구간 근처에서의 골든 크로스는 강도 약화
				baseScore = 60 - Math.min(20, (avgLevel - 50) * 0.6);
			}
		} else {
			// 데드 크로스
			if (avgLevel >= STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT) {
				// 데드 크로스 (K가 D 하향돌파) - 매도 신호
				baseScore = 15 - Math.min(15, crossGap * 3);
			} else if (avgLevel >= STOCHASTIC_RSI_THRESHOLDS.NEUTRAL) {
				// 중립~매수 구간에서의 데드 크로스
				baseScore = 30 - Math.min(15, crossGap * 2);
			} else {
				// 과매도 구간 근처에서의 데드 크로스는 강도 약화
				baseScore = 40 + Math.min(20, (50 - avgLevel) * 0.6);
			}
		}

		// 교차 강도 및 지속성 반영
		const score = baseScore * crossStrengthFactor * durationFactor * rsiBoost;

		// 변동성 기반 조정
		const volatility = calculatePriceChangeVolatility(
			kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_CROSS)
		);

		// 변동성 이 높으면 신뢰도 감소
		if (volatility > 5) {
			return score * 0.8 + 10;
		}
		// 변동성 이 낮으면 신뢰도 증가
		else if (volatility < 2) {
			return score * 1.1;
		}

		return score;
	}

	// 교차가 없는 경우의 점수 계산
	function calculateScoreWithoutCross(): number {
		// 교차 없음 - 현재 추세 강도 분석
		const recentK = kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_CROSS);
		const recentD = dList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_CROSS);

		// 추세 계산 (비동기가 필요없음)
		const kTrend = calculateSlope(recentK);
		const dTrend = calculateSlope(recentD);

		const trendStrength = (Math.abs(kTrend) + Math.abs(dTrend)) / 2;
		const trendAlignment = Math.sign(kTrend) === Math.sign(dTrend);
		const trendBoost = trendAlignment ? 1.1 : 0.9;

		// 기본값 (중립)
		let score = 50;

		if (currentK > currentD && kTrend > 0 && dTrend > 0) {
			// 상승 추세 유지 중 (K > D, 둘 다 상승 중)
			score = 70 + Math.min(10, trendStrength * 5) * trendBoost;
		} else if (currentK > currentD) {
			// K > D 유지 상태 (방향 불일치 또는 약한 상승)
			score = 60 + Math.min(10, Math.abs(currentK - currentD));
		} else if (currentK < currentD && kTrend < 0 && dTrend < 0) {
			// 하락 추세 유지 중 (K < D, 둘 다 하락 중)
			score = 30 - Math.min(10, trendStrength * 5) * trendBoost;
		} else if (currentK < currentD) {
			// K < D 유지 상태 (방향 불일치 또는 약한 하락)
			score = 40 - Math.min(10, Math.abs(currentK - currentD));
		}

		// 극단적인 레벨에서의 조정
		if (
			avgLevel <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD ||
			avgLevel >= STOCHASTIC_RSI_THRESHOLDS.OVERBOUGHT
		) {
			const levelBoost = avgLevel <= STOCHASTIC_RSI_THRESHOLDS.OVERSOLD ? 25 : 5;
			score = score * 0.7 + levelBoost;
		}

		return score;
	}

	function getRSIBreakoutBoost(rsiList: number[], currentRSI: number, crossType: number): number {
		const rsiSupport = 40;
		const rsiResistance = 60;
		let isRSIBreakout = false;

		if (crossType === 1) {
			isRSIBreakout = rsiList.slice(0, -1).some((v) => v < rsiSupport) && currentRSI > rsiSupport;
		} else if (crossType === -1) {
			isRSIBreakout =
				rsiList.slice(0, -1).some((v) => v > rsiResistance) && currentRSI > rsiResistance;
		}

		return isRSIBreakout ? 1.15 : 1.0;
	}
}

// 3. 방향성 점수 계산
async function calculateStochasticRSIDirectionScore({
	kList,
	dList,
	rsiList
}: {
	kList: number[];
	dList: number[];
	rsiList: number[];
}): Promise<number> {
	// 현재와 이전 기울기 비교로 가속도 측정
	const { currentKTrend, currentDTrend, prevKTrend, prevDTrend, rsiTrend } = calculateTrend({
		kList,
		dList,
		rsiList
	});

	// 가속도 및 추세 계산
	const kAcceleration = currentKTrend - prevKTrend;
	const dAcceleration = currentDTrend - prevDTrend;
	const avgAcceleration = (kAcceleration + dAcceleration) / 2;
	const avgTrend = (currentKTrend + currentDTrend) / 2;

	// RSI 추세와 스토캐스틱 RSI 추세 일치 확인
	const rsiTrendAlignment = Math.sign(rsiTrend) === Math.sign(avgTrend);
	const alignmentBoost = rsiTrendAlignment ? 1.1 : 0.9;

	// 방향성 점수 계산
	let directionScore = calculateBaseDirectionScore();

	// RSI 추세 일치도 반영
	directionScore *= alignmentBoost;

	return Math.max(0, Math.min(100, directionScore));

	// 추세 계산
	function calculateTrend({
		kList,
		dList,
		rsiList
	}: {
		kList: number[];
		dList: number[];
		rsiList: number[];
	}): {
		currentKTrend: number;
		currentDTrend: number;
		prevKTrend: number;
		prevDTrend: number;
		rsiTrend: number;
	} {
		// 필요한 데이터 슬라이스
		const recentK = kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_DIRECTION);
		const recentD = dList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_DIRECTION);
		const recentRSI = rsiList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_DIRECTION);
		const prevK = kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_DIRECTION - 3, -3);
		const prevD = dList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_DIRECTION - 3, -3);

		return {
			currentKTrend: calculateSlope(recentK),
			currentDTrend: calculateSlope(recentD),
			prevKTrend: calculateSlope(prevK),
			prevDTrend: calculateSlope(prevD),
			rsiTrend: calculateSlope(recentRSI)
		};
	}

	// 내부 함수: 기본 방향성 점수 계산
	function calculateBaseDirectionScore(): number {
		// 강한 상승 추세
		if (
			currentKTrend > STOCHASTIC_RSI_THRESHOLDS.TREND_UP_STRONG &&
			currentDTrend > STOCHASTIC_RSI_THRESHOLDS.TREND_UP
		) {
			return 80 + 20 * Math.min(1, avgTrend + Math.max(0, avgAcceleration));
		}
		// 약한 상승 추세
		else if (currentKTrend > 0 && currentDTrend > 0) {
			return 60 + 20 * Math.min(1, avgTrend + Math.max(0, avgAcceleration));
		}
		// 추세 혼재 - 가속도로 방향 예측 + RSI 정보 활용
		else if ((currentKTrend > 0 && currentDTrend < 0) || (currentKTrend < 0 && currentDTrend > 0)) {
			return 50 + 10 * Math.min(1, Math.max(-1, avgAcceleration + rsiTrend * 0.5));
		}
		// 약한 하락 추세
		else if (
			currentKTrend < 0 &&
			currentDTrend < 0 &&
			Math.abs(avgTrend) < STOCHASTIC_RSI_THRESHOLDS.TREND_DOWN_WEAK
		) {
			return 40 - 20 * Math.min(1, Math.abs(avgTrend) + Math.max(0, -avgAcceleration));
		}
		// 강한 하락 추세
		else {
			return 20 - 20 * Math.min(1, Math.abs(avgTrend) + Math.max(0, -avgAcceleration));
		}
	}
}

// 4. RSI와 Stochastic RSI 일관성 점수 계산
async function calculateRSIConsistencyScore({
	kList,
	dList,
	rsiList,
	currentK,
	currentD,
	currentRSI
}: {
	kList: number[];
	dList: number[];
	rsiList: number[];
	currentK: number;
	currentD: number;
	currentRSI: number;
}): Promise<number> {
	// 필요한 데이터 슬라이스 준비 (중복 제거)
	const period = STOCHASTIC_RSI_THRESHOLDS.RECENT_RSI_CONSISTENCY;
	const recentK = kList.slice(-period);
	const recentD = dList.slice(-period);
	const recentRSI = rsiList.slice(-period);

	// 추세 계산 (비동기 처리 제거)
	const rsiTrend = calculateSlope(recentRSI);
	const kTrend = calculateSlope(recentK);
	const dTrend = calculateSlope(recentD);
	const stochRSITrend = (kTrend + dTrend) / 2;

	// 일관성 지표 계산
	const kdConsistency = Math.sign(kTrend) === Math.sign(dTrend) ? 1 : -1;
	const directionConsistency = Math.sign(rsiTrend) === Math.sign(stochRSITrend) ? 1 : -1;
	const dRSIConsistency = Math.sign(rsiTrend) === Math.sign(dTrend) ? 1 : -1;

	// 변동성 계산
	const kVolatility = calculatePriceChangeVolatility(recentK);
	const dVolatility = calculatePriceChangeVolatility(recentD);
	const volatilityRatio = dVolatility > 0 ? kVolatility / dVolatility : 1;

	// RSI와 스토캐스틱 K/D 위치 관계
	const rsiPercentile = currentRSI / 100;
	const stochRSILevel = (currentK + currentD) / 200;
	const levelConsistency = Math.abs(rsiPercentile - stochRSILevel);

	// 조정 계수 계산
	const adjustmentFactors = {
		kd: kdConsistency > 0 ? 1.1 : 0.9,
		dRSI: dRSIConsistency > 0 ? 1.15 : 0.85,
		volatility: volatilityRatio > 2 ? 0.9 : 1.0
	};

	// 점수 계산
	return calculateConsistencyScore(directionConsistency, levelConsistency, adjustmentFactors);

	// 내부 함수: 일관성 점수 계산
	function calculateConsistencyScore(
		directionConsistency: number,
		levelConsistency: number,
		factors: {
			kd: number;
			dRSI: number;
			volatility: number;
		}
	): number {
		let score = 0;
		const levelThreshold = 0.2;

		// 방향과 레벨 모두 일치 - 최고 점수
		if (directionConsistency > 0 && levelConsistency < levelThreshold) {
			score = 80 + 20 * (1 - levelConsistency);
			score *= factors.kd * factors.dRSI * factors.volatility;
		}
		// 방향은 일치하지만 레벨 차이가 있음
		else if (directionConsistency > 0) {
			score = 60 + 20 * (1 - Math.min(0.5, levelConsistency) * 2);
			score *= factors.kd * factors.dRSI * factors.volatility;
		}
		// 레벨은 일치하지만 방향이 다름 - 변곡점 가능성
		else if (levelConsistency < levelThreshold) {
			score = 40 + 20 * (1 - levelConsistency);
			score *= factors.dRSI;
		}
		// 방향과 레벨 모두 불일치 - 신뢰도 낮음
		else {
			score = 20 * (1 - Math.min(0.5, levelConsistency) * 2);
			score *= factors.volatility;
		}

		return Math.max(0, Math.min(100, score));
	}
}

// 5. 반복 패턴 감지 점수 계산
async function calculatePatternScore({
	kList,
	dList
}: {
	kList: number[];
	dList: number[];
}): Promise<number> {
	const recentK = kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_HISTORY_PATTERN);
	const recentD = dList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_HISTORY_PATTERN);

	// 방향 전환 횟수 계산
	const reversalCount = countDirectionReversals(recentK);

	// K와 D 간 상관관계 계산
	const correlation = calculateCorrelation(recentK, recentD);

	// 패턴 품질에 따른 점수 계산
	const patternScore = calculatePatternQualityScore(reversalCount, correlation);

	return Math.max(0, Math.min(100, patternScore));

	// 방향 전환 횟수 계산 함수
	function countDirectionReversals(data: number[]): number {
		let reversalCount = 0;
		let lastDirection = 0;

		for (let i = 1; i < data.length; i++) {
			const direction = Math.sign(data[i] - data[i - 1]);
			if (direction !== 0 && direction !== lastDirection && lastDirection !== 0) {
				reversalCount++;
			}
			if (direction !== 0) {
				lastDirection = direction;
			}
		}

		return reversalCount;
	}

	// K와 D 간 상관관계 계산 함수
	function calculateCorrelation(dataK: number[], dataD: number[]): number {
		let sum = 0;
		for (let i = 0; i < dataK.length; i++) {
			sum += dataK[i] > dataD[i] ? 1 : -1;
		}
		return Math.abs(sum) / dataK.length;
	}

	// 패턴 품질 점수 계산 함수
	function calculatePatternQualityScore(reversalCount: number, correlation: number): number {
		const OPTIMAL_REVERSALS_MIN = 2;
		const OPTIMAL_REVERSALS_MAX = 4;
		const CORRELATION_HIGH = 0.7;
		// 이상적인 패턴: 적절한 방향 전환과 강한 상관관계
		if (
			reversalCount >= OPTIMAL_REVERSALS_MIN &&
			reversalCount <= OPTIMAL_REVERSALS_MAX &&
			correlation > CORRELATION_HIGH
		) {
			return 80 + Math.min(20, correlation * 20);
		}
		// 노이즈가 많은 패턴: 방향 전환이 너무 빈번
		else if (reversalCount > OPTIMAL_REVERSALS_MAX) {
			return 40 - Math.min(40, (reversalCount - OPTIMAL_REVERSALS_MAX) * 10);
		}
		// 경직된 패턴: 방향 전환이 너무 적음
		else if (reversalCount < OPTIMAL_REVERSALS_MIN) {
			return 60 - Math.min(20, (OPTIMAL_REVERSALS_MIN - reversalCount) * 10);
		}
		// 약한 상관관계: 불안정한 패턴
		else {
			return 50 + Math.min(20, correlation * 30);
		}
	}
}

async function getStochasticRSIScoreWeight({
	kList,
	dList,
	rsiList,
	avgLevel
}: {
	kList: number[];
	dList: number[];
	rsiList: number[];
	avgLevel: number;
}) {
	// 변동성 계산
	const volatility = calculatePriceChangeVolatility(
		kList.slice(-STOCHASTIC_RSI_THRESHOLDS.RECENT_VOLATILITY)
	);

	// 극단적인 과매수/과매도 상태에서 레벨 가중치 증가
	if (avgLevel <= 10 || avgLevel >= 90) {
		return {
			levelWeight: 0.4,
			crossWeight: 0.25,
			directionWeight: 0.15,
			consistencyWeight: 0.1,
			patternWeight: 0.1
		};
	}

	// 변동성이 높을 때 패턴과 일관성 중요도 증가
	if (volatility > 8) {
		return {
			levelWeight: 0.25,
			crossWeight: 0.25,
			directionWeight: 0.2,
			consistencyWeight: 0.15,
			patternWeight: 0.15
		};
	}

	// 급격한 반전 징후 감지
	const reversalSignal = await detectStochasticRSIReversal(kList, dList, rsiList, 5);

	// 급격한 반전 징후가 있을 때 교차와 방향성 중요도 증가
	if (reversalSignal) {
		return {
			levelWeight: 0.2,
			crossWeight: 0.35,
			directionWeight: 0.25,
			consistencyWeight: 0.1,
			patternWeight: 0.1
		};
	}

	return {
		levelWeight: 0.3,
		crossWeight: 0.3,
		directionWeight: 0.2,
		consistencyWeight: 0.1,
		patternWeight: 0.1
	};

	/**
	 * 반전 신호 감지 함수
	 * @param kList K값 배열
	 * @param dList D값 배열
	 * @param rsiList RSI 값 배열
	 * @param period 분석할 기간
	 * @param returnSignalStrength 신호 강도 반환 여부
	 * @return 반전 신호 존재 여부(boolean) 또는 강도(number)
	 */
	async function detectStochasticRSIReversal(
		kList: number[],
		dList: number[],
		rsiList: number[],
		period: number = 5,
		returnSignalStrength: boolean = false
	): Promise<boolean | number> {
		if (kList.length < period || dList.length < period || rsiList.length < period) {
			return returnSignalStrength ? 0 : false;
		}

		// 최근 데이터 추출
		const recentK = kList.slice(-period);
		const recentD = dList.slice(-period);
		const recentRSI = rsiList.slice(-period);

		// 현재 값과 이전 값
		const currentK = recentK[recentK.length - 1];
		const currentD = recentD[recentD.length - 1];
		const currentRSI = recentRSI[recentRSI.length - 1];
		const prevK = recentK[recentK.length - 2];
		const prevD = recentD[recentD.length - 2];
		const prevRSI = recentRSI[recentRSI.length - 2];

		// K와 D 교차 확인
		const hasCross = detectCross(recentK, recentD).some((val) => val !== 0);

		// 극단 영역 및 과매수/과매도 확인
		const isExtreme = (currentK > 80 || currentK < 20) && (currentD > 80 || currentD < 20);
		const isOverbought = currentRSI > 70;
		const isOversold = currentRSI < 30;

		// 추세 방향 확인
		const rsiTrend = calculateSlope(recentRSI);
		const kTrend = calculateSlope(recentK);

		// 기본 반전 신호 감지
		const hasReversalSignal =
			hasCross &&
			isExtreme &&
			((isOverbought && rsiTrend < 0) || (isOversold && rsiTrend > 0)) &&
			Math.sign(rsiTrend) !== Math.sign(kTrend);

		// 불리언 결과만 원하는 경우
		if (!returnSignalStrength) {
			return hasReversalSignal;
		}

		// 아래는 신호 강도 계산 로직
		let reversalSignal = 0;

		// 1. 과매수/과매도 상태에서의 반전 감지
		if ((prevK >= 80 && currentK < 80) || (prevD >= 80 && currentD < 80)) {
			reversalSignal += 1;
			if (currentRSI < prevRSI) {
				reversalSignal += 0.5;
			}
		} else if ((prevK <= 20 && currentK > 20) || (prevD <= 20 && currentD > 20)) {
			reversalSignal += 1;
			if (currentRSI > prevRSI) {
				reversalSignal += 0.5;
			}
		}

		// 2. 교차 패턴 강도 평가
		if (hasCross) {
			reversalSignal += 0.5;
			const avgLevel = (currentK + currentD) / 2;
			if (avgLevel >= 75 || avgLevel <= 25) {
				reversalSignal += 0.5;
			}
		}

		// 3. 추세 변화 속도 분석 (정밀 계산이 필요한 경우)
		if (Math.abs(rsiTrend) > 0.5 && Math.abs(kTrend) > 0.5) {
			const slopeIntensity = Math.min(3, Math.abs(rsiTrend) + Math.abs(kTrend));
			reversalSignal += slopeIntensity / 6;
		}

		return Math.min(3, reversalSignal);
	}
}

/**
 * 가격과 기술적 지표 간의 다이버전스를 분석하여 점수 계산
 * @param priceLowList 가격의 저점 목록
 * @param priceHighList 가격의 고점 목록
 * @param targetLowList 기술적 지표의 저점 목록
 * @param targetHighList 기술적 지표의 고점 목록
 * @returns 0(매도 신호)~100(매수 신호) 사이의 다이버전스 점수
 */
function calculateDivergenceScore({
	priceLowList,
	priceHighList,
	targetLowList,
	targetHighList
}: {
	priceLowList: ExtremaResult[];
	priceHighList: ExtremaResult[];
	targetLowList: ExtremaResult[];
	targetHighList: ExtremaResult[];
}) {
	const DEFAULT_SCORE = 50;

	// 긍정적 다이버전스 (가격 신저가, MACD 신저가 없음)
	if (priceLowList.length >= 2 && targetLowList.length >= 2) {
		return calculateBullishDivergence(priceLowList, targetLowList);
	}

	// 부정적 다이버전스 (가격 신고가, target 신고가 없음)
	if (priceHighList.length >= 2 && targetHighList.length >= 2) {
		return calculateBearishDivergence(priceHighList, targetHighList);
	}

	// 다이버전스 없음
	return DEFAULT_SCORE;

	/**
	 * 긍정적 다이버전스 계산 (가격 신저가, 지표 신저가 없음 - 매수 신호)
	 */
	function calculateBullishDivergence(
		priceLowList: ExtremaResult[],
		targetLowList: ExtremaResult[]
	): number {
		// 최근점(0)과 이전점(1) 추출
		const [recentPoint, previousPoint] = extractPoints(priceLowList, targetLowList);

		// 긍정적 다이버전스 조건 확인: 가격은 하락, 지표는 상승
		if (
			!isBullishDivergence(
				recentPoint.price,
				previousPoint.price,
				recentPoint.target,
				previousPoint.target
			)
		) {
			return DEFAULT_SCORE;
		}

		// 다이버전스 강도 계산
		const { changePercent, strengthFactor } = calculateDivergenceStrength(
			recentPoint.price,
			previousPoint.price,
			recentPoint.target,
			previousPoint.target,
			priceLowList[0],
			targetLowList[0]
		);

		// 강한 다이버전스 (둘 다 3% 이상 변화)
		if (isStrongDivergence(changePercent.price, changePercent.target, true)) {
			return Math.min(100, 80 + strengthFactor);
		}
		// 중간 다이버전스
		else if (isModerateDivergence(changePercent.price, changePercent.target, true)) {
			return Math.min(90, 60 + strengthFactor);
		}
		// 약한 다이버전스
		else {
			return Math.min(80, 55 + strengthFactor);
		}
	}

	/**
	 * 부정적 다이버전스 계산 (가격 신고가, 지표 신고가 없음 - 매도 신호)
	 */
	function calculateBearishDivergence(
		priceHighList: ExtremaResult[],
		targetHighList: ExtremaResult[]
	): number {
		// 최근점(0)과 이전점(1) 추출
		const [recentPoint, previousPoint] = extractPoints(priceHighList, targetHighList);

		// 부정적 다이버전스 조건 확인: 가격은 상승, 지표는 하락
		if (
			!isBearishDivergence(
				recentPoint.price,
				previousPoint.price,
				recentPoint.target,
				previousPoint.target
			)
		) {
			return DEFAULT_SCORE;
		}

		// 다이버전스 강도 계산
		const { changePercent, strengthFactor } = calculateDivergenceStrength(
			recentPoint.price,
			previousPoint.price,
			recentPoint.target,
			previousPoint.target,
			priceHighList[0],
			targetHighList[0]
		);

		// 강도에 따른 점수 반환
		if (isStrongDivergence(changePercent.price, changePercent.target, false)) {
			return Math.max(0, 20 - strengthFactor);
		} else if (isModerateDivergence(changePercent.price, changePercent.target, false)) {
			return Math.max(10, 40 - strengthFactor);
		} else {
			return Math.max(20, 45 - strengthFactor);
		}
	}

	// 헬퍼 함수들 (실제 구현에서는 함수 정의 필요)
	function extractPoints(priceList: ExtremaResult[], targetList: ExtremaResult[]) {
		return [
			{ price: priceList[0].value, target: targetList[0].value },
			{ price: priceList[1].value, target: targetList[1].value }
		];
	}

	function isBullishDivergence(
		price1: number,
		price2: number,
		target1: number,
		target2: number
	): boolean {
		return price1 < price2 && target1 > target2;
	}

	function isBearishDivergence(
		price1: number,
		price2: number,
		target1: number,
		target2: number
	): boolean {
		return price1 > price2 && target1 < target2;
	}

	function calculateDivergenceStrength(
		price1: number,
		price2: number,
		target1: number,
		target2: number,
		pricePoint: ExtremaResult,
		targetPoint: ExtremaResult
	) {
		// 변화율 계산
		const priceChangePercent = ((price2 - price1) / price2) * 100;
		const targetChangePercent = ((target1 - target2) / target2) * 100;

		// 지속기간 및 강도 고려
		const priceDuration = pricePoint.duration || 0;
		const targetDuration = targetPoint.duration || 0;
		const durationFactor = Math.min(1.5, (priceDuration + targetDuration) / 10);

		const priceStrength = pricePoint.strength;
		const targetStrength = targetPoint.strength;
		const strengthFactor = (priceStrength + targetStrength) / 4;

		// 종합 강도 계산
		const divergenceStrength =
			((Math.abs(priceChangePercent) + Math.abs(targetChangePercent)) / 2) *
			durationFactor *
			strengthFactor;

		return {
			changePercent: { price: priceChangePercent, target: targetChangePercent },
			strengthFactor: divergenceStrength
		};
	}

	function isStrongDivergence(
		priceChange: number,
		targetChange: number,
		isBullish: boolean
	): boolean {
		return isBullish ? priceChange > 3 && targetChange > 3 : priceChange < -3 && targetChange < -3;
	}

	function isModerateDivergence(
		priceChange: number,
		targetChange: number,
		isBullish: boolean
	): boolean {
		return isBullish ? priceChange > 3 || targetChange > 3 : priceChange < -3 || targetChange < -3;
	}
}

const BOLLINGER_BAND_SCORE_ENUM = {
	RECENT_POSITION: 5,
	RECENT_BANDWIDTH: 10,
	RECENT_TREND: 15,
	RECENT_PATTERN_DETECTION: 20
};

/**
 * 볼린저 밴드 점수 계산
 * @param {Object} params 볼린저 밴드 관련 정보
 * @param {Array} params.bollingerBandsList 볼린저 밴드 값 리스트
 * @param {Array} params.priceList 가격 리스트
 * @param {Array} params.rsiList RSI 값 리스트 (확인 신호용)
 * @return {number} 0-100 사이의 볼린저 밴드 점수
 */
async function calculateBollingerBandsScore({
	bollingerBandsList,
	priceList,
	rsiList
}: {
	bollingerBandsList: BollingerBandsData[];
	priceList: number[];
	rsiList: number[];
}): Promise<number> {
	if (bollingerBandsList.length < 20 || priceList.length < 20) {
		return NaN;
	}

	const positionRecentCount = 5;
	const bandwidthRecentCount = 10;
	const trendRecentCount = 15;
	const patternDetectionCount = 20;

	// 현재 값 추출
	const currentPrice = priceList[priceList.length - 1];
	const currentBB = bollingerBandsList[bollingerBandsList.length - 1];
	const currentRSI = rsiList[rsiList.length - 1];

	// 필요한 데이터 추출 및 전처리
	const { upperBandList, middleBandList, lowerBandList, bandwidthList } =
		extractBollingerData(bollingerBandsList);

	// 가격 위치 점수, 밴드폭 점수, 추세 점수, 반전 가능성 점수 계산, 패턴 점수 계산
	const [positionScore, bandwidthScore, trendScore, reversalScore, patternScore] =
		await Promise.all([
			// 1. 볼린저 밴드 내 가격 위치 점수 (30%)
			calculateBBPositionScore({
				currentPrice,
				currentBB,
				priceList: priceList.slice(-positionRecentCount),
				upperBandList: upperBandList.slice(-positionRecentCount),
				lowerBandList: lowerBandList.slice(-positionRecentCount),
				currentRSI
			}),
			// 2. 밴드폭 및 변동성 점수 (20%)
			calculateBBBandwidthScore({
				bandwidthList: bandwidthList.slice(-bandwidthRecentCount),
				currentBB
			}),
			// 3. 볼린저 밴드 추세 점수 (20%)
			calculateBBTrendScore({
				middleBandList: middleBandList.slice(-trendRecentCount),
				upperBandList: upperBandList.slice(-trendRecentCount),
				lowerBandList: lowerBandList.slice(-trendRecentCount),
				priceList: priceList.slice(-trendRecentCount)
			}),
			// 4. 볼린저 밴드 반전 가능성 점수 (15%)
			calculateBBReversalScore({
				priceList: priceList.slice(-patternDetectionCount),
				upperBandList: upperBandList.slice(-patternDetectionCount),
				lowerBandList: lowerBandList.slice(-patternDetectionCount),
				rsiList: rsiList.slice(-patternDetectionCount)
			}),
			// 5. 볼린저 밴드 패턴 점수 (15%)
			calculateBBPatternScore({
				priceList: priceList.slice(-patternDetectionCount),
				upperBandList: upperBandList.slice(-patternDetectionCount),
				middleBandList: middleBandList.slice(-patternDetectionCount),
				lowerBandList: lowerBandList.slice(-patternDetectionCount)
			})
		]);
	
	// 시장 상황 분석 및 가중치 조정
	const weights = determineWeights(
		currentPrice,
		currentBB,
		bandwidthList,
		patternScore,
		reversalScore
	);
	
	// 최종 점수 계산
	const finalBBScore =
		positionScore * weights.position +
		bandwidthScore * weights.bandwidth +
		trendScore * weights.trend +
		reversalScore * weights.reversal +
		patternScore * weights.pattern;

	return Math.min(100, Math.max(0, finalBBScore));

	// 볼린저 밴드 데이터 추출 함수
	function extractBollingerData(bollingerBandsList: BollingerBandsData[]) {
		const upperBandList: number[] = [];
		const middleBandList: number[] = [];
		const lowerBandList: number[] = [];
		const bandwidthList: number[] = [];

		for (const bbData of bollingerBandsList) {
			upperBandList.push(bbData.upper);
			middleBandList.push(bbData.middle);
			lowerBandList.push(bbData.lower);
			const bandwidth = ((bbData.upper - bbData.lower) / bbData.middle) * 100;
			bandwidthList.push(bandwidth);
		}

		return { upperBandList, middleBandList, lowerBandList, bandwidthList };
	}

	// 가중치 결정 함수
	function determineWeights(
		currentPrice: number,
		currentBB: BollingerBandsData,
		bandwidthList: number[],
		patternScore: number,
		reversalScore: number
	) {

		// 밴드폭 변동성 체크
		const currentBandwidth = bandwidthList[bandwidthList.length - 1];
		const avgBandwidth = calculateAverage(
			bandwidthList.slice(-BOLLINGER_BAND_SCORE_ENUM.RECENT_BANDWIDTH)
		);
		const bandwidthRatio = currentBandwidth / avgBandwidth;

		// 가격 위치 체크 (%B 계산)
		const percentB = (currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower);

		// 상황에 따른 가중치 조정
		if (bandwidthRatio > 1.5 || bandwidthRatio < 0.5) {
			// 변동성이 극도로 높거나 낮음
			return {
				position: 0.25,
				bandwidth: 0.3,
				trend: 0.2,
				reversal: 0.15,
				pattern: 0.1
			};
		}

		if (percentB > 0.95 || percentB < 0.05) {
			// 가격이 밴드 극단에 위치
			return {
				position: 0.4,
				bandwidth: 0.2,
				trend: 0.15,
				reversal: 0.15,
				pattern: 0.1
			}
		}

		if (patternScore > 70 || reversalScore > 70) {
			// 강한 패턴 또는 반전 신호 감지
			return {
				position: 0.25,
				bandwidth: 0.15,
				trend: 0.15,
				reversal: 0.25,
				pattern: 0.2
			}
		}
		
		// 기본 가중치
		return {
			position: 0.3,
			bandwidth: 0.2,
			trend: 0.2,
			reversal: 0.15,
			pattern: 0.15
		};
	}
}

// 1. 볼린저 밴드 내 가격 위치 점수 (30%)
function calculateBBPositionScore({
	currentPrice,
	currentBB,
	priceList,
	upperBandList,
	lowerBandList,
	currentRSI
}: {
	currentPrice: number;
	currentBB: BollingerBandsData;
	priceList: number[];
	upperBandList: number[];
	lowerBandList: number[];
	currentRSI: number;
}): number {
	// 상수 정의
	const RSI_OVERBOUGHT = 70;
	const RSI_OVERSOLD = 30;
	const PERCENT_B_UPPER = 0.8;
	const PERCENT_B_MIDDLE = 0.5;
	const PERCENT_B_LOWER = 0.2;
	const RECENT_PERIODS = Math.min(10, priceList.length);

	// %B 계산 (0-1 범위 내에서 가격 위치)
	const percentB = (currentPrice - currentBB.lower) / (currentBB.upper - currentBB.lower);

	// 최근 N개 데이터에서만 이탈 횟수 계산
	let upperBreakCount = 0;
	let lowerBreakCount = 0;

	for (let i = priceList.length - RECENT_PERIODS; i < priceList.length; i++) {
		if (priceList[i] > upperBandList[i]) {
			upperBreakCount++;
		}
		if (priceList[i] < lowerBandList[i]) {
			lowerBreakCount++;
		}
	}

	// RSI 상태 확인
	const isOverbought = currentRSI > RSI_OVERBOUGHT;
	const isOversold = currentRSI < RSI_OVERSOLD;

	// 위치에 따른 점수 계산
	if (currentPrice > currentBB.upper * 1.05) {
		// 상단밴드 크게 돌파
		return isOverbought ? 10 : 20;
	}

	if (currentPrice > currentBB.upper) {
		// 상단밴드 돌파
		return isOverbought ? 20 : upperBreakCount > 2 ? 30 : 40;
	}

	if (percentB > PERCENT_B_UPPER) {
		// 상단밴드 근처
		return isOverbought ? 40 : 60;
	}

	if (percentB > PERCENT_B_MIDDLE) {
		// 중간밴드~상단밴드 사이
		return 70;
	}

	if (percentB > PERCENT_B_LOWER) {
		// 중간밴드~하단밴드 사이
		return 50; // 40에서 50으로 조정
	}

	if (currentPrice > currentBB.lower) {
		// 하단밴드 근처
		return isOversold ? 60 : 35; // 40에서 35로 조정
	}

	if (currentPrice > currentBB.lower * 0.95) {
		// 하단밴드 돌파
		return isOversold ? 80 : lowerBreakCount > 2 ? 70 : 60;
	}

	// 하단밴드 크게 돌파
	return isOversold ? 90 : 80;
}

// 2. 밴드폭 및 변동성 점수 (20%)
function calculateBBBandwidthScore({
	bandwidthList,
	currentBB
}: {
	bandwidthList: number[];
	currentBB: BollingerBandsData;
}): number {
	// 입력 데이터 검증
	if (!bandwidthList?.length || !currentBB) {
		return 50; // 기본 중립 점수
	}

	// 상수 정의
	const VERY_LOW_THRESHOLD = 0.6; // 매우 낮은 밴드폭 기준 (평균의 60%)
	const LOW_THRESHOLD = 0.8; // 낮은 밴드폭 기준 (평균의 80%)
	const HIGH_THRESHOLD = 1.2; // 높은 밴드폭 기준 (평균의 120%)
	const VERY_HIGH_THRESHOLD = 1.5; // 매우 높은 밴드폭 기준 (평균의 150%)
	const RECENT_COUNT = Math.min(10, bandwidthList.length);

	// 현재 밴드폭 계산
	const currentBandwidth = ((currentBB.upper - currentBB.lower) / currentBB.middle) * 100;

	// 최근 밴드폭 통계
	const recentBandwidths = bandwidthList.slice(-RECENT_COUNT);
	const avgBandwidth = calculateAverage(recentBandwidths);

	// 변동성 요소 추가
	const volatility = calculateStatisticalVolatility(recentBandwidths);

	// 밴드폭 추세 분석 - 선형회귀 기울기 사용 (더 정확한 추세 파악)
	const bandwidthSlope = calculateSlope(recentBandwidths);

	// 추세 강도 계산 (일관성 측정)
	const bandwidthConsistency = calculateTrendConsistency(recentBandwidths);

	// 상대적 밴드폭 비율 (현재/평균)
	const relativeBandwidth = currentBandwidth / avgBandwidth;

	// 밴드폭 점수 기본값 계산
	let score = 50;

	// 점수 계산 로직
	if (relativeBandwidth < VERY_LOW_THRESHOLD) {
		// 매우 낮은 밴드폭 (스퀴즈) - 돌파 임박
		score = bandwidthSlope > 0 ? 90 : 80;
		// 추세 일관성이 높을 경우 점수 미세 조정
		score += bandwidthConsistency * (bandwidthSlope > 0 ? 5 : -5);

		// 변동성에 따른 추가 조정 (스퀴즈 상태일 때는 변동성이 높을수록 돌파 가능성 증가)
		if (volatility > 3) {
			score += 5;
		}
		// 변동성이 너무 낮으면 페널티
		else if (volatility < 1) {
			score -= 3;
		}
	} else if (relativeBandwidth < LOW_THRESHOLD) {
		// 낮은 밴드폭 - 돌파 가능성
		score = bandwidthSlope > 0 ? 75 : 65;
		score += bandwidthConsistency * (bandwidthSlope > 0 ? 3 : -3);
	} else if (relativeBandwidth < HIGH_THRESHOLD) {
		// 평균적인 밴드폭 - 추세 방향에 따라 경미한 조정
		score = 50 + (bandwidthSlope > 0 ? -5 : 5);
	} else if (relativeBandwidth < VERY_HIGH_THRESHOLD) {
		// 높은 밴드폭 - 추세 진행 중
		score = 40;
		score += bandwidthSlope < 0 ? 5 : -5;
	} else {
		// 매우 높은 밴드폭 - 추세 정점 또는 반전 가능성
		score = bandwidthSlope < 0 ? 25 : 15;
		score += bandwidthConsistency * (bandwidthSlope < 0 ? 5 : -5);
	}

	// 점수 범위 제한
	return Math.min(100, Math.max(0, score));

	// 추세의 일관성 계산 (0-1 사이 값, 1이 가장 일관적)
	function calculateTrendConsistency(data: number[]): number {
		if (data.length < 3) {
			return 0.5;
		}

		let consistentMoves = 0;
		let previousChange = data[1] - data[0];

		for (let i = 2; i < data.length; i++) {
			const currentChange = data[i] - data[i - 1];
			if (Math.sign(currentChange) === Math.sign(previousChange)) {
				consistentMoves++;
			}
			previousChange = currentChange;
		}

		return consistentMoves / (data.length - 2);
	}
}

// 3. 볼린저 밴드 추세 점수 (20%)
function calculateBBTrendScore({
	middleBandList,
	upperBandList,
	lowerBandList,
	priceList
}: {
	middleBandList: number[];
	upperBandList: number[];
	lowerBandList: number[];
	priceList: number[];
}): number {
	// 입력 데이터 검증
	if (
		!middleBandList?.length ||
		!upperBandList?.length ||
		!lowerBandList?.length ||
		!priceList?.length
	) {
		return 50; // 기본값 반환
	}

	// 상수 정의
	const STRONG_UPTREND = 0.05;
	const MODERATE_UPTREND = 0.02;
	const SIDEWAYS_THRESHOLD = 0.01;
	const WEAK_DOWNTREND = -0.02;
	const MODERATE_DOWNTREND = -0.05;
	const RECENT_COUNT = Math.min(15, middleBandList.length);

	// 최근 데이터만 사용
	const recentMiddle = middleBandList.slice(-RECENT_COUNT);
	const recentUpper = upperBandList.slice(-RECENT_COUNT);
	const recentLower = lowerBandList.slice(-RECENT_COUNT);
	const recentPrice = priceList.slice(-RECENT_COUNT);

	// 기울기 계산
	const middleBandSlope = calculateSlope(recentMiddle);
	const priceSlope = calculateSlope(recentPrice);
	const upperBandSlope = calculateSlope(recentUpper);
	const lowerBandSlope = calculateSlope(recentLower);

	// 밴드 방향의 일관성 확인
	const directionConsistency =
		Math.sign(upperBandSlope) === Math.sign(middleBandSlope) &&
		Math.sign(middleBandSlope) === Math.sign(lowerBandSlope);

	// 가격과 밴드 방향 일치 여부
	const priceAlignedWithBands = Math.sign(priceSlope) === Math.sign(middleBandSlope);

	// 추세 점수 계산
	if (middleBandSlope > STRONG_UPTREND && directionConsistency && priceAlignedWithBands) {
		return 90; // 강한 상승 추세
	} else if (middleBandSlope > MODERATE_UPTREND && priceAlignedWithBands) {
		return 75; // 중간 상승 추세
	} else if (middleBandSlope > 0) {
		return 60; // 약한 상승 추세
	} else if (Math.abs(middleBandSlope) < SIDEWAYS_THRESHOLD) {
		return 50; // 횡보
	} else if (middleBandSlope > WEAK_DOWNTREND) {
		return 40; // 약한 하락 추세
	} else if (middleBandSlope > MODERATE_DOWNTREND) {
		return 25; // 중간 하락 추세
	} else {
		return priceAlignedWithBands ? 10 : 20; // 강한 하락 추세
	}
}

// 4. 볼린저 밴드 반전 가능성 점수 (15%)
function calculateBBReversalScore({
	priceList,
	upperBandList,
	lowerBandList,
	rsiList
}: {
	priceList: number[];
	upperBandList: number[];
	lowerBandList: number[];
	rsiList: number[];
}): number {
	// 입력 검증 추가
	if (!priceList?.length || !upperBandList?.length || !lowerBandList?.length || !rsiList?.length) {
		return 50;
	}

	// 상수 정의
	const RSI_OVERBOUGHT = 70;
	const RSI_OVERSOLD = 30;
	const UPPER_BAND_TOUCH_THRESHOLD = 0.98;
	const LOWER_BAND_TOUCH_THRESHOLD = 1.02;
	const PATTERN_MIN_HEIGHT_RATIO = 0.02;

	// 현재 값들
	const currentPrice = priceList[priceList.length - 1];
	const currentUpper = upperBandList[upperBandList.length - 1];
	const currentLower = lowerBandList[lowerBandList.length - 1];
	const currentRSI = rsiList[rsiList.length - 1];

	// 상단/하단 밴드 이탈 여부
	const isAboveUpperBand = currentPrice > currentUpper;
	const isBelowLowerBand = currentPrice < currentLower;
	// 과매수/과매도 상태 확인
	const isOverbought = currentRSI > RSI_OVERBOUGHT;
	const isOversold = currentRSI < RSI_OVERSOLD;

	// M탑 패턴 감지
	const isMTop = isMTopPattern(
		priceList,
		upperBandList,
		UPPER_BAND_TOUCH_THRESHOLD,
		PATTERN_MIN_HEIGHT_RATIO
	);
	// W바닥 패턴 감지
	const isWBottom = isWBottomPattern(
		priceList,
		lowerBandList,
		LOWER_BAND_TOUCH_THRESHOLD,
		PATTERN_MIN_HEIGHT_RATIO
	);

	// 반전 점수 계산
	if (isAboveUpperBand && isOverbought && isMTop) {
		// 강한 하락 반전 신호
		return 10;
	} else if (isAboveUpperBand && isOverbought) {
		// 하락 반전 가능성
		return 30;
	} else if (isMTop) {
		// M탑 패턴 감지됨
		return 40;
	} else if (isBelowLowerBand && isOversold && isWBottom) {
		// 강한 상승 반전 신호
		return 90;
	} else if (isBelowLowerBand && isOversold) {
		// 상승 반전 가능성
		return 80;
	} else if (isWBottom) {
		// W바닥 패턴 감지됨
		return 70;
	} else {
		// 뚜렷한 반전 신호 없음
		return 50;
	}

	/**
	 * W 바닥 패턴 감지 (두 개의 저점이 형성되고 그 사이에 작은 반등이 있는 패턴)
	 * @param priceList 가격 데이터 배열
	 * @param lowerBandList 하단 밴드 배열
	 * @param lowerBandTouchThreshold 하단 밴드 터치 임계값
	 * @param patternMinHeightRatio 패턴 최소 높이 비율
	 * @param windowSize 분석할 기간
	 * @param minDistanceBetweenBottoms 두 저점 사이 최소 거리
	 * @param maxDepthDifferenceRatio 두 저점 간 최대 깊이 차이 비율
	 * @return 패턴 존재 여부
	 */
	function isWBottomPattern(
		priceList: number[],
		lowerBandList: number[],
		lowerBandTouchThreshold: number,
		patternMinHeightRatio: number,
		windowSize: number = 10,
		minDistanceBetweenBottoms: number = 2,
		maxDepthDifferenceRatio: number = 0.05
	): boolean {
		if (priceList.length < windowSize) {
			return false;
		}

		const recentPrices = priceList.slice(-windowSize);
		const recentLowerBand = lowerBandList ? lowerBandList.slice(-windowSize) : undefined;

		// 첫 번째 하단 밴드 터치 또는 로컬 저점 찾기
		let firstBottomIndex = -1;
		for (let i = 0; i < recentPrices.length - 4; i++) {
			if (recentLowerBand && recentPrices[i] <= recentLowerBand[i] * lowerBandTouchThreshold) {
				firstBottomIndex = i;
				break;
			} else if (
				!recentLowerBand &&
				i > 0 &&
				i < recentPrices.length - 1 &&
				recentPrices[i] < recentPrices[i - 1] &&
				recentPrices[i] < recentPrices[i + 1]
			) {
				firstBottomIndex = i;
				break;
			}
		}

		if (firstBottomIndex === -1) {
			return false;
		}

		// 첫 번째 반등
		let peakIndex = -1;
		for (let i = firstBottomIndex + 1; i < recentPrices.length - 2; i++) {
			if (
				i > 0 &&
				i < recentPrices.length - 1 &&
				recentPrices[i] > recentPrices[i - 1] &&
				recentPrices[i] > recentPrices[i + 1]
			) {
				peakIndex = i;
				break;
			}
		}

		if (peakIndex === -1) {
			return false;
		}

		// 두 번째 저점
		let secondBottomIndex = -1;
		for (let i = peakIndex + 1; i < recentPrices.length; i++) {
			if (recentLowerBand && recentPrices[i] <= recentLowerBand[i] * lowerBandTouchThreshold) {
				secondBottomIndex = i;
				break;
			} else if (
				!recentLowerBand &&
				i > 0 &&
				i < recentPrices.length - 1 &&
				recentPrices[i] < recentPrices[i - 1] &&
				recentPrices[i] < recentPrices[i + 1]
			) {
				secondBottomIndex = i;
				break;
			}
		}

		if (secondBottomIndex === -1) {
			return false;
		}

		// 저점 간 거리 확인
		if (secondBottomIndex - firstBottomIndex < minDistanceBetweenBottoms) {
			return false;
		}

		// 두 저점의 깊이 차이 비율 확인
		const firstBottomValue = recentPrices[firstBottomIndex];
		const secondBottomValue = recentPrices[secondBottomIndex];
		const peakValue = recentPrices[peakIndex];

		const depthDifferenceRatio =
			Math.abs(firstBottomValue - secondBottomValue) /
			Math.min(firstBottomValue, secondBottomValue);

		if (depthDifferenceRatio > maxDepthDifferenceRatio) {
			return false;
		}

		// 중간 피크가 두 저점보다 충분히 높은지 확인
		const peakHeightRatio1 = (peakValue - firstBottomValue) / firstBottomValue;
		const peakHeightRatio2 = (peakValue - secondBottomValue) / secondBottomValue;

		return peakHeightRatio1 >= patternMinHeightRatio && peakHeightRatio2 >= patternMinHeightRatio;
	}

	/**
	 * M 탑 패턴 감지 (두 개의 고점이 형성되고 그 사이에 작은 하락이 있는 패턴)
	 * @param dataList 가격 데이터 배열
	 * @param upperBandList 상단 밴드 배열
	 * @param upperBandTouchThreshold 상단 밴드 터치 임계값
	 * @param patternMinHeightRatio 패턴 최소 높이 비율
	 * @param windowSize 분석할 기간
	 * @param minDistanceBetweenPeaks 두 고점 사이 최소 거리
	 * @param maxHeightDifferenceRatio 두 고점 간 최대 높이 차이 비율
	 */
	function isMTopPattern(
		dataList: number[],
		upperBandList: number[],
		upperBandTouchThreshold: number,
		patternMinHeightRatio: number,
		windowSize: number = 10,
		minDistanceBetweenPeaks: number = 2,
		maxHeightDifferenceRatio: number = 0.05
	): boolean {
		if (dataList.length < windowSize) {
			return false;
		}

		// 최근 데이터에 집중
		const recentData = dataList.slice(-windowSize);
		const recentUpperBand = upperBandList ? upperBandList.slice(-windowSize) : undefined;

		// 첫 번째 상단 돌파 또는 접근
		let firstPeakIndex = -1;
		for (let i = 0; i < recentData.length - 4; i++) {
			if (recentUpperBand && recentData[i] >= recentUpperBand[i] * upperBandTouchThreshold) {
				firstPeakIndex = i;
				break;
			} else if (
				!recentUpperBand &&
				i > 0 &&
				i < recentData.length - 1 &&
				recentData[i] > recentData[i - 1] &&
				recentData[i] > recentData[i + 1]
			) {
				firstPeakIndex = i;
				break;
			}
		}

		if (firstPeakIndex === -1) {
			return false;
		}

		// 첫 번째 하락
		let valleyIndex = -1;
		for (let i = firstPeakIndex + 1; i < recentData.length - 2; i++) {
			if (
				i > 0 &&
				i < recentData.length - 1 &&
				recentData[i] < recentData[i - 1] &&
				recentData[i] < recentData[i + 1]
			) {
				valleyIndex = i;
				break;
			}
		}

		if (valleyIndex === -1) {
			return false;
		}

		// 두 번째 상단 돌파 또는 접근
		let secondPeakIndex = -1;
		for (let i = valleyIndex + 1; i < recentData.length; i++) {
			if (recentUpperBand && recentData[i] >= recentUpperBand[i] * upperBandTouchThreshold) {
				secondPeakIndex = i;
				break;
			} else if (
				!recentUpperBand &&
				i > 0 &&
				i < recentData.length - 1 &&
				recentData[i] > recentData[i - 1] &&
				recentData[i] > recentData[i + 1]
			) {
				secondPeakIndex = i;
				break;
			}
		}

		if (secondPeakIndex === -1) {
			return false;
		}

		// 피크 간 거리 확인
		if (secondPeakIndex - firstPeakIndex < minDistanceBetweenPeaks) {
			return false;
		}

		// 두 피크의 높이 차이 비율 확인
		const firstPeakValue = recentData[firstPeakIndex];
		const secondPeakValue = recentData[secondPeakIndex];
		const valleyValue = recentData[valleyIndex];

		const heightDifferenceRatio =
			Math.abs(firstPeakValue - secondPeakValue) / Math.max(firstPeakValue, secondPeakValue);

		if (heightDifferenceRatio > maxHeightDifferenceRatio) {
			return false;
		}

		// 밸리가 두 피크보다 충분히 낮은지 확인
		const valleyDepthRatio1 = (firstPeakValue - valleyValue) / firstPeakValue;
		const valleyDepthRatio2 = (secondPeakValue - valleyValue) / secondPeakValue;

		return valleyDepthRatio1 >= patternMinHeightRatio && valleyDepthRatio2 >= patternMinHeightRatio;
	}
}

// 5. 볼린저 밴드 패턴 점수 (15%)
function calculateBBPatternScore({
	priceList,
	upperBandList,
	middleBandList,
	lowerBandList
}: {
	priceList: number[];
	upperBandList: number[];
	middleBandList: number[];
	lowerBandList: number[];
}): number {
	// 입력 검증 추가
	if (
		!priceList?.length ||
		!upperBandList?.length ||
		!middleBandList?.length ||
		!lowerBandList?.length
	) {
		return 50; // 기본값 반환
	}

	// 데이터 길이 일관성 확인
	const minLength = Math.min(
		priceList.length,
		upperBandList.length,
		middleBandList.length,
		lowerBandList.length
	);
	if (minLength < 15) {
		// 최소 필요 데이터 포인트
		return 50;
	}

	// 패턴 강도를 포함한 객체 반환으로 개선
	const walkingUpResult = detectWalkingPattern(priceList, middleBandList, true);
	const walkingDownResult = detectWalkingPattern(priceList, middleBandList, false);
	const bandwidthResult = detectBandwidthPattern(upperBandList, lowerBandList, middleBandList);
	const upperTagResult = detectBandTagPattern(priceList, upperBandList, true);
	const lowerTagResult = detectBandTagPattern(priceList, lowerBandList, false);

	// 패턴 강도에 기반한 가중 점수 계산
	let finalScore = 50; // 기본 중립 점수

	// 복합 패턴 확인 및 우선순위 적용
	if (walkingUpResult.detected && upperTagResult.detected) {
		// 상승 추세 지속 - 강도를 고려한 점수 조정
		finalScore = 80 - 10 * (1 - walkingUpResult.strength) - 5 * (1 - upperTagResult.strength);
	} else if (walkingDownResult.detected && lowerTagResult.detected) {
		// 하락 추세 지속 - 강도를 고려한 점수 조정
		finalScore = 20 + 10 * (1 - walkingDownResult.strength) + 5 * (1 - lowerTagResult.strength);
	} else if (walkingUpResult.detected) {
		finalScore = 70 - 10 * (1 - walkingUpResult.strength);
	} else if (walkingDownResult.detected) {
		finalScore = 30 + 10 * (1 - walkingDownResult.strength);
	} else if (bandwidthResult.squeeze) {
		finalScore = 60 - 10 * (1 - bandwidthResult.strength);
	} else if (bandwidthResult.expansion) {
		finalScore = 40 + 10 * (1 - bandwidthResult.strength);
	} else if (upperTagResult.detected) {
		finalScore = 45 - 5 * (1 - upperTagResult.strength);
	} else if (lowerTagResult.detected) {
		finalScore = 55 + 5 * (1 - lowerTagResult.strength);
	}

	// 점수 범위 제한
	return Math.min(100, Math.max(0, finalScore));

	/**
	 * 워킹 패턴 감지 (워킹업/워킹다운 통합)
	 * @param priceList 가격 데이터 배열
	 * @param middleBandList 중간 밴드 배열
	 * @param isUpPattern 상승 패턴 여부 (true: 워킹업, false: 워킹다운)
	 * @param lookbackPeriod 분석할 기간
	 * @param consecutiveCount 연속 확인 횟수
	 * @return {detected: boolean, strength: number} 패턴 감지 결과 및 강도
	 */
	function detectWalkingPattern(
		priceList: number[],
		middleBandList: number[],
		isUpPattern: boolean,
		lookbackPeriod: number = 10,
		consecutiveCount: number = 3
	): {
		detected: boolean;
		strength: number;
	} {
		if (priceList.length < lookbackPeriod || middleBandList.length < lookbackPeriod) {
			return { detected: false, strength: 0 };
		}

		const recentPrices = priceList.slice(-lookbackPeriod);
		const recentMiddleBand = middleBandList.slice(-lookbackPeriod);

		// 중간밴드 기준 위치 확인 (상승: 위, 하락: 아래)
		let consecutiveCount2 = 0;
		let totalPositionedBars = 0;

		for (let i = 0; i < lookbackPeriod; i++) {
			const isPositioned = isUpPattern
				? recentPrices[i] > recentMiddleBand[i]
				: recentPrices[i] < recentMiddleBand[i];

			if (isPositioned) {
				consecutiveCount2++;
				totalPositionedBars++;
			} else {
				consecutiveCount2 = 0;
			}
		}

		// 연속 조건 만족 여부
		if (consecutiveCount2 < consecutiveCount) {
			return { detected: false, strength: 0 };
		}

		// 추세 방향 확인
		const priceSlope = calculateSlope(recentPrices);
		const mbSlope = calculateSlope(recentMiddleBand);
		const expectedDirection = isUpPattern ? 1 : -1;

		// 패턴 감지 결과
		const slopeMatches =
			Math.sign(priceSlope) === expectedDirection && Math.sign(mbSlope) === expectedDirection;

		if (!slopeMatches) {
			return { detected: false, strength: 0 };
		}

		// 강도 계산 (연속성, 기울기, 중간밴드 대비 위치)
		const positionRatio = totalPositionedBars / lookbackPeriod;
		const slopeStrength = Math.min(1, Math.abs(priceSlope) / 0.5); // 기울기 정규화

		const strength = positionRatio * 0.5 + slopeStrength * 0.5;

		return { detected: true, strength };
	}

	/**
	 * 밴드폭 패턴 감지 (스퀴즈/확장 통합)
	 */
	function detectBandwidthPattern(
		upperBandList: number[],
		lowerBandList: number[],
		middleBandList: number[],
		lookbackPeriod: number = 15
	): {
		squeeze: boolean;
		expansion: boolean;
		strength: number;
	} {
		if (
			upperBandList.length < lookbackPeriod ||
			lowerBandList.length < lookbackPeriod ||
			middleBandList.length < lookbackPeriod
		) {
			return { squeeze: false, expansion: false, strength: 0 };
		}

		// 밴드폭 계산 (코드 중복 제거)
		const bandwidthList = calculateBandwidthList(
			upperBandList,
			lowerBandList,
			middleBandList,
			lookbackPeriod
		);

		// 현재 밴드폭과 과거 평균 밴드폭 비교
		const currentBandwidth = bandwidthList[bandwidthList.length - 1];
		const pastBandwidth = calculateAverage(bandwidthList.slice(0, -3));

		// 스퀴즈 및 확장 임계값 설정
		const squeezeThreshold = 0.75; // 25% 축소
		const expansionThreshold = 1.4; // 40% 확장

		// 변동성 변화 비율
		const bandwidthRatio = currentBandwidth / pastBandwidth;

		// 밴드폭 기울기 (방향성 확인)
		const bandwidthSlope = calculateSlope(bandwidthList.slice(-5));

		// 패턴 감지 및 강도 계산
		const isSqueeze = bandwidthRatio < squeezeThreshold && bandwidthSlope < 0;
		const isExpansion = bandwidthRatio > expansionThreshold && bandwidthSlope > 0;

		let strength = 0;

		if (isSqueeze) {
			// 스퀴즈 강도: 축소 정도와 기울기 반영
			strength =
				Math.min(1, (1 - bandwidthRatio) * 2) * 0.7 + Math.min(1, Math.abs(bandwidthSlope)) * 0.3;
		} else if (isExpansion) {
			// 확장 강도: 확장 정도와 기울기 반영
			strength =
				Math.min(1, (bandwidthRatio - 1) / 0.8) * 0.7 + Math.min(1, Math.abs(bandwidthSlope)) * 0.3;
		}

		return { squeeze: isSqueeze, expansion: isExpansion, strength };
	}

	/**
	 * 밴드 태그 패턴 감지 (상단/하단 밴드 통합)
	 */
	function detectBandTagPattern(
		priceList: number[],
		bandList: number[],
		isUpperBand: boolean,
		lookbackPeriod: number = 8,
		touchThreshold: number = 1,
		reverseThreshold: number = 2
	): {
		detected: boolean;
		strength: number;
	} {
		if (priceList.length < lookbackPeriod || bandList.length < lookbackPeriod) {
			return { detected: false, strength: 0 };
		}

		const recentPrices = priceList.slice(-lookbackPeriod);
		const recentBand = bandList.slice(-lookbackPeriod);

		// 밴드 접촉 인덱스 찾기
		let touchIndex = -1;
		let touchDistance = Infinity;

		for (let i = 0; i < lookbackPeriod - 2; i++) {
			const distance = (Math.abs(recentPrices[i] - recentBand[i]) / recentBand[i]) * 100;

			if (distance <= touchThreshold && distance < touchDistance) {
				touchIndex = i;
				touchDistance = distance;
			}
		}

		if (touchIndex === -1) {
			return { detected: false, strength: 0 };
		}

		// 접촉 후 반전 확인
		let maxReversalSize = 0;
		let reversalDetected = false;

		for (let i = touchIndex + 1; i < lookbackPeriod; i++) {
			// 방향에 따른 반전 크기 계산
			const reversalSize = isUpperBand
				? ((recentPrices[touchIndex] - recentPrices[i]) / recentPrices[touchIndex]) * 100
				: ((recentPrices[i] - recentPrices[touchIndex]) / recentPrices[touchIndex]) * 100;

			if (reversalSize >= reverseThreshold) {
				reversalDetected = true;
				maxReversalSize = Math.max(maxReversalSize, reversalSize);
			}
		}

		if (!reversalDetected) {
			return { detected: false, strength: 0 };
		}

		// 강도 계산: 접촉 정확도 + 반전 크기
		const touchQuality = 1 - touchDistance / touchThreshold;
		const reversalQuality = Math.min(1, maxReversalSize / (reverseThreshold * 2));

		const strength = touchQuality * 0.4 + reversalQuality * 0.6;

		return { detected: true, strength };
	}

	/**
	 * 밴드폭 계산 리스트 반환 (중복 제거용)
	 */
	function calculateBandwidthList(
		upperBandList: number[],
		lowerBandList: number[],
		middleBandList: number[],
		lookbackPeriod: number
	): number[] {
		const bandwidthList: number[] = [];
		for (let i = 0; i < lookbackPeriod; i++) {
			const index = upperBandList.length - lookbackPeriod + i;
			const bandwidth =
				((upperBandList[index] - lowerBandList[index]) / middleBandList[index]) * 100;
			bandwidthList.push(bandwidth);
		}
		return bandwidthList;
	}
}

/**
 * 헬퍼 함수: 표준편차 기반 변동성 계산
 * @param data 데이터 배열
 * @return 통계적 변동성 (표준편차)
 */
function calculateStatisticalVolatility(data: number[]): number {
	if (data.length < 2) {
		return 0;
	}

	const mean = calculateAverage(data);
	const squaredDifferences = data.map((value) => Math.pow(value - mean, 2));
	const variance = calculateAverage(squaredDifferences);

	return Math.sqrt(variance);
}

/**
 * 헬퍼 함수: 평균 절대 변화량 기반 변동성 계산
 * @param data 데이터 배열
 * @return 시계열 변동성 (평균 변화량)
 */
function calculatePriceChangeVolatility(data: number[]): number {
	if (data.length < 2) {
		return 0;
	}

	const diffs = [];
	for (let i = 1; i < data.length; i++) {
		diffs.push(Math.abs(data[i] - data[i - 1]));
	}

	return calculateAverage(diffs);
}

// 헬퍼 함수: 평균 계산
function calculateAverage(data: number[]): number {
	return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
 * 헬퍼 함수: 데이터 배열의 기울기 계산 (선형 회귀)
 * @param {Array} data 데이터 배열
 * @returns {number} 기울기 값. 데이터가 부족하면 0 반환.
 */
function calculateSlope(data: number[]): number {
	if (data.length < 2) {
		return 0;
	}

	const n = data.length;

	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumXX = 0;

	for (let i = 0; i < n; i++) {
		sumX += i;
		sumY += data[i];
		sumXY += i * data[i];
		sumXX += i * i;
	}

	// 선형 회귀 기울기 계산
	const denominator = n * sumXX - sumX * sumX;
	// 분모가 0이 되는 경우
	if (denominator === 0) {
		return 0;
	}

	const slope = (n * sumXY - sumX * sumY) / denominator;

	return isFinite(slope) ? slope : 0;
}

/**
 * 헬퍼 함수: 크로스 탐지
 * @param {Array} line1 첫 번째 라인 데이터
 * @param {Array} line2 두 번째 라인 데이터
 * @returns {Array} 크로스 발생 배열 (1: 상향돌파, -1: 하향돌파, 0: 크로스 없음)
 */
function detectCross(line1: number[], line2: number[]): number[] {
	if (line1.length !== line2.length) {
		throw new Error('두 라인의 데이터 길이가 일치해야 합니다.');
	}

	// 첫 번째 데이터 포인트는 교차를 판단할 수 없으므로 0으로 시작
	const crossArray = [0];

	for (let i = 1; i < line1.length; i++) {
		// 이전 값과 현재 값의 유효성 확인 (숫자인지)
		const prev1 = line1[i - 1];
		const prev2 = line2[i - 1];
		const curr1 = line1[i];
		const curr2 = line2[i];

		// 상향 돌파 조건: 이전에는 line1 <= line2 였고, 현재는 line1 > line2
		if (prev1 <= prev2 && curr1 > curr2) {
			crossArray.push(1);
		}
		// 하향 돌파 조건: 이전에는 line1 >= line2 였고, 현재는 line1 < line2
		else if (prev1 >= prev2 && curr1 < curr2) {
			crossArray.push(-1);
		}
		// 그 외의 경우 (교차 없음)
		else {
			crossArray.push(0);
		}
	}

	return crossArray;
}

/**
 * 데이터 배열에서 로컬 극값(고점/저점)을 찾는 함수
 * @param data 데이터 배열
 * @param type 'high'(고점) 또는 'low'(저점)
 * @param options 추가 옵션
 * @returns 극값 정보 배열 {index, value, strength, duration}
 */
function findLocalExtrema(
	data: number[],
	type: string,
	options: ExtremaOptions = {}
): Array<{
	index: number;
	value: number;
	strength: number;
	duration?: number;
}> {
	const { threshold = 0, window = 1, minDuration = 0, returnReversed = false } = options;

	const result: ExtremaResult[] = [];

	// 데이터가 충분하지 않으면 빈 배열 반환
	if (data.length < 2 * window + 1) {
		return result;
	}

	let lastExtremumValue = 0;
	let lastExtremumIndex = -1;

	// 표준편차 계산으로 통계적 유의성 평가
	const stdDev: number = calculateStatistics(data);
	const minThreshold: number = threshold > 0 ? threshold : stdDev * 0.5;

	for (let i = window; i < data.length - window; i++) {
		// 극값이 아닌 경우
		if (!isExtremaPoint(data, i, type, window)) {
			continue;
		}

		// 극값 발견 시 강도 계산 : (현재 값과 주변 값의 평균 차이) / 표준 편차
		const strength: number = calculateExtremaStrength(data, i, window, stdDev);

		// 최소 변화량 및 지속 기간 검사
		const significantChange: boolean =
			lastExtremumIndex === -1 || Math.abs(data[i] - lastExtremumValue) > minThreshold;

		const duration = lastExtremumIndex === -1 ? 0 : i - lastExtremumIndex;

		// 유의미한 극 값이면 결과에 추가
		if (significantChange && duration >= minDuration) {
			result.push({
				index: i,
				value: data[i],
				strength: strength,
				duration: duration
			});

			lastExtremumValue = data[i];
			lastExtremumIndex = i;
		}
	}

	// 최신순 정렬 (선택적)
	return returnReversed ? result.reverse() : result;

	/**
	 * 데이터 배열의 평균과 표준편차 계산
	 */
	function calculateStatistics(data: number[]): number {
		let sum = 0;
		let sumSquares = 0;

		for (const value of data) {
			sum += value;
			sumSquares += value * value;
		}

		const mean = sum / data.length;
		const variance = sumSquares / data.length - mean * mean;

		return Math.sqrt(variance > 0 ? variance : 0);
	}

	/**
	 * 주어진 인덱스의 데이터 포인트가 극값인지 확인
	 */
	function isExtremaPoint(data: number[], index: number, type: string, window: number): boolean {
		const isHigh = type === 'high';

		for (let j = 1; j <= window; j++) {
			const condition = isHigh
				? data[index] <= data[index - j] || data[index] <= data[index + j]
				: data[index] >= data[index - j] || data[index] >= data[index + j];

			if (condition) {
				return false;
			}
		}

		return true;
	}

	/**
	 * 극값의 강도를 계산
	 */
	function calculateExtremaStrength(
		data: number[],
		index: number,
		window: number,
		stdDev: number
	): number {
		let surroundSum = 0;
		let surroundCount = 0;

		// 주변 값들의 합계 계산 (배열 생성 없이)
		for (let j = 1; j <= window; j++) {
			surroundSum += data[index - j] + data[index + j];
			surroundCount += 2;
		}

		const avgSurround = surroundSum / surroundCount;
		const percentChange = Math.abs((data[index] - avgSurround) / avgSurround) * 100;
		return (Math.abs(data[index] - avgSurround) / stdDev) * (1 + percentChange / 100);
	}
}
