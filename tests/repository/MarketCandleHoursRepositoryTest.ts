import { test } from 'vitest';
import { MarketCandleHoursRepository } from '$lib/server/repository/MarketCandleHoursRepository';
import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import {
	type MarketCandleHoursEntity,
	MarketCandleHoursEntityUtils
} from '$lib/server/entities/MarketCandleHoursEntity';

test(
	'findAllByMarketAndBeginDateTimeAndCountTest',
	async () => {
		const market = 'KRW-BTC';
		const beginDateTime = '';
		const count = 0;
		const candleTimeZone = UPBitCandleTimeZones.utc;
		
		console.log(CurrentDateUtils.toDateByString(beginDateTime));
		
		const result: MarketCandleHoursEntity[] = await MarketCandleHoursRepository.findAllByMarketAndBeginDateTimeAndCount(
			market,
			candleTimeZone,
			beginDateTime || null,
			count,
		);
		
		console.log(MarketCandleHoursEntityUtils.toCandleData(result[0]));
		console.log(MarketCandleHoursEntityUtils.toCandleData(result[result.length - 1]));
		
		// result.map((entity: MarketCandleHoursEntity) => {
		// 	console.log(MarketCandleHoursEntityUtils.toCandleData(entity));
		// });
	},
	{ timeout: 1000 * 60 }
);
