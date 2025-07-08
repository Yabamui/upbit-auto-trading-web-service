export interface ProphetAnalyticsRequestData {
	id: number
	user_id: number
	market: string
	candleType: string
	candleTimeZone: string
	beginCandleDateTime: Date | null
	endCandleDateTime: Date | null
	
	growth: string
	exportPeriod: number
	cap: number | null
	floor: number | null
	
	changepointList: string[] | null
	changepointNumber: number | null
	changepointRange: number | null
	
	holidaysCountry: string
	holidaysList: string[] | null
	holidaysPriorScale: number
	holidaysMode: string | null
	
	seasonalityMode: string
	seasonalityPriorScale: number
	yearlySeasonality: string
	weeklySeasonality: string
	dailySeasonality: string
	monthlySeasonality: number | null
	
	mcmcSamples: number
	intervalWidth: number
	uncertaintySamples: number
	stanBackend: string | null
	scaling: string
	
	requestYn: boolean
	resultCode: string | null
	resultMessage: string | null
	
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}