import { test } from 'vitest';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import type { ProphetAnalyticsParameterTuningResultEntity } from '$lib/server/entities/ProphetAnalyticsParameterTuningResultEntity';
import type { ProphetAnalyticsRequestConfigEntity } from '$lib/server/entities/ProphetAnalyticsRequestConfigEntity';

test(
	'ProphetAnalyticsParameterTuningResultRepositoryTest',
	async () => {
		const userId = 1;

		const parameterTuningResultEntities: ProphetAnalyticsParameterTuningResultEntity[] =
			await findAllBy();

		if (parameterTuningResultEntities.length === 0) {
			LoggingUtils.error('ProphetAnalyticsParameterTuningResultRepositoryTest', 'No records found');
		}

		const requestConfigEntities: ProphetAnalyticsRequestConfigEntity[] =
			await findAllByUserIdAndMarketIn(
				userId,
				parameterTuningResultEntities.map((entity) => entity.market)
			);

		if (requestConfigEntities.length === 0) {
			LoggingUtils.error('ProphetAnalyticsParameterTuningResultRepositoryTest', 'No records found');
		}
		
		for (const parameterTuningResultEntity of parameterTuningResultEntities) {
			const requestConfigEntity = requestConfigEntities.find(
				(requestConfigEntity) =>
					requestConfigEntity.market === parameterTuningResultEntity.market
			);

			if (!requestConfigEntity) {
				LoggingUtils.error(
					'ProphetAnalyticsParameterTuningResultRepositoryTest',
					`No request config found for market: ${parameterTuningResultEntity.market}`
				);
				continue;
			}
			
			requestConfigEntity.changepoint_prior_scale = parameterTuningResultEntity.changepoint_prior_scale;
			requestConfigEntity.seasonality_prior_scale = parameterTuningResultEntity.seasonality_prior_scale;
			requestConfigEntity.holidays_prior_scale = parameterTuningResultEntity.holidays_prior_scale;
			requestConfigEntity.seasonality_mode = parameterTuningResultEntity.seasonality_mode;
			requestConfigEntity.holidays_mode = parameterTuningResultEntity.holidays_mode;
			
			await updateProphetAnalyticsRequestConfig(requestConfigEntity);
		}
	},
	{
		timeout: 1000 * 60 * 60
	}
);

async function findAllBy() {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_parameter_tuning_result
      WHERE true
	`;

	try {
		const result = await dbConn.query(query);
		return result.rows as ProphetAnalyticsParameterTuningResultEntity[];
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsParameterTuningResultRepositoryTest', `${error}`);

		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndMarketIn(
	userId: number,
	markets: string[]
): Promise<ProphetAnalyticsRequestConfigEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_request_config
      WHERE user_id = $1
        AND deleted_at IS NULL
        AND market = ANY ($2)
	`;

	try {
		const result = await dbConn.query(query, [userId, markets]);
		return result.rows as ProphetAnalyticsRequestConfigEntity[];
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsParameterTuningResultRepositoryTest', `${error}`);

		return [];
	} finally {
		dbConn.release();
	}
}

async function updateProphetAnalyticsRequestConfig(
	requestConfigEntity: ProphetAnalyticsRequestConfigEntity
): Promise<ProphetAnalyticsRequestConfigEntity | null> {
	const dbConn = await connectToDB();

	const query = `
			UPDATE prophet_analytics_request_config
			SET changepoint_prior_scale = $1,
					seasonality_prior_scale = $2,
					holidays_prior_scale = $3,
					seasonality_mode = $4,
					holidays_mode = $5
			WHERE id = $6
			RETURNING *;
	`;

	try {
		const result = await dbConn.query(query, [
			requestConfigEntity.changepoint_prior_scale,
			requestConfigEntity.seasonality_prior_scale,
			requestConfigEntity.holidays_prior_scale,
			requestConfigEntity.seasonality_mode,
			requestConfigEntity.holidays_mode,
			requestConfigEntity.id
		]);
		return result.rows[0] as ProphetAnalyticsRequestConfigEntity;
	} catch (error) {
		LoggingUtils.error('ProphetAnalyticsParameterTuningResultRepositoryTest', `${error}`);

		return null;
	} finally {
		dbConn.release();
	}
}
