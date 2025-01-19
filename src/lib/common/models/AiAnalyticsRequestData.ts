export interface AiAnalyticsRequestData {
	id: number;
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	candleType: string;
	candleCount: number;
	candleTimeZone: string;
	requestYn: boolean;
	result: string | null;
	resultCode: string | null;
	aiResponseId: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface AiAnalyticsRequestCreateRequestData {
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	candleType: string;
	candleCount: number;
	candleTimeZone: string;
	requestYn: boolean;
}