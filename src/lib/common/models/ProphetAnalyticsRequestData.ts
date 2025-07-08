import type { ProphetAnalyticsCustomSeasonalityData } from '$lib/common/models/ProphetAnalyticsRequestConfigData';

export interface ProphetAnalyticsRequestData {
	id: number;
	userId: number;
	market: string;
	candleUnit: string;
	candleTimeZone: string;
	beginCandleDateTime: Date | undefined;
	endCandleDateTime: Date | undefined;

	growth: string;
	exportPeriod: number;
	cap: number | undefined;
	floor: number | undefined;

	changepointList: string[] | undefined;
	changepointPriorScale: number;
	changepointNumber: number | undefined;
	changepointRange: number | undefined;

	holidaysCountry: string;
	holidaysList: string[] | undefined;
	holidaysPriorScale: number;
	holidaysMode: string | undefined;

	seasonalityMode: string;
	seasonalityPriorScale: number;
	yearlySeasonality: string;
	weeklySeasonality: string;
	dailySeasonality: string;
	customSeasonalityList: ProphetAnalyticsCustomSeasonalityData[] | undefined;

	mcmcSamples: number;
	intervalWidth: number;
	uncertaintySamples: number;
	stanBackend: string | undefined;
	scaling: string;

	requestYn: boolean;
	resultCode: string | undefined;
	resultMessage: string | undefined;
	
	schedulerId: number | undefined;
	executeDateTime: string | undefined;

	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}

export type ProphetAnalyticsRequestDataKeys = keyof ProphetAnalyticsRequestData;

export interface ProphetAnalyticsEChartRequestData {
	market: string
	marketName: string
	candleUnit: string
	candleTimeZone: string
}
