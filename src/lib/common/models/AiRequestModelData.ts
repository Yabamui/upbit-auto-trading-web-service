import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import type { CandleData } from '$lib/common/models/CandleData';
import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';

export interface AiRequestModelCase1Data {
	market: string;
	koreanName: string;
	englishName: string;
	currencyCode: string;
	beginDate: string;
	endDate: string;
	timeZone: string;
	itemList: AiRequestModelCase1DataItem[];
}

export interface AiRequestModelCase1DataItem {
	date: string;
	time: string;
	openPrice: number;
	highPrice: number;
	lowPrice: number;
	closePrice: number;
}

export const AiRequestModelDataUtils = {
	toAiRequestModelCase1Data: (
		market: string,
		koreanName: string,
		englishName: string,
		currencyCode: string,
		beginDate: Date | undefined,
		endDate: Date | undefined,
		timeZone: string,
		itemList: AiRequestModelCase1DataItem[]
	): AiRequestModelCase1Data => {
		return {
			market: market,
			koreanName: koreanName,
			englishName: englishName,
			currencyCode: currencyCode,
			beginDate: CurrentDateUtils.toFormatStringByDate(beginDate),
			endDate: CurrentDateUtils.toFormatStringByDate(endDate),
			timeZone: timeZone,
			itemList: itemList
		};
	},
	toAiRequestModelCase1DataItem: (
		data: CandleData,
		timeZone: string
	): AiRequestModelCase1DataItem => {
		const nowDate = CurrentDateUtils.getNowDateTime(timeZone);

		return {
			date: CurrentDateUtils.toFormatStringByDate(nowDate, CurrentDateUtils.dateFormat),
			time: CurrentDateUtils.toFormatStringByDate(nowDate, CurrentDateUtils.timeFormat),
			highPrice: data.highPrice,
			lowPrice: data.lowPrice,
			openPrice: data.openingPrice,
			closePrice: data.tradePrice
		};
	},

	mockAiRequestModelCase1Data: (
		candleUnit: string,
		candleTimeZone: string
	): AiRequestModelCase1Data => {
		if (UPBitCandleUnitEnum.minutes.key === candleUnit) {
			return {
				market: 'KRW-BTC',
				koreanName: '비트코인',
				englishName: 'Bitcoin',
				currencyCode: 'KRW',
				beginDate: '2021-01-01',
				endDate: '2021-01-03',
				timeZone: candleTimeZone,
				itemList: [
					{
						date: '2021-01-01',
						time: '00:00:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					},
					{
						date: '2021-01-01',
						time: '00:01:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					},
					{
						date: '2021-01-01',
						time: '00:02:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					}
				]
			};
		}

		if (UPBitCandleUnitEnum.hours.key === candleUnit) {
			return {
				market: 'KRW-BTC',
				koreanName: '비트코인',
				englishName: 'Bitcoin',
				currencyCode: 'KRW',
				beginDate: '2021-01-01',
				endDate: '2021-01-01',
				timeZone: candleTimeZone,
				itemList: [
					{
						date: '2021-01-01',
						time: '00:00:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					},
					{
						date: '2021-01-02',
						time: '01:00:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					},
					{
						date: '2021-01-03',
						time: '02:00:00',
						highPrice: 1000000,
						lowPrice: 900000,
						openPrice: 950000,
						closePrice: 950000
					}
				]
			};
		}

		return {
			market: 'KRW-BTC',
			koreanName: '비트코인',
			englishName: 'Bitcoin',
			currencyCode: 'KRW',
			beginDate: '2021-01-01',
			endDate: '2021-01-03',
			timeZone: candleTimeZone,
			itemList: [
				{
					date: '2021-01-01',
					time: '00:00:00',
					highPrice: 1000000,
					lowPrice: 900000,
					openPrice: 950000,
					closePrice: 950000
				},
				{
					date: '2021-01-02',
					time: '00:00:00',
					highPrice: 1000000,
					lowPrice: 900000,
					openPrice: 950000,
					closePrice: 950000
				},
				{
					date: '2021-01-03',
					time: '00:00:00',
					highPrice: 1000000,
					lowPrice: 900000,
					openPrice: 950000,
					closePrice: 950000
				}
			]
		};
	}
};
