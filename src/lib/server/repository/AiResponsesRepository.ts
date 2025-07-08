import type {
	AiLatestInferenceEntity,
	AiResponsesEntity
} from '$lib/server/entities/AiResponsesEntity';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const AiResponsesRepository = {
	findTopByUserIdAndIdAndMarket: findTopByUserIdAndIdAndMarket,
	findAllByUserIdAndMarket: findAllByUserIdAndMarket,
	findAllByUserIdAndRowNumber: findAllByUserIdAndRowNumber,
	findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone:
		findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone,
	findAllLatestByUserIdAndMarketAndCandleUnitAndCandleTimeZone:
		findAllLatestByUserIdAndMarketAndCandleUnitAndCandleTimeZone,
	insertAiResponses: insertAiResponses,
	deleteAiResponses: deleteAiResponses
};

async function findTopByUserIdAndIdAndMarket(
	userId: number,
	aiResponsesId: number,
	market: string
): Promise<AiResponsesEntity | null> {
	const dbConn = await connectToDB();
	const query = `
      select *
      from ai_responses
      where true
        and deleted_at is null
        and user_id = $1
        and id = $2
        and market = $3
      order by id desc
      limit 1;`;

	try {
		const result = await dbConn.query(query, [userId, aiResponsesId, market]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error('AiResponsesRepository.findTopByUserIdAndIdAndMarket', `${error}`);
		return null;
	} finally {
		dbConn.release();
	}
}

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
		LoggingUtils.error('AiResponsesRepository.findAllByUserIdAndMarket', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndRowNumber(
	userId: number,
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string
): Promise<AiResponsesEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      with summary as
               (select *,
                       row_number() over (partition by market order by updated_at desc ) as row_number
                from ai_responses
                where true
                  and deleted_at is null
                  and user_id = $1
                  and candle_unit = $2
                  and market like $3
                  and candle_time_zone = $4)
      select *
      from summary
      where true
        and row_number = 1`;

	try {
		const result = await dbConn.query(query, [
			userId,
			candleUnit,
			`${marketCurrency}%`,
			candleTimeZone
		]);

		return result.rows as AiResponsesEntity[];
	} catch (error) {
		LoggingUtils.error('AiResponsesRepository.findAllByUserIdAndRowNumber', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone(
	userId: number,
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string,
	nowDateUtc: string
): Promise<AiLatestInferenceEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      with query_result as
               (select ar.id,
                       ar.user_id,
                       ar.market,
                       ar.ai_model_id,
                       ar.ai_prompts_id,
                       ar.ai_response_models_id,
                       ar.candle_unit,
                       ar.candle_count,
                       ar.candle_time_zone,
                       ar.candle_date_time_begin,
                       ar.candle_date_time_end,
                       ar.created_at,
                       ar.updated_at,
                       ar.response -> 'totalJudgement'   as total_judgement,
                       ar.response -> 'totalJudgementKr' as total_judgement_kr,
                       jsonItems ->> 'date'              as date,
                       jsonItems ->> 'time'              as time,
                       jsonItems ->> 'lowPrice'          as low_price,
                       jsonItems ->> 'highPrice'         as high_price,
                       jsonItems ->> 'openPrice'         as open_price,
                       jsonItems ->> 'closePrice'        as close_price,
                       jsonItems ->> 'evaluation'        as evaluation,
                       jsonItems ->> 'judgementBasis'    as judgement_basis,
                       jsonItems ->> 'judgementBasisKr'  as judgement_basis_kr,
                       row_number() over (
                           partition by ar.market, jsonItems ->> 'date' order by ar.id desc
                           )                             as rn
                from ai_responses ar,
                     jsonb_array_elements(ar.response -> 'items') as jsonItems
                where true
                  and ar.deleted_at is null
                  and ar.user_id = $1
                  and ar.market like $2
                  and ar.candle_unit = $3
                  and ar.candle_time_zone = $4
                  and (jsonItems ->> 'date')::varchar >= $5)
      select *
      from query_result
      where rn = 1
      ;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			`${marketCurrency}%`,
			candleUnit,
			candleTimeZone,
			nowDateUtc
		]);

		return result.rows as AiLatestInferenceEntity[];
	} catch (error) {
		LoggingUtils.error(
			'AiResponsesRepository.findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone',
			`${error}`
		);

		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllLatestByUserIdAndMarketAndCandleUnitAndCandleTimeZone(
	userId: number,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	nowDateUtc: string
): Promise<AiLatestInferenceEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `
      with query_result as
               (select ar.id,
                       ar.user_id,
                       ar.market,
                       ar.ai_model_id,
                       ar.ai_prompts_id,
                       ar.ai_response_models_id,
                       ar.candle_unit,
                       ar.candle_count,
                       ar.candle_time_zone,
                       ar.candle_date_time_begin,
                       ar.candle_date_time_end,
                       ar.created_at,
                       ar.updated_at,
                       ar.response -> 'totalJudgement'   as total_judgement,
                       ar.response -> 'totalJudgementKr' as total_judgement_kr,
                       jsonItems ->> 'date'              as date,
                       jsonItems ->> 'time'              as time,
                       jsonItems ->> 'lowPrice'          as low_price,
                       jsonItems ->> 'highPrice'         as high_price,
                       jsonItems ->> 'openPrice'         as open_price,
                       jsonItems ->> 'closePrice'        as close_price,
                       jsonItems ->> 'evaluation'        as evaluation,
                       jsonItems ->> 'judgementBasis'    as judgement_basis,
                       jsonItems ->> 'judgementBasisKr'  as judgement_basis_kr,
                       row_number() over (
                           partition by ar.market, jsonItems ->> 'date' order by ar.id desc
                           )                             as rn
                from ai_responses ar,
                     jsonb_array_elements(ar.response -> 'items') as jsonItems
                where true
                  and ar.deleted_at is null
                  and ar.user_id = $1
                  and ar.market = $2
                  and ar.candle_unit = $3
                  and ar.candle_time_zone = $4
                  and (jsonItems ->> 'date')::varchar >= $5)
      select *
      from query_result
      where rn = 1
      ;`;
	
	try {
		const result = await dbConn.query(query, [
			userId,
			market,
			candleUnit,
			candleTimeZone,
			nowDateUtc
		]);
		
		return result.rows as AiLatestInferenceEntity[];
	} catch (error) {
		LoggingUtils.error(
			'AiResponsesRepository.findAllLatestByUserIdAndMarketLikeAndCandleUnitAndCandleTimeZone',
			`${error}`
		);
		
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
	candleUnit: string,
	candleCount: number,
	candleTimeZone: string,
	candleDateTimeBegin: string,
	candleDateTimeEnd: string
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
       candle_unit,
       candle_count,
       candle_time_zone,
       candle_date_time_begin,
       candle_date_time_end)
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
			candleUnit,
			candleCount,
			candleTimeZone,
			candleDateTimeBegin,
			candleDateTimeEnd
		]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error('AiResponsesRepository.insertAiResponses', `${error}`);
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
		LoggingUtils.error('AiResponsesRepository.deleteAiResponses', `${error}`);
		return false;
	} finally {
		dbConn.release();
	}
}
