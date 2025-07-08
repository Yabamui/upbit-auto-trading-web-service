import type { AiAnalyticsRequestSchedulerEntity } from '$lib/server/entities/AiAnalyticsRequestSchedulerEntity';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import type {
	AiAnalyticsRequestSchedulerCreateData,
	AiAnalyticsRequestSchedulerUpdateData
} from '$lib/common/models/AiAnalyticsRequestSchedulerData';

export const AiAnalyticsRequestSchedulerRepository = {
	findAllByUserId: findAllByUserId,
	countAllByUserIdAndId: countAllByUserIdAndId,
	countAllByUserIdAndAiModelIdAndCandleUnitAndExecuteHoursAndExecuteMinutes:
		countAllByUserIdAndAiModelIdAndCandleUnitAndExecuteHoursAndExecuteMinutes,
	insertByAiAnalyticsRequestSchedulerCreateData: insertByAiAnalyticsRequestSchedulerCreateData,
	updateByAiAnalyticsRequestSchedulerUpdateData: updateByAiAnalyticsRequestSchedulerUpdateData,
	deleteByUserIdAndId: deleteByUserIdAndId
};

async function findAllByUserId(userId: number): Promise<AiAnalyticsRequestSchedulerEntity[]> {
	const dbConn = await connectToDB();
	const query = `
      select *
      from ai_analytics_request_scheduler
      where true
        and deleted_at is null
        and user_id = $1
      order by id desc;`;

	try {
		const result = await dbConn.query(query, [userId]);

		return result.rows;
	} catch (error) {
		LoggingUtils.error('AiAnalyticsRequestSchedulerRepository.findAllByUserId', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndId(
	userId: number,
	id: number
): Promise<number | undefined> {
	const dbConn = await connectToDB();
	const query = `
			select count(id)
			from ai_analytics_request_scheduler
			where true
				and deleted_at is null
				and user_id = $1
				and id = $2
			;`;

	try {
		const result = await dbConn.query(query, [userId, id]);

		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error('AiAnalyticsRequestSchedulerRepository.findTopByUserIdAndId', `${error}`);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndAiModelIdAndCandleUnitAndExecuteHoursAndExecuteMinutes(
	userId: number,
	aiModelId: number,
	candleUnit: string,
	executeHours: number,
	executeMinutes: number
): Promise<number | undefined> {
	const dbConn = await connectToDB();
	const query = `
      select count(*)
      from ai_analytics_request_scheduler
      where true
        and deleted_at is null
        and user_id = $1
        and ai_model_id = $2
        and candle_unit = $3
        and execute_hours = $4
        and execute_minutes = $5
      ;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			aiModelId,
			candleUnit,
			executeHours,
			executeMinutes
		]);

		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error(
			'AiAnalyticsRequestSchedulerRepository.countAllByUserIdAndAiModelIdAndCandleUnitAndExecuteHoursAndExecuteMinutes',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function insertByAiAnalyticsRequestSchedulerCreateData(
	userId: number,
	data: AiAnalyticsRequestSchedulerCreateData
): Promise<AiAnalyticsRequestSchedulerEntity | undefined> {
	const dbConn = await connectToDB();
	const query = `
      insert into ai_analytics_request_scheduler
      (user_id,
       ai_model_id,
       market_currency,
       candle_unit,
       candle_count,
       candle_time_zone,
       retry_yn,
       execute_hours,
       execute_minutes,
       execute_yn,
       include_exclude,
       market_list,
       ai_prompts_id)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			data.aiModelId,
			data.marketCurrency,
			data.candleUnit,
			data.candleCount,
			data.candleTimeZone,
			data.retryYn,
			data.executeHours,
			data.executeMinutes,
			data.executeYn,
			data.includeExclude,
			data.marketList,
			data.aiPromptsId
		]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'AiAnalyticsRequestSchedulerRepository.insertByAiAnalyticsRequestSchedulerCreateData',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function updateByAiAnalyticsRequestSchedulerUpdateData(
	userId: number,
	data: AiAnalyticsRequestSchedulerUpdateData
): Promise<AiAnalyticsRequestSchedulerEntity | undefined> {
	const dbConn = await connectToDB();
	const query = `
      update ai_analytics_request_scheduler
      set ai_model_id      = $3,
          market_currency  = $4,
          candle_unit      = $5,
          candle_count     = $6,
          candle_time_zone = $7,
          retry_yn         = $8,
          execute_hours    = $9,
          execute_minutes  = $10,
          execute_yn       = $11,
          include_exclude  = $12,
          market_list      = $13,
          ai_prompts_id    = $14
      where true
        and deleted_at is null
        and user_id = $1
        and id = $2
      returning *;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			data.id,
			data.aiModelId,
			data.marketCurrency,
			data.candleUnit,
			data.candleCount,
			data.candleTimeZone,
			data.retryYn,
			data.executeHours,
			data.executeMinutes,
			data.executeYn,
			data.includeExclude,
			data.marketList,
			data.aiPromptsId
		]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'AiAnalyticsRequestSchedulerRepository.updateByAiAnalyticsRequestSchedulerUpdateData',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function deleteByUserIdAndId(
	userId: number,
	id: number
): Promise<boolean> {
	const dbConn = await connectToDB();
	const query = `
      delete
      from ai_analytics_request_scheduler
      where true
        and user_id = $1
        and id = $2
      ;`;

	try {
		await dbConn.query(query, [userId, id]);
		return true;
	} catch (error) {
		LoggingUtils.error('AiAnalyticsRequestSchedulerRepository.deleteByUserIdAndId', `${error}`);
		return false;
	} finally {
		dbConn.release();
	}
}
