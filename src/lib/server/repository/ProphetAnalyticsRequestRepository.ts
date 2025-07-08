import { connectToDB } from '$lib/server/config/PGConfig';
import type { ProphetAnalyticsRequestEntity } from '$lib/server/entities/ProphetAnalyticsRequestEntity';
import type { ProphetAnalyticsRequestConfigEntity } from '$lib/server/entities/ProphetAnalyticsRequestConfigEntity';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const ProphetAnalyticsRequestRepository = {
	findAllByUserIdAndMarket: findAllByUserIdAndMarket,
	countAllByUserIdAndRequestIdIn: countAllByUserIdAndRequestIdIn,
	insertProphetAnalyticsRequest: insertProphetAnalyticsRequest,
	deleteProphetAnalyticsRequest: deleteProphetAnalyticsRequest
};

async function findAllByUserIdAndMarket(
	userId: number,
	market: string
): Promise<ProphetAnalyticsRequestEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `
      SELECT *
      FROM prophet_analytics_request
      WHERE user_id = $1
        AND market = $2
      ORDER BY id DESC
	`;

	try {
		const result = await dbConn.query(query, [userId, market]);
		return result.rows;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestRepository.findAllByUserIdAndMarket',
			`Error: ${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndRequestIdIn(
	userId: number,
	requestIdList: number[]
): Promise<number> {
	const dbConn = await connectToDB();

	const query = `
      SELECT COUNT(*) AS count
      FROM prophet_analytics_request
      WHERE true
        AND deleted_at IS NULL
        AND request_yn = TRUE
        AND user_id = $1
        AND id = ANY ($2)
	`;

	try {
		const result = await dbConn.query(query, [userId, requestIdList]);
		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestRepository.existsAllByUserIdAndRequestIdIn',
			`Error: ${error}`
		);
		return 0;
	} finally {
		dbConn.release();
	}
}

async function insertProphetAnalyticsRequest(
	userId: number,
	requestConfigEntity: ProphetAnalyticsRequestConfigEntity,
	priceTypeList: string[]
): Promise<ProphetAnalyticsRequestEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      INSERT INTO prophet_analytics_request
      (user_id, market, candle_unit, candle_time_zone, begin_candle_date_time, end_candle_date_time, growth,
       export_period, cap, floor, changepoint_list, changepoint_prior_scale, changepoint_number, changepoint_range,
       holidays_country, holidays_list, holidays_prior_scale, holidays_mode, seasonality_mode, seasonality_prior_scale,
       yearly_seasonality, weekly_seasonality, daily_seasonality, custom_seasonality_list, mcmc_samples, interval_width,
       uncertainty_samples, stan_backend, scaling, request_yn, price_type_list)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
              $23, $24, $25, $26, $27, $28, $29, $30, $31)
      RETURNING *
	`;

	try {
		const result = await dbConn.query(query, [
			userId,
			requestConfigEntity.market,
			requestConfigEntity.candle_unit,
			requestConfigEntity.candle_time_zone,
			requestConfigEntity.begin_candle_date_time,
			requestConfigEntity.end_candle_date_time,
			requestConfigEntity.growth,
			requestConfigEntity.export_period,
			requestConfigEntity.cap,
			requestConfigEntity.floor,
			requestConfigEntity.changepoint_list,
			requestConfigEntity.changepoint_prior_scale,
			requestConfigEntity.changepoint_number,
			requestConfigEntity.changepoint_range,
			requestConfigEntity.holidays_country,
			requestConfigEntity.holidays_list,
			requestConfigEntity.holidays_prior_scale,
			requestConfigEntity.holidays_mode,
			requestConfigEntity.seasonality_mode,
			requestConfigEntity.seasonality_prior_scale,
			requestConfigEntity.yearly_seasonality,
			requestConfigEntity.weekly_seasonality,
			requestConfigEntity.daily_seasonality,
			requestConfigEntity.custom_seasonality_list,
			requestConfigEntity.mcmc_samples,
			requestConfigEntity.interval_width,
			requestConfigEntity.uncertainty_samples,
			requestConfigEntity.stan_backend,
			requestConfigEntity.scaling,
			false,
			priceTypeList
		]);
		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestRepository.insertProphetAnalyticsRequest',
			`Error: ${error}`
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function deleteProphetAnalyticsRequest(
	userId: number,
	requestId: number
): Promise<boolean> {
	const dbConn = await connectToDB();

	const query = `
      DELETE
      FROM prophet_analytics_request
      WHERE user_id = $1
        AND id = $2
	`;

	try {
		await dbConn.query(query, [userId, requestId]);
		return true;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestRepository.deleteProphetAnalyticsRequest',
			`Error: ${error}`
		);
		return false;
	} finally {
		dbConn.release();
	}
}
