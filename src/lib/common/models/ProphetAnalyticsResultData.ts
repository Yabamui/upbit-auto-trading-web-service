export interface ProphetAnalyticsResultData {
	id: number
	userId: number
	requestId: number
	market: string
	candleUnit: string
	candleCount: number
	candleTimeZone: string
	beginCandleDateTime: Date
	endCandleDateTime: Date
	
	changepointDateTimeList: string[] | undefined
	
	errorRateAvg: number | undefined
	positiveErrorRateAvg: number | undefined
	negativeErrorRateAvg: number | undefined
	
	priceType: string;
	
	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}