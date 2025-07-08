import type { AiPromptsEntity } from '$lib/server/entities/AiPromptsEntity';
import type {
	AiPromptsCreateRequestData,
	AiPromptsUpdateRequestData
} from '$lib/common/models/AiPromptsData';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const AiPromptsRepository = {
	findTopByUserIdAndId: findTopByUserIdAndId,
	findAllByUserIdAndAiModelId: findAllByUserIdAndAiModelId,
	findAllByUserIdAndAiModelIdAndDefaultYn: findAllByUserIdAndAiModelIdAndDefaultYn,
	findAllByUserId: findAllByUserId,
	findAllByUserIdAndIdIn: findAllByUserIdAndIdIn,
	countAllByUserIdAndId: countAllByUserIdAndId,
	insertAiPrompts: insertAiPrompts,
	updateAiPrompts: updateAiPrompts,
	updateAiPromptsDefaultYn: updateAiPromptsDefaultYn,
	deleteAiPrompts: deleteAiPrompts
};

async function findTopByUserIdAndId(
	userId: number,
	aiPromptsId: number
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
		LoggingUtils.error('AiPromptsRepository.findTopByUserIdAndId', `${error}`);
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
		LoggingUtils.error('AiPromptsRepository.findAllByUserIdAndAiModelIdAndDefaultYn', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserId(userId: number): Promise<AiPromptsEntity[]> {
	const dbConn = await connectToDB();

	const query = `select *
                 from ai_prompts
                 where true
                   and deleted_at is null
                   and user_id = $1;`;

	try {
		const result = await dbConn.query(query, [userId]);
		return result.rows;
	} catch (error) {
		LoggingUtils.error('AiPromptsRepository.findAllByUserId', `${error}`);
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
		LoggingUtils.error('AiPromptsRepository.findAllByUserIdAndAiModelId', `${error}`);
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
                   and id = any ($2);`;

	try {
		const result = await dbConn.query(query, [userId, aiPromptsIdList]);
		return result.rows;
	} catch (error) {
		LoggingUtils.error('AiPromptsRepository.findAllByUserIdAndIdIn', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndId(
	userId: number,
	aiPromptsId: number
): Promise<number | undefined> {
	const dbConn = await connectToDB();

	const query = `select count(*)
                 from ai_prompts
                 where true
                   and deleted_at is null
                   and user_id = $1
                   and id = $2;`;

	try {
		const result = await dbConn.query(query, [userId, aiPromptsId]);
		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error('AiPromptsRepository.countAllByUserId', `${error}`);
		return undefined;
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
      SET ai_model_id           = $3,
          title                 = $4,
          system_prompts_array  = $5,
          user_prompts_array    = $6,
          default_yn            = $7,
          ai_response_models_id = $8
      WHERE true
        and deleted_at is null
        and id = $1
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
		LoggingUtils.error('AiPromptsRepository.updateAiPrompts', `${error}`);
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
      WHERE true
        and deleted_at is null
        and id = $1
        and user_id = $2
      RETURNING *;
	`;

	try {
		const result = await dbConn.query(query, [aiPromptsId, userId, defaultYn]);
		return result.rows[0] as AiPromptsEntity;
	} catch (error) {
		LoggingUtils.error('AiPromptsRepository.updateAiPromptsDefaultYn', `${error}`);
		return null;
	} finally {
		dbConn.release();
	}
}

async function deleteAiPrompts(userId: number, aiPromptsId: number): Promise<boolean> {
	const dbConn = await connectToDB();

	const query = `
      UPDATE ai_prompts
      SET deleted_at = now()
      WHERE true
        and id = $1
        and user_id = $2;
	`;

	try {
		await dbConn.query(query, [aiPromptsId, userId]);
		return true;
	} catch (error) {
		LoggingUtils.error('AiPromptsRepository.deleteAiPrompts', `${error}`);
		return false;
	} finally {
		dbConn.release();
	}
}
