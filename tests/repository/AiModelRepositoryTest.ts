import { test } from 'vitest';
import { AiModelRepository } from '$lib/server/repository/AiModelRepository';
import type { AiModelEntity } from '$lib/server/entities/AiModelEntity';

test(
	'createInitDataTest',
	async () => {
		await AiModelRepository.createTable();

		await AiModelRepository.insertInitData();

		const aiModelList: AiModelEntity[] = await AiModelRepository.findAll();

		console.log('### createInitDataTest Default Data Inserted count: ' + aiModelList.length);
	},
	{ timeout: 1000 * 60 * 5 }
);
