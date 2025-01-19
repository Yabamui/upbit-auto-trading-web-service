export interface AiResponseModelsData {
	id: number;
	aiModelId: number;
	title: string;
	responseModelJson: object;
	createdAt: string
	updatedAt: string;
	deletedAt: string | null;
}

export interface AiResponseModelProperty {
	totalJudgement: string;
	totalJudgementKr: string;
	timeZone: string;
	items: AiResponseModelPropertyItem[];
}

export interface AiResponseModelPropertyItem {
	date: string;
	time: string;
	openPrice: number;
	highPrice: number;
	lowPrice: number;
	closePrice: number;
	judgementBasis: string;
	judgementBasisKr: string;
	evaluation: string;
}

export const AiResponseModelDataUtils = {
	toAiResponseModelProperty: (json: object): AiResponseModelProperty => {
		return json as AiResponseModelProperty;
	}
}