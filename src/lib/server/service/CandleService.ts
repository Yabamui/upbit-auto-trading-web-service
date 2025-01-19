import { UPBitApi } from '$lib/server/external-api/UPBitApi';
import type { UCandleData } from '$lib/server/models/UPbitApiData';
import { type CandleData, CandleDataUtils } from '$lib/common/models/CandleData';
import {
	type UPBitCandleUnitCodeData,
	UPBitCandleUnitCodeUtils,
	UPBitCandleUnitEnum
} from '$lib/common/enums/UPBitCandleEnum';

export const CandleService = {
	getCandleDataList: getCandleDataList
};

async function getCandleDataList(
	market: string,
	candleType: string,
	candleCount: number,
	to: string
): Promise<CandleData[]> {
	const uCandleDataList: UCandleData[] = await getCandleByUPBitApi(
		market,
		candleType,
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

async function getCandleByUPBitApi(
	market: string,
	candleType: string,
	candleCount: number,
	to: string
): Promise<UCandleData[]> {
	
	const unitCode: UPBitCandleUnitCodeData | undefined =
		UPBitCandleUnitCodeUtils.getUPBitCandleUnitCode(candleType);

	if (!unitCode) {
		throw new Error('Unknown candleType');
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
