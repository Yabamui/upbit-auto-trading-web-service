import type { AiLatestInferenceData } from '$lib/common/models/AiResponsesData';

export interface AiAnalyticsCandleEChartRequestData {
	market: string;
	marketName: string;
	candleUnit: string;
	candleTimeZone: string;
	dateTimeFormat: string;
	inferenceByDateTime: Record<string, AiLatestInferenceData> | undefined;
}

export interface AiAnalyticsHistoryEChartRequestData {
	market: string;
	marketName: string;
	candleUnit: string;
	candleTimeZone: string;
	dateTimeFormat: string;
	inferenceList: AiAnalyticsHistoryEChartInferenceData[];
}

export interface AiAnalyticsHistoryEChartInferenceData {
	id: number;
	aiModelName: string;
	createdAt: string;
	inferenceItemByDateTimeRecord: Record<string, AiAnalyticsHistoryEChartInferenceItemData>;
}

export interface AiAnalyticsHistoryEChartInferenceItemData {
	openingPrice: number | undefined;
	tradePrice: number | undefined;
	lowPrice: number | undefined;
	highPrice: number | undefined;
}
