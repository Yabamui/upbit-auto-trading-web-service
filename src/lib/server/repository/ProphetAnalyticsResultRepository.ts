import { connectToDB } from '$lib/server/config/PGConfig';
import type { ProphetAnalyticsResultEntity } from '$lib/server/entities/ProphetAnalyticsResultEntity';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const ProphetAnalyticsResultRepository = {
	findTopByUserIdAndId: findTopByUserIdAndId,
	findAllByUserIdAndRequestId: findAllByUserIdAndRequestId,
	findAllByUserIdAndCandleUnitAndCandleTimeZoneAndRowNumber:
		findAllByUserIdAndCandleUnitAndCandleTimeZoneAndRowNumber,
	findTopByUserIdAndMarketOrderByIdDesc: findTopByUserIdAndMarketOrderByIdDesc,
	deleteAllByUserIdAndRequestId: deleteAllByUserIdAndRequestId
};

async function findTopByUserIdAndId(
	userId: number,
	resultId: number
): Promise<ProphetAnalyticsResultEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_result
      WHERE true
        and deleted_at is null
        and user_id = $1
        AND id = $2
      ORDER BY id DESC
      LIMIT 1
	`;

	try {
		const result = await dbConn.query(query, [userId, resultId]);
		return result.rows[0] as ProphetAnalyticsResultEntity;
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsResultRepository.findTopByUserIdAndId', `${error}`);

		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndRequestId(
	userId: number,
	requestId: number
): Promise<ProphetAnalyticsResultEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_result
      WHERE true
        and deleted_at is null
        and user_id = $1
        AND request_id = $2
	`;

	try {
		const result = await dbConn.query(query, [userId, requestId]);
		return result.rows as ProphetAnalyticsResultEntity[];
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsResultRepository.findTopByUserIdAndRequestId', `${error}`);

		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndCandleUnitAndCandleTimeZoneAndRowNumber(
	userId: number,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string
): Promise<ProphetAnalyticsResultEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      WITH summary AS (SELECT *,
                              ROW_NUMBER() OVER (partition by market order by id desc) AS row_number
                       FROM prophet_analytics_result
                       WHERE true
                         AND deleted_at IS NULL
                         AND user_id = $1
                         AND market like $2
                         AND candle_unit = $3
                         AND candle_time_zone = $4
                         AND price_type = $5)
      SELECT *
      FROM summary
      WHERE row_number = 1
	`;

	try {
		const result = await dbConn.query(query, [
			userId,
			`${market}%`,
			candleUnit,
			candleTimeZone,
			priceType
		]);

		return result.rows as ProphetAnalyticsResultEntity[];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultRepository.findAllByUserIdAndCandleUnitAndCandleTimeZoneAndRowNumber',
			`${error}`
		);

		return [];
	} finally {
		dbConn.release();
	}
}

async function findTopByUserIdAndMarketOrderByIdDesc(
	userId: number,
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string
): Promise<ProphetAnalyticsResultEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_result
      WHERE true
        and deleted_at is null
        and user_id = $1
        AND market = $2
        and candle_unit = $3
        and candle_time_zone = $4
        and price_type = $5
      ORDER BY id DESC
      LIMIT 1
	`;

	try {
		const result = await dbConn.query(query, [
			userId,
			market,
			candleUnit,
			candleTimeZone,
			priceType
		]);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0] as ProphetAnalyticsResultEntity;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultRepository.findTopByUserIdAndMarketOrderByUpdatedAtDesc',
			`${error}`
		);

		return null;
	} finally {
		dbConn.release();
	}
}

async function deleteAllByUserIdAndRequestId(userId: number, requestId: number): Promise<boolean> {
	const dbConn = await connectToDB();

	const query = `
      Delete
      from prophet_analytics_result
      WHERE true
        AND user_id = $1
        AND request_id = $2
	`;
	
	try {
		await dbConn.query(query, [userId, requestId]);
		return true;
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsResultRepository.deleteProphetAnalyticsResult', `${error}`);
		return false;
	} finally {
		dbConn.release();
	}
}
