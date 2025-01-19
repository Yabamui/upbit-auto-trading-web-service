import { expect, test } from 'vitest';
import { type ResponseSchema, SchemaType } from '@google/generative-ai';
import { AiResponseModelsRepository } from '$lib/server/repository/AiResponseModelsRepository';
import type { AiResponseModelsEntity } from '$lib/server/entities/AiResponseModelsEntity';

test(
	'insertTest',
	async () => {
		const title = 'Total Judgement And Items';
		const schema = {
			type: SchemaType.OBJECT,
			description: 'Object of Results',
			required: ['totalJudgement', 'totalJudgementKr', 'timeZone', 'items'],
			properties: {
				totalJudgement: {
					type: SchemaType.STRING,
					description: 'Total Logic and Data basis supporting the judgment of the coin',
					nullable: false
				},
				totalJudgementKr: {
					type:SchemaType.STRING,
					description: 'Korean translation of totalJudgement',
					nullable: false
				},
				timeZone: {
					type: SchemaType.STRING,
					description: 'Timezone information based on inference data output',
					enum: ['KST', 'UTC'],
					nullable: false
				},
				items: {
					type: SchemaType.ARRAY,
					description: 'List of inference data items',
					items: {
						type: SchemaType.OBJECT,
						description: 'Daily Inference Data',
						properties: {
							date: {
								type: SchemaType.STRING,
								description: 'Inference Data Date in YYYY-MM-DD format',
								nullable: false
							},
							time: {
								type: SchemaType.STRING,
								description: 'Inference Data Time in HH:MM:SS format',
								nullable: false
							},
							openPrice: {
								type: SchemaType.NUMBER,
								description: "Inference Data open price. Previous day's close price.",
								nullable: false
							},
							highPrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data high price',
								nullable: false
							},
							lowPrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data low price',
								nullable: false
							},
							closePrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data close price',
								nullable: false
							},
							judgementBasis: {
								type: SchemaType.STRING,
								description: 'Logic and Data basis supporting the judgment',
								nullable: false
							},
							judgementBasisKr: {
								type: SchemaType.STRING,
								description: 'Korean translation of judgementBasis',
								nullable: false
							},
							evaluation: {
								type: SchemaType.STRING,
								description: 'Inference Data evaluation',
								enum: ['hold', 'buy', 'sell'],
								nullable: false
							}
						},
						required: [
							'date',
							'time',
							'openPrice',
							'highPrice',
							'lowPrice',
							'closePrice',
							'judgementBasis',
							'judgementBasisKr',
							'evaluation'
						]
					}
				}
			}
		} as ResponseSchema;
		
		const id = 3;

		const entity: AiResponseModelsEntity | null =
			await AiResponseModelsRepository.updateAiResponseModels(id, title, schema);

		expect(entity).not.toBeNull();

		if (entity === null) {
			return;
		}

		console.log(entity.ai_model_id);
		console.log(entity.response_model_json);
	},
	{ timeout: 1000 * 60 }
);

test(
	'findTopByIdTest',
	async () => {
		const id = 1;
		const aiModelId = 1;

		const entity: AiResponseModelsEntity | null =
			await AiResponseModelsRepository.findTopByIdAndAiModelId(id, aiModelId);

		expect(entity).not.toBeNull();

		if (entity === null) {
			return;
		}

		console.log(entity.ai_model_id);
		console.log(entity.response_model_json);
	},
	{ timeout: 1000 * 60 }
);
