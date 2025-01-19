import type { AiResponsesEntity } from '$lib/server/entities/AiResponsesEntity';
import { connectToDB } from '$lib/server/config/PGConfig';

export const AiResponsesRepository = {
	insertAiResponses: insertAiResponses,
	deleteAiResponses: deleteAiResponses,
	findAllByUserIdAndMarket: findAllByUserIdAndMarket,
	findAllByTodayInference: findAllByTodayInference,
};

async function findAllByUserIdAndMarket(
	userId: number,
	market: string
): Promise<AiResponsesEntity[]> {
	const dbConn = await connectToDB();
	const query = `
      select *
      from ai_responses
      where true
        and deleted_at is null
        and user_id = $1
        and market = $2
      order by id desc;`;

	try {
		const result = await dbConn.query(query, [userId, market]);

		return result.rows;
	} catch (error) {
		console.error('### AiResponsesRepository.findAllByUserIdAndMarket Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByTodayInference(
	userId: number,
	candleType: string,
	today: string
) {
	console.log(candleType);
	const dbConn = await connectToDB();
	const query = `
      select mi.market,
             mi.korean_name,
             analytics.created_at,
             analytics.candle_type,
             date,
             time,
             judgement_basis_kr,
             evaluation,
             open_price,
             close_price,
             high_price,
             low_price
      from (select market,
                   created_at,
                   candle_type,
                   a ->> 'date'::varchar              as date,
                   a ->> 'time'::varchar              as time,
                   a ->> 'judgementBasis'::varchar   as judgement_basis,
                   a ->> 'judgementBasisKr'::varchar as judgement_basis_kr,
                   a ->> 'evaluation'::varchar       as evaluation,
                   (a ->> 'openPrice')::float        as open_price,
                   (a ->> 'closePrice')::float       as close_price,
                   (a ->> 'highPrice')::float        as high_price,
                   (a ->> 'lowPrice')::float         as low_price
            from ai_responses,
                 json_array_elements(response -> 'items') a
            where deleted_at is null
              and user_id = $1
              and candle_type = $2
              and (a ->> 'date')::varchar = $3) as analytics
               join market_info mi on analytics.market = mi.market
      order by market, created_at desc;`;

	try {
		const result = await dbConn.query(query, [userId, candleType, today]);

		return result.rows;
	} catch (error) {
		console.error('### AiResponsesRepository.findAllByTodayInference Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function insertAiResponses(
	userId: number,
	market: string,
	aiModelId: number,
	aiPromptsId: number,
	aiResponseModesId: number | null,
	response: object,
	candleType: string,
	candleCount: number,
	candleTimeZone: string,
	candleDateTimeKstBegin: string,
	candleDateTimeKstEnd: string
): Promise<AiResponsesEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      insert into ai_responses
      (user_id,
       market,
       ai_model_id,
       ai_prompts_id,
       ai_response_models_id,
       response,
       candle_type,
       candle_count,
       candle_time_zone,
       candle_date_time_kst_begin,
       candle_date_time_kst_end)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning *;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			market,
			aiModelId,
			aiPromptsId,
			aiResponseModesId,
			response,
			candleType,
			candleCount,
			candleTimeZone,
			candleDateTimeKstBegin,
			candleDateTimeKstEnd
		]);

		return result.rows[0];
	} catch (error) {
		console.error('### AiResponsesRepository.insert Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function deleteAiResponses(userId: number, id: number): Promise<boolean> {
	const dbConn = await connectToDB();
	
	const query = `
      update ai_responses
      set deleted_at = now()
      where user_id = $1
        and id = $2;`;

	try {
		await dbConn.query(query, [userId, id]);
		return true;
	} catch (error) {
		console.error('### AiResponsesRepository.deletedAiResponses Error: ' + error);
		return false;
	} finally {
		dbConn.release();
	}
}
