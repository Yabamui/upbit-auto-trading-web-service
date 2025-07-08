import type { AiAnalyticsRequestEntity } from '$lib/server/entities/AiAnalyticsRequestEntity';
import type { AiAnalyticsRequestCreateRequestData } from '$lib/common/models/AiAnalyticsRequestData';
import { connectToDB } from '$lib/server/config/PGConfig';

export const AiAnalyticsRequestRepository = {
	insertAiAnalyticsRequest: insertAiAnalyticsRequest,
	updateAiAnalyticsRequest: updateAiAnalyticsRequest,

	findAllByRequestYnLimit: findAllByRequestYnLimit
};

async function findAllByRequestYnLimit(
	requestYn: boolean,
	count: number
): Promise<AiAnalyticsRequestEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `
      SELECT *
      FROM ai_analytics_request
      WHERE request_yn = $1
      limit $2;`;

	try {
		const result = await dbConn.query(query, [requestYn, count]);
		return result.rows;
	} catch (error) {
		console.error('### AiAnalyticsRequestRepository.findAllByRequestYn Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function insertAiAnalyticsRequest(
	createRequestData: AiAnalyticsRequestCreateRequestData
): Promise<AiAnalyticsRequestEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `
      INSERT INTO ai_analytics_request
      (user_id,
       market,
       ai_model_id,
       ai_prompts_id,
       candle_unit,
       candle_count,
       candle_time_zone,
       request_yn)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`;

	try {
		const result = await dbConn.query(query, [
			createRequestData.userId,
			createRequestData.market,
			createRequestData.aiModelId,
			createRequestData.aiPromptsId,
			createRequestData.candleUnit,
			createRequestData.candleCount,
			createRequestData.candleTimeZone,
			createRequestData.requestYn
		]);
		return result.rows[0] as AiAnalyticsRequestEntity;
	} catch (error) {
		console.error('### AiAnalyticsRequestRepository.insertAiAnalyticsRequest Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateAiAnalyticsRequest(
	aiAnalyticsRequestEntity: AiAnalyticsRequestEntity
): Promise<AiAnalyticsRequestEntity | null> {
	const dbConn = await connectToDB();
	
	const query = `
      UPDATE ai_analytics_request
      SET request_yn     = $2,
          result         = $3,
          result_code		= $4,
          ai_response_id = $5
      WHERE id = $1
      RETURNING *;`;

	try {
		const queryResult = await dbConn.query(query, [
			aiAnalyticsRequestEntity.id,
			aiAnalyticsRequestEntity.request_yn,
			aiAnalyticsRequestEntity.result,
			aiAnalyticsRequestEntity.result_code,
			aiAnalyticsRequestEntity.ai_response_id
		]);
		return queryResult.rows[0] as AiAnalyticsRequestEntity;
	} catch (error) {
		console.error('### AiAnalyticsRequestRepository.updateAiAnalyticsRequest Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}
