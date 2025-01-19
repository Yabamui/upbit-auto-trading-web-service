import type { ResponseSchema } from '@google/generative-ai';
import type { AiResponseModelsEntity } from '$lib/server/entities/AiResponseModelsEntity';
import { connectToDB } from '$lib/server/config/PGConfig';

export const AiResponseModelsRepository = {
	insertAiResponseModels: insertAiResponseModels,
	updateAiResponseModels: updateAiResponseModels,
	findTopByIdAndAiModelId: findTopByIdAndAiModelId,
	findAllByAiModelId: findAllByAiModelId
};

async function findTopByIdAndAiModelId(
	id: number,
	aiModelId: number
): Promise<AiResponseModelsEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      select *
      from ai_response_models
      where id = $1
        and ai_model_id = $2;`;

	try {
		const result = await dbConn.query(query, [id, aiModelId]);
		return result.rows[0] as AiResponseModelsEntity;
	} catch (error) {
		console.error('### AiResponseModelsRepository.findTopByIdAndAiModelId Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByAiModelId(aiModelId: number): Promise<AiResponseModelsEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      select *
      from ai_response_models
      where ai_model_id = $1;`;

	try {
		const result = await dbConn.query(query, [aiModelId]);
		return result.rows as AiResponseModelsEntity[];
	} catch (error) {
		console.error('### AiResponseModelsRepository.findAllByAiModelId Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function insertAiResponseModels(
	aiModelId: number,
	title: string,
	responseSchema: ResponseSchema
): Promise<AiResponseModelsEntity | null> {
	const dbConn = await connectToDB();

	const insertQuery = `insert into ai_response_models (ai_model_id, title, response_model_json)
                       values ($1, $2, $3)
                       returning *;`;

	try {
		const result = await dbConn.query(insertQuery, [aiModelId, title, responseSchema]);
		return result.rows[0];
	} catch (error) {
		console.error('### AiResponseModelsRepository.insert Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateAiResponseModels(
	id: number,
	title: string,
	responseSchema: ResponseSchema
): Promise<AiResponseModelsEntity | null> {
	const dbConn = await connectToDB();

	const updateQuery = `update ai_response_models
                       set title               = $2,
                           response_model_json = $3
                       where id = $1
                       returning *;`;

	try {
		const result = await dbConn.query(updateQuery, [id, title, responseSchema]);
		return result.rows[0];
	} catch (error) {
		console.error('### AiResponseModelsRepository.update Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}
