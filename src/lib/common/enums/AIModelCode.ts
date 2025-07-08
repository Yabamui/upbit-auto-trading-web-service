export interface AIModelCodeData {
	code: string;
	name: string;
}

export const AIModelCode = {
	GEMINI: {
		code: 'GEMINI',
		name: 'Gemini AI',
	}
}

export const AIModelCodeDataUtils = {
	existAiModelCode: (code: string): boolean => {
		return Object.values(AIModelCode).some((aiModelCode: AIModelCodeData) => {
			return aiModelCode.code === code;
		});
	}
}