export interface AiPromptsData {
	id: number;
	userId: number;
	aiModelId: number;
	title: string;
	systemPromptsList: string[];
	userPromptsList: string[];
	defaultYn: boolean
	aiResponseModelsId: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface AiPromptsCreateRequestData {
	aiModelId: number;
	title: string;
	systemPromptsList: string[];
	userPromptsList: string[];
	defaultYn: boolean
	aiResponseModelsId: number | null;
}

export interface AiPromptsUpdateRequestData {
	id: number
	userId: number;
	aiModelId: number;
	title: string;
	systemPromptsList: string[];
	userPromptsList: string[];
	defaultYn: boolean
	aiResponseModelsId: number | null;
}