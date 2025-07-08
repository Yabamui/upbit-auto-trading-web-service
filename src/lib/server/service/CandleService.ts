import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import type { UCandleData } from '$lib/server/models/UPbitApiData';
import { type CandleData, CandleDataUtils } from '$lib/common/models/CandleData';
import {
	UPBitCandleEnumUtils,
	type UPBitCandleUnitCodeData,
	UPBitCandleUnitEnum
} from '$lib/common/enums/UPBitCandleEnum';
import { MarketCandleHoursRepository } from '$lib/server/repository/MarketCandleHoursRepository';
import {
	type MarketCandleHoursEntity,
	MarketCandleHoursEntityUtils
} from '$lib/server/entities/MarketCandleHoursEntity';
import {
	type MarketCandleDaysEntity,
	MarketCandleDaysEntityUtils
} from '$lib/server/entities/MarketCandleDaysEntity';
import { MarketCandleDaysRepository } from '$lib/server/repository/MarketCandleDaysRepository';
import { RedisService } from '$lib/server/service/RedisService';
import type { IndicatorAnalyzeData } from '$lib/common/models/TechnicalIndicatorData';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import { AnalyzeTechnicalIndicatorUtils } from '$lib/common/utils/AnalyzeTechnicalIndicatorUtils';
import { CandleIndicatorParamsEnum } from '$lib/common/enums/CandleIndicatorParamsEnum';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export const CandleService = {
	getCandleDataList: getCandleDataList,
	getSavedCandleDataList: getSavedCandleDataList,
	getSavedCandleDataListByMarketCurrency: getSavedCandleDataListByMarketCurrency,
	getCandleTechnicalIndicatorAnalyze: getCandleTechnicalIndicatorAnalyze,
	createCandleTechnicalIndicatorAnalyze: createCandleTechnicalIndicatorAnalyze
};

async function getCandleDataList(
	market: string,
	candleUnit: string,
	candleCount: number,
	to: string
): Promise<CandleData[]> {
	const uCandleDataList: UCandleData[] = await getCandleByUPBitApi(
		market,
		candleUnit,
		candleCount,
		to
	);

	if (uCandleDataList.length === 0) {
		return [];
	}

	return uCandleDataList.map((uCandleData: UCandleData) => {
		return CandleDataUtils.toMarketInfoData(uCandleData);
	});
}

async function getSavedCandleDataList(
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	candleCount: number,
	to: string | null
): Promise<CandleData[]> {
	if (UPBitCandleUnitEnum.hours.key === candleUnit) {
		const marketCandleHoursList: MarketCandleHoursEntity[] =
			await MarketCandleHoursRepository.findAllByMarketAndBeginDateTimeAndCount(
				market,
				candleTimeZone,
				to,
				candleCount
			);

		if (marketCandleHoursList.length === 0) {
			return [];
		}

		return marketCandleHoursList
			.map((marketCandleHoursEntity: MarketCandleHoursEntity) => {
				return MarketCandleHoursEntityUtils.toCandleData(marketCandleHoursEntity);
			})
			.sort((a, b) => a.timestamp - b.timestamp);
	}

	if (UPBitCandleUnitEnum.days.key === candleUnit) {
		const marketCandleDaysList: MarketCandleDaysEntity[] =
			await MarketCandleDaysRepository.findAllByMarketAndBeginDateTimeAndCount(
				market,
				candleTimeZone,
				to,
				candleCount
			);

		if (marketCandleDaysList.length === 0) {
			return [];
		}

		return marketCandleDaysList
			.map((marketCandleDaysEntity: MarketCandleDaysEntity) => {
				return MarketCandleDaysEntityUtils.toCandleData(marketCandleDaysEntity);
			})
			.sort((a, b) => a.timestamp - b.timestamp);
	}

	return [];
}

async function getSavedCandleDataListByMarketCurrency(
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string,
	candleCount: number,
	to: string | null
) {
	if (UPBitCandleUnitEnum.hours.key === candleUnit) {
		const marketCandleHoursList: MarketCandleHoursEntity[] =
			await MarketCandleHoursRepository.findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte(
				marketCurrency,
				candleTimeZone,
				to,
				candleCount
			);

		if (marketCandleHoursList.length === 0) {
			return [];
		}

		return marketCandleHoursList.map((marketCandleHoursEntity: MarketCandleHoursEntity) => {
			return MarketCandleHoursEntityUtils.toCandleData(marketCandleHoursEntity);
		});
	}

	if (UPBitCandleUnitEnum.days.key === candleUnit) {
		const marketCandleDaysList: MarketCandleDaysEntity[] =
			await MarketCandleDaysRepository.findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte(
				marketCurrency,
				candleTimeZone,
				to,
				candleCount
			);

		if (marketCandleDaysList.length === 0) {
			return [];
		}

		return marketCandleDaysList.map((marketCandleDaysEntity: MarketCandleDaysEntity) => {
			return MarketCandleDaysEntityUtils.toCandleData(marketCandleDaysEntity);
		});
	}

	return [];
}

async function getCandleByUPBitApi(
	market: string,
	candleUnit: string,
	candleCount: number,
	to: string
): Promise<UCandleData[]> {
	const unitCode: UPBitCandleUnitCodeData | undefined =
		UPBitCandleEnumUtils.getUPBitCandleUnitCode(candleUnit);

	if (!unitCode) {
		throw new Error('Unknown candleUnit');
	}

	switch (unitCode.key) {
		case UPBitCandleUnitEnum.seconds.key:
			return await UPBitApi.getCandleSeconds(market, to, candleCount);
		case UPBitCandleUnitEnum.minutes.key:
		case UPBitCandleUnitEnum.minutes3.key:
		case UPBitCandleUnitEnum.minutes5.key:
		case UPBitCandleUnitEnum.minutes10.key:
		case UPBitCandleUnitEnum.minutes15.key:
		case UPBitCandleUnitEnum.minutes30.key:
		case UPBitCandleUnitEnum.hours.key:
		case UPBitCandleUnitEnum.hours4.key:
			return await UPBitApi.getCandleMinutes(unitCode.unit, market, to, candleCount);
		case UPBitCandleUnitEnum.days.key:
			return await UPBitApi.getCandleDays(market, to, candleCount);
		case UPBitCandleUnitEnum.weeks.key:
			return await UPBitApi.getCandleWeeks(market, to, candleCount);
		case UPBitCandleUnitEnum.months.key:
			return await UPBitApi.getCandleMonths(market, to, candleCount);
		case UPBitCandleUnitEnum.years.key:
			return await UPBitApi.getCandleYears(market, to, candleCount);
		default:
			return [];
	}
}

async function getCandleTechnicalIndicatorAnalyze(
	marketCurrency: string
): Promise<IndicatorAnalyzeData[]> {
	const keyPrefix = 'TECHNICAL_INDICATOR_';

	const rediKey = keyPrefix + marketCurrency;

	const cachedData = await RedisService.get(rediKey);

	if (!cachedData) {
		return [];
	}

	return JSON.parse(cachedData) as IndicatorAnalyzeData[];
}

async function createCandleTechnicalIndicatorAnalyze(
	marketInfo: MarketInfoData,
	candleList: CandleData[]
): Promise<IndicatorAnalyzeData> {
	if (candleList.length === 0) {
		return {
			market: marketInfo.market,
			koreanName: marketInfo.koreanName,
			englishName: marketInfo.englishName,
			individualScore: undefined,
			finalScore: 0,
			avgScore: 0,
			marketCondition: undefined,
			interpretation: undefined,
			lastCandleDateTimeUtc: undefined,
			lastCandleDateTimeKst: undefined,
			createdAt: CurrentDateUtils.getNowDateTimeString()
		};
	}

	const sortedCandleList = candleList.sort((a, b) => a.timestamp - b.timestamp);

	let decimalPlace = 0;
	const closePriceList: number[] = [];
	const allPriceList: number[][] = [];
	const lastCandle = sortedCandleList[sortedCandleList.length - 1];

	for (const candle of sortedCandleList) {
		const decimal = candle.tradePrice.toString().split('.');

		if (decimal.length > 1 && decimal[1].length > decimalPlace) {
			decimalPlace = decimal[1].length;
		}

		closePriceList.push(candle.tradePrice);
		allPriceList.push([candle.highPrice, candle.lowPrice, candle.tradePrice]);
	}

	const [
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
	] = await Promise.all([
		AnalyzeTechnicalIndicatorUtils.calculateMA(
			closePriceList,
			CandleIndicatorParamsEnum.SHORT_MA.value,
			decimalPlace
		),
		AnalyzeTechnicalIndicatorUtils.calculateMA(
			closePriceList,
			CandleIndicatorParamsEnum.MID_MA.value,
			decimalPlace
		),
		AnalyzeTechnicalIndicatorUtils.calculateMA(
			closePriceList,
			CandleIndicatorParamsEnum.LONG_MA.value,
			decimalPlace
		),
		AnalyzeTechnicalIndicatorUtils.calculateMA(
			closePriceList,
			CandleIndicatorParamsEnum.LONG_TERM_MA.value,
			decimalPlace
		),
		AnalyzeTechnicalIndicatorUtils.calculateRSI(
			closePriceList,
			CandleIndicatorParamsEnum.RSI_PERIOD.value
		),
		AnalyzeTechnicalIndicatorUtils.calculateMACD(
			closePriceList,
			decimalPlace,
			CandleIndicatorParamsEnum.MACD_FAST_PERIOD.value,
			CandleIndicatorParamsEnum.MACD_SLOW_PERIOD.value,
			CandleIndicatorParamsEnum.MACD_SIGNAL_PERIOD.value,
			false,
			false
		),
		AnalyzeTechnicalIndicatorUtils.calculateStochastic(
			allPriceList,
			CandleIndicatorParamsEnum.STOCHASTIC_PERIOD.value,
			CandleIndicatorParamsEnum.STOCHASTIC_K_PERIOD.value,
			CandleIndicatorParamsEnum.STOCHASTIC_D_PERIOD.value,
		),
		AnalyzeTechnicalIndicatorUtils.calculateStochasticRSI(
			closePriceList,
			CandleIndicatorParamsEnum.STOCHASTIC_RSI_RSI_PERIOD.value,
			CandleIndicatorParamsEnum.STOCHASTIC_RSI_PERIOD.value,
			CandleIndicatorParamsEnum.STOCHASTIC_RSI_K_PERIOD.value,
			CandleIndicatorParamsEnum.STOCHASTIC_RSI_D_PERIOD.value,
		),
		AnalyzeTechnicalIndicatorUtils.calculateBollingerBands(
			closePriceList,
			CandleIndicatorParamsEnum.BOLLINGER_PERIOD.value,
			CandleIndicatorParamsEnum.BOLLINGER_STD_DEV.value,
			decimalPlace
		),
		AnalyzeTechnicalIndicatorUtils.calculateATR(
			allPriceList,
			CandleIndicatorParamsEnum.ATR_PERIOD.value
		)
	]);

	const result = await AnalyzeTechnicalIndicatorUtils.analyzeTechnicalIndicators({
		priceList: closePriceList,
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
	});

	result.market = marketInfo.market;
	result.koreanName = marketInfo.koreanName;
	result.englishName = marketInfo.englishName;
	result.lastCandleDateTimeUtc = lastCandle.candleDateTimeUtc;
	result.lastCandleDateTimeKst = lastCandle.candleDateTimeKst;

	return result;
}
