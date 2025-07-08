/**
 * 기술적 지표 점수 산정 로직
 * 각 지표별로 0-100점 척도의 점수를 계산합니다.
 */

import { test } from 'vitest';
import { CandleService } from '$lib/server/service/CandleService';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import type { CandleData } from '$lib/common/models/CandleData';
import { MarketInfoService } from '$lib/server/service/MarketInfoService';
import type { MarketInfoData } from '$lib/common/models/MarketInfoData';
import type { IndicatorAnalyzeData } from '$lib/common/models/TechnicalIndicatorData';

test(
	'analyzeTechnicalIndicatorsTest',
	async () => {
		const marketCurrency = 'KRW-RENDER';

		const marketList: MarketInfoData[] = await MarketInfoService.getMarketInfoListByMarketCurrency(
			marketCurrency
		);

		console.assert(marketList.length > 0, '마켓 정보가 없습니다.');

		const to: string | null = '2025-04-23 00:00:00';

		const candleList: CandleData[] = await CandleService.getSavedCandleDataListByMarketCurrency(
			marketCurrency,
			UPBitCandleUnitEnum.days.key,
			UPBitCandleTimeZones.utc,
			300,
			to
		);

		console.assert(candleList.length > 0, '캔들 정보가 없습니다.');

		const candleListByMarket: Record<string, CandleData[]> = candleList.reduce(
			(acc, candle) => {
				const market = candle.market;
				if (!acc[market]) {
					acc[market] = [];
				}
				acc[market].push(candle);
				return acc;
			},
			{} as Record<string, CandleData[]>
		);

		const resultList: IndicatorAnalyzeData[] = await Promise.all(
			marketList.map(async (marketData) => {
				const candleList: CandleData[] = candleListByMarket[marketData.market] || [];

				return CandleService.createCandleTechnicalIndicatorAnalyze(marketData, candleList);
			})
		);

		const sorted = resultList.sort((a, b) => {
			if (isNaN(a.finalScore)) {
				return 1;
			}

			if (isNaN(b.finalScore)) {
				return -1;
			}

			return b.finalScore - a.finalScore;
		});

		console.log(sorted);
	},
	{ timeout: 1000 * 60 * 10 }
);
