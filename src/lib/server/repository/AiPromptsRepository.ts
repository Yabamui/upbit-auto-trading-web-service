import type { AiPromptsEntity } from '$lib/server/entities/AiPromptsEntity';
import type {
	AiPromptsCreateRequestData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import { connectToDB } from '$lib/server/config/PGConfig';

export const AiPromptsRepository = {
	findTopByUserIdAndId: findTopByUserIdAndId,
	findAllByUserIdAndAiModelId: findAllByUserIdAndAiModelId,
	findAllByUserIdAndAiModelIdAndDefaultYn: findAllByUserIdAndAiModelIdAndDefaultYn,
	findAllByUserIdAndIdIn: findAllByUserIdAndIdIn,
	insertAiPrompts: insertAiPrompts,
	updateAiPrompts: updateAiPrompts,
	updateAiPromptsDefaultYn: updateAiPromptsDefaultYn
};

async function findTopByUserIdAndId(
	userId: number,
	aiPromptsId: number,
): Promise<AiPromptsEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `select *
                 from ai_prompts
                 where true
                   and deleted_at is null
                   and user_id = $1
                   and id = $2;`;

	try {
		const result = await dbConn.query(query, [userId, aiPromptsId]);
		return result.rows[0] as AiPromptsEntity;
	} catch (error) {
		console.error('### AiPromptsRepository.findTopById Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndAiModelIdAndDefaultYn(
	userId: number,
	aiModelId: number,
	defaultYn: boolean
): Promise<AiPromptsEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `select *
                 from ai_prompts
                 where true
                   and deleted_at is null
                   and user_id = $1
                   and ai_model_id = $2
                   and default_yn = $3;`;

	try {
		const result = await dbConn.query(query, [userId, aiModelId, defaultYn]);
		return result.rows;
	} catch (error) {
		console.error('### AiPromptsRepository.findAllByUserIdAndAiModelId Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndAiModelId(
	userId: number,
	aiModelId: number
): Promise<AiPromptsEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `select *
                 from ai_prompts
                 where true
                   and deleted_at is null
                   and user_id = $1
                   and ai_model_id = $2;`;
	
	try {
		const result = await dbConn.query(query, [userId, aiModelId]);
		return result.rows;
	} catch (error) {
		console.error('### AiPromptsRepository.findAllByUserIdAndAiModelId Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndIdIn(
	userId: number,
	aiPromptsIdList: number[]
): Promise<AiPromptsEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `select *
								 from ai_prompts
								 where true
								   and deleted_at is null
									 and user_id = $1
									 and id = any($2);`;

	try {
		const result = await dbConn.query(query, [userId, aiPromptsIdList]);
		return result.rows;
	} catch (error) {
		console.error('### AiPromptsRepository.findAllByUserIdAndIdIn Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function insertAiPrompts(
	userId: number,
	createRequestData: AiPromptsCreateRequestData
): Promise<AiPromptsEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `
      INSERT INTO ai_prompts (user_id, ai_model_id, title, system_prompts_array, user_prompts_array, default_yn,
                              ai_response_models_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
	`;

	try {
		const result = await dbConn.query(query, [
			userId,
			createRequestData.aiModelId,
			createRequestData.title,
			createRequestData.systemPromptsList,
			createRequestData.userPromptsList,
			createRequestData.defaultYn,
			createRequestData.aiResponseModelsId
		]);

		return result.rows[0] as AiPromptsEntity;
	} catch (error) {
		console.error('### AiPromptsRepository.insert Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateAiPrompts(
	userId: number,
	updateRequestData: AiPromptsUpdateRequestData
): Promise<AiPromptsEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `
      UPDATE ai_prompts
      SET ai_model_id = $3,
          title = $4,
					system_prompts_array = $5,
					user_prompts_array = $6,
					default_yn = $7,
					ai_response_models_id = $8
      WHERE id = $1
        and user_id = $2
      RETURNING *;
	`;

	try {
		const result = await dbConn.query(query, [
			updateRequestData.id,
			userId,
			updateRequestData.aiModelId,
			updateRequestData.title,
			updateRequestData.systemPromptsList,
			updateRequestData.userPromptsList,
			updateRequestData.defaultYn,
			updateRequestData.aiResponseModelsId
		]);

		return result.rows[0] as AiPromptsEntity;
	} catch (error) {
		console.error('### AiPromptsRepository.update Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateAiPromptsDefaultYn(
	userId: number,
	aiPromptsId: number,
	defaultYn: boolean
): Promise<AiPromptsEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `
			UPDATE ai_prompts
			SET default_yn = $3
			WHERE id = $1
				and user_id = $2
			RETURNING *;
	`;

	try {
		const result = await dbConn.query(query, [aiPromptsId, userId, defaultYn]);
		return result.rows[0] as AiPromptsEntity;
	} catch (error) {
		console.error('### AiPromptsRepository.updateDefaultYn Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}
