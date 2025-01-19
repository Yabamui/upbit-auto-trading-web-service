export interface AiResponsesData {
	id: number;
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	aiResponseModesId: number | null;
	response: object;
	candleType: string;
	candleCount: number;
	candleTimeZone: string;
	candleDateTimeKstBegin: string;
	candleDateTimeKstEnd: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	
	aiCode: string;
	aiName: string;
	aiModelCode: string;
	aiModelName: string;
}

export interface AiResponsesTodayInferenceData {
	market: string;
	koreanName: string;
	createdAt: string;
	candleType: string;
	date: string;
	time: string;
	judgementBasisKr: string;
	evaluation: string;
	openPrice: number;
	closePrice: number;
	highPrice: number;
	lowPrice: number;
}