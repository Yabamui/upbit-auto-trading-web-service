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
	aiModelId: number;
	title: string;
	systemPromptsList: string[];
	userPromptsList: string[];
	defaultYn: boolean
	aiResponseModelsId: number | null;
}


export const AiPromptsDataUtils = {
	validCreateData: (data: AiPromptsCreateRequestData | undefined): {
		valid: boolean;
		message: string;
	} => {
		if (!data) {
			return {
				valid: false,
				message: 'Invalid data'
			};
		}
		
		if (!data.aiModelId) {
			return {
				valid: false,
				message: 'Invalid aiModelId'
			};
		}
		
		if (!data.title) {
			return {
				valid: false,
				message: 'Invalid title'
			};
		}
		
		if (!data.systemPromptsList || data.systemPromptsList.length === 0) {
			return {
				valid: false,
				message: 'Invalid systemPromptsList'
			};
		}
		
		if (!data.userPromptsList || data.userPromptsList.length === 0) {
			return {
				valid: false,
				message: 'Invalid userPromptsList'
			};
		}
		
		if (data.defaultYn === undefined) {
			return {
				valid: false,
				message: 'Invalid defaultYn'
			};
		}
		
		if (!data.aiResponseModelsId) {
			return {
				valid: false,
				message: 'Invalid aiResponseModelsId'
			};
		}
		
		return {
			valid: true,
			message: ''
		};
	},
	validUpdateData: (data: AiPromptsUpdateRequestData | undefined): {
		valid: boolean;
		message: string;
	} => {
		if (!data) {
			return {
				valid: false,
				message: 'Invalid data'
			};
		}
		
		if (!data.id) {
			return {
				valid: false,
				message: 'Invalid id'
			};
		}
		
		return AiPromptsDataUtils.validCreateData(data);
	}
}