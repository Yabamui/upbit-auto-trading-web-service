import type { ProphetAnalyticsRequestSchedulerEntity } from '$lib/server/entities/ProphetAnalyticsRequestSchedulerEntity';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import type {
	ProphetAnalyticsRequestSchedulerCreateData,
	ProphetAnalyticsRequestSchedulerUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';

export const ProphetAnalyticsRequestSchedulerRepository = {
	findAllByUserId: findAllByUserId,
	countAllByUserIdAndId: countAllByUserIdAndId,
	countAllByUserIdAndCandleUnitAndExecuteHoursAndExecuteMinutes: countAllByUserIdAndCandleUnitAndExecuteHoursAndExecuteMinutes,
	insertProphetAnalyticsRequestScheduler: insertProphetAnalyticsRequestScheduler,
	updateProphetAnalyticsRequestScheduler: updateProphetAnalyticsRequestScheduler,
	deleteByUserIdAndId: deleteByUserIdAndId
};

async function findAllByUserId(userId: number): Promise<ProphetAnalyticsRequestSchedulerEntity[]> {
	const dbConn = await connectToDB();
	const query = `
      select *
      from prophet_analytics_request_scheduler
      where true
        and deleted_at is null
        and user_id = $1
      order by id desc;`;

	try {
		const result = await dbConn.query(query, [userId]);

		return result.rows;
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsRequestSchedulerRepository.findAllByUserId', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndId(userId: number, id: number): Promise<number | undefined> {
	const dbConn = await connectToDB();
	const query = `
      select count(*)
      from prophet_analytics_request_scheduler
      where true
        and deleted_at is null
        and user_id = $1
        and id = $2
      ;`;

	try {
		const result = await dbConn.query(query, [userId, id]);

		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestSchedulerRepository.countAllByIdAndUserId',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndCandleUnitAndExecuteHoursAndExecuteMinutes(
	userId: number,
	createData: ProphetAnalyticsRequestSchedulerCreateData
): Promise<number | undefined> {
	const dbConn = await connectToDB();
	const query = `
      select count(*)
      from prophet_analytics_request_scheduler
      where true
        and deleted_at is null
        and user_id = $1
        and candle_unit = $2
        and execute_hours = $3
        and execute_minutes = $4
      ;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			createData.candleUnit,
			createData.executeHours,
			createData.executeMinutes
		]);

		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestSchedulerRepository.countAllByUserIdAndCandleUnitAndExecuteHoursAndExecuteMinutes',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function insertProphetAnalyticsRequestScheduler(
	userId: number,
	createData: ProphetAnalyticsRequestSchedulerCreateData
): Promise<ProphetAnalyticsRequestSchedulerEntity | null> {
	const dbConn = await connectToDB();
	const query = `
      insert into prophet_analytics_request_scheduler
      (user_id,
       market_currency,
       candle_unit,
       retry_yn,
       execute_hours,
       execute_minutes,
       execute_yn,
       include_exclude,
       market_list,
       price_type_list)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning *;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			createData.marketCurrency,
			createData.candleUnit,
			createData.retryYn,
			createData.executeHours,
			createData.executeMinutes,
			createData.executeYn,
			createData.includeExclude,
			createData.marketList,
			createData.priceTypeList
		]);
		return result.rows[0] as ProphetAnalyticsRequestSchedulerEntity;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestSchedulerRepository.insertProphetAnalyticsRequestScheduler',
			`${error}`
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateProphetAnalyticsRequestScheduler(
	userId: number,
	updateData: ProphetAnalyticsRequestSchedulerUpdateData
): Promise<ProphetAnalyticsRequestSchedulerEntity | null> {
	const dbConn = await connectToDB();
	const query = `
      update prophet_analytics_request_scheduler
      set market_currency = $3,
          candle_unit = $4,
					retry_yn = $5,
					execute_hours = $6,
					execute_minutes = $7,
					execute_yn = $8,
					include_exclude = $9,
					market_list = $10,
					price_type_list = $11
      where true
        and user_id = $1
        and id = $2
      returning *;`;

	try {
		const result = await dbConn.query(query, [
			userId,
			updateData.id,
			updateData.marketCurrency,
			updateData.candleUnit,
			updateData.retryYn,
			updateData.executeHours,
			updateData.executeMinutes,
			updateData.executeYn,
			updateData.includeExclude,
			updateData.marketList,
			updateData.priceTypeList
		]);
		return result.rows[0] as ProphetAnalyticsRequestSchedulerEntity;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestSchedulerRepository.updateProphetAnalyticsRequestScheduler',
			`${error}`
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function deleteByUserIdAndId(userId: number, id: number): Promise<boolean> {
	const dbConn = await connectToDB();
	const query = `
      delete
      from prophet_analytics_request_scheduler
      where true
        and user_id = $1
        and id = $2`;

	try {
		await dbConn.query(query, [userId, id]);
		return true;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestSchedulerRepository.deleteProphetAnalyticsRequestScheduler',
			`${error}`
		);
		return false;
	} finally {
		dbConn.release();
	}
}