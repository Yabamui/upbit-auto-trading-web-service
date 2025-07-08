import { test } from 'vitest';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import { ProphetAnalyticsPriceTypeEnum } from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import Decimal from 'decimal.js';
import type { ProphetAnalyticsResultEntity } from '$lib/server/entities/ProphetAnalyticsResultEntity';
import { ProphetAnalyticsResultRepository } from '$lib/server/repository/ProphetAnalyticsResultRepository';
import type { ProphetAnalyticsResultItemEntity } from '$lib/server/entities/ProphetAnalyticsResultItemEntity';
import { ProphetAnalyticsResultItemRepository } from '$lib/server/repository/ProphetAnalyticsResultItemRepository';
import moment from 'moment';

test('', async () => {
	const price = new Decimal(0.3);
	const before = new Decimal(0.2);

	const result = price.minus(before).dividedBy(before.abs()).mul(100);

	console.log(result);
	
}, { timeout: 1000 * 60 * 5 });

test(
	'prophet analytics service',
	async () => {
		const userId = 1;
		const market = 'KRW-BTT';
		const candleUnit = UPBitCandleUnitEnum.days.key;
		const candleTimeZone = UPBitCandleTimeZones.utc;
		const priceType = ProphetAnalyticsPriceTypeEnum.CLOSE_PRICE.key;

		const resultEntity: ProphetAnalyticsResultEntity | null =
			await ProphetAnalyticsResultRepository.findTopByUserIdAndMarketOrderByIdDesc(
				userId,
				market,
				candleUnit,
				candleTimeZone,
				priceType
			);

		if (!resultEntity) {
			console.log('No result');
			return;
		}

		console.log('resultEntity id : ', resultEntity.id);

		const resultItemEntities: ProphetAnalyticsResultItemEntity[] =
			await ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultId(
				userId,
				resultEntity.id
			);

		if (resultItemEntities.length === 0) {
			console.log('No result items');
			return;
		}

		console.log(resultItemEntities.length);

		let diffRateTotal = new Decimal(0);
		let diffRateTotalCount = 0;
		let diffRateHigh = new Decimal(0);
		let diffRateHighCount = 0;
		let diffRateLow = new Decimal(0);
		let diffRateLowCount = 0;

		for (const resultItemEntity of resultItemEntities) {
			if (!resultItemEntity.y) {
				continue;
			}

			const currentDiffRate = new Decimal(
				CurrentNumberUtils.calculateRate(resultItemEntity.yhat, resultItemEntity.y)
			)
				.mul(1000)
				.round()
				.dividedBy(1000)
				.toNumber();

			diffRateTotal = diffRateTotal.add(currentDiffRate);
			diffRateTotalCount += 1;

			if (currentDiffRate > 0) {
				diffRateHigh = diffRateHigh.add(currentDiffRate);
				diffRateHighCount += 1;
			} else if (currentDiffRate < 0) {
				diffRateLow = diffRateLow.add(currentDiffRate);
				diffRateLowCount += 1;
			}
		}

		const diffAvg = diffRateTotal.dividedBy(diffRateTotalCount);
		const diffHighAvg = diffRateHigh.dividedBy(diffRateHighCount);
		const diffLowAvg = diffRateLow.dividedBy(diffRateLowCount);

		console.log('diffRateTotal', diffRateTotal);
		console.log('diffRateTotalCount', diffRateTotalCount);
		console.log('diffRateHigh', diffRateHigh);
		console.log('diffRateHighCount', diffRateHighCount);
		console.log('diffRateLow', diffRateLow);
		console.log('diffRateLowCount', diffRateLowCount);

		console.log('diffAvg', diffAvg);
		console.log('diffHighAvg', diffHighAvg);
		console.log('diffLowAvg', diffLowAvg);
	},
	{ timeout: 1000 * 60 * 5 }
);
