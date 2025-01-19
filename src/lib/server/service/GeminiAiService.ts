import { type Content, GoogleGenerativeAI, type ResponseSchema } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import type { AiRequestModelCase1Data } from '$lib/common/models/AiRequestModelData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export const GeminiAiService = {
	generateContent: generateContent
};

async function generateContent(
	modelNameCode: string,
	responseSchema: ResponseSchema,
	systemPromptsArray: string[],
	userPromptsArray: string[],
	requestModelData: AiRequestModelCase1Data
): Promise<string | null | undefined> {
	try {
		const generationConfig = {
			temperature: 1.0,
			responseMimeType: 'application/json',
			responseSchema: responseSchema
		}

		const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
		
		const systemInstruction = generateSystemInstruction(systemPromptsArray);

		const model = genAI.getGenerativeModel({
			model: modelNameCode,
			generationConfig: generationConfig,
			systemInstruction: systemInstruction
		});

		const userInstruction = generateUserInstruction(userPromptsArray, requestModelData);

		if (userInstruction.length === 0) {
			return null;
		}

		const result = await model.generateContent({
			systemInstruction: systemInstruction,
			contents: userInstruction,
		});

		return result.response.text();
	} catch (error) {
		console.error('### GeminiAiService.generateContent Error: ' + error);
		return null;
	}
}

function generateSystemInstruction(systemPromptsArray: string[]): Content | undefined {
	if (!systemPromptsArray || systemPromptsArray.length === 0) {
		return undefined;
	}

	return {
		role: 'system',
		parts: systemPromptsArray.map((systemPrompt: string) => {
			return {
				text: systemPrompt
			};
		})
	};
}

function generateUserInstruction(
	userPromptsArray: string[],
	requestModelData: AiRequestModelCase1Data
): Content[] {
	if (!userPromptsArray || userPromptsArray.length === 0) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} ### generateUserInstruction userPromptsArray is null`
		);
		return [];
	}

	if (!requestModelData) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} ### generateUserInstruction requestModelData is null`
		);
		return [];
	}

	return [
		{
			role: 'user',
			parts: userPromptsArray.map((userPrompt: string) => {
				return {
					text: userPrompt
				};
			})
		},
		{
			role: 'user',
			parts: [
				{
					text: 'Input Data : \n' + JSON.stringify(requestModelData)
				}
			]
		}
	];
}
