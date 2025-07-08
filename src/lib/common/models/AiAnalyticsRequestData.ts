export interface AiAnalyticsRequestData {
	id: number;
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	candleUnit: string;
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
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	requestYn: boolean;
}

export interface AiAnalyticsRequestFormData {
	ai: string;
	aiModelId: string;
	aiModelName: string;
	aiPromptsId: string;
	aiPromptsTitle: string;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
}