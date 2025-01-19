import { expect, test } from 'vitest';
import { AiPromptsRepository } from '$lib/server/repository/AiPromptsRepository';
import type { AiPromptsCreateRequestData } from '$lib/common/models/AiPromptsData';
import type { AiPromptsEntity } from '$lib/server/entities/AiPromptsEntity';

test(
	'insertTest',
	async () => {
		const systemPromptsList = [
			'You are a cryptocurrency market data analysis expert. You are proficient in time series analysis and chart analysis, and you can accurately predict future market lows, highs, and investment opinions (buy, sell, hold) based on past market data.',
			'You provide an objective market outlook by comprehensively analyzing various factors such as price fluctuations, market sentiment, and investor behavior.',
			'You perform comprehensive market analysis using a variety of data, including cryptocurrency trading volume, market capitalization, on-chain data, and macroeconomic indicators (such as inflation, interest rates, and geopolitical events).',
			'Your predictions are always based on evidence and uncertainties are clearly stated.',
			'You do not provide investment advice, and you focus solely on providing information.',
			'All information provided should be used for educational purposes only and should not be used as a basis for investment decisions.'
		];

		const userPromptsList = [
			{
				userId: 1,
				aiModelId: 1,
				title: 'Days Prompts',
				userPromptsList: ['Data provision for the next 7 days from today is important.'],
				defaultYn: true,
				aiResponseModelsId: 1
			},
			{
				userId: 1,
				aiModelId: 3,
				title: 'Days Prompts',
				userPromptsList: ['Data provision for the next 7 days from today is important.'],
				defaultYn: true,
				aiResponseModelsId: 3
			},
			{
				userId: 1,
				aiModelId: 2,
				title: 'Days Prompts',
				userPromptsList: [
					'The most important requirement is that it should contain information for the next seven days from now.'
				],
				defaultYn: true,
				aiResponseModelsId: 2
			},
			{
				userId: 1,
				aiModelId: 2,
				title: 'Hours Prompts',
				userPromptsList: [
					'The most important requirement is to provide data every hour for the next 48 hours (2 days), starting with the latest hour of input data.'
				],
				defaultYn: false,
				aiResponseModelsId: 2
			},
			{
				userId: 2,
				aiModelId: 2,
				title: 'Days Prompts',
				userPromptsList: [
					'The most important requirement is that it should contain information for the next seven days from now.'
				],
				defaultYn: true,
				aiResponseModelsId: 2
			}
		];

		for (const item of userPromptsList) {
			const aiPromptsCreateRequestData: AiPromptsCreateRequestData = {
				aiModelId: item.aiModelId,
				title: item.title,
				systemPromptsList: systemPromptsList,
				userPromptsList: item.userPromptsList,
				defaultYn: item.defaultYn,
				aiResponseModelsId: item.aiResponseModelsId
			};

			const entities = await AiPromptsRepository.insertAiPrompts(
				item.userId,
				aiPromptsCreateRequestData
			);

			console.log(entities);
		}
	},
	{ timeout: 1000 * 60 }
);

test(
	'findAllByUserIdAndAiModelIdTest',
	async () => {
		const userId = 1;
		const aiPromptsId = 1;

		const entity: AiPromptsEntity | null = await AiPromptsRepository.findTopByUserIdAndId(
			userId,
			aiPromptsId
		);

		expect(entity).not.toBeNull();

		if (entity === null) {
			return;
		}

		console.log(entity.user_prompts_array);
		console.log(entity.system_prompts_array);
	},
	{ timeout: 1000 * 60 }
);
