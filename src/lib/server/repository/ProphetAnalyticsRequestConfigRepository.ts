import { connectToDB } from '$lib/server/config/PGConfig';
import type { ProphetAnalyticsRequestConfigEntity } from '$lib/server/entities/ProphetAnalyticsRequestConfigEntity';
import type {
	ProphetAnalyticsRequestConfigCreateData,
	ProphetAnalyticsRequestConfigUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const ProphetAnalyticsRequestConfigRepository = {
	findTopByUserIdAndMarket: findTopByUserIdAndMarket,
	findAllByUserIdAndMarket: findAllByUserIdAndMarket,
	findAllMarketByUserIdAndMarketInAndCandleUnit: findAllMarketByUserIdAndMarketInAndCandleUnit,
	countAllByUserIdAndMarketAndCandleUnit: countAllByUserIdAndMarketAndCandleUnit,
	insertProphetAnalyticsRequestConfig: insertProphetAnalyticsRequestConfig,
	updateProphetAnalyticsRequestConfig: updateProphetAnalyticsRequestConfig
};

async function findTopByUserIdAndMarket(
	userId: number,
	market: string,
	configId: number
): Promise<ProphetAnalyticsRequestConfigEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_request_config
      WHERE TRUE
        AND deleted_at IS NULL
        AND user_id = $1
        AND market = $2
        AND id = $3
      ORDER BY id DESC
      LIMIT 1
	`;

	try {
		const result = await dbConn.query(query, [userId, market, configId]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.findTopByUserIdAndMarket',
			`${error}`
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndMarket(
	userId: number,
	market: string
): Promise<ProphetAnalyticsRequestConfigEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_request_config
      WHERE TRUE
        AND deleted_at IS NULL
        AND user_id = $1
        AND market = $2
      ORDER BY id DESC
	`;

	try {
		const result = await dbConn.query(query, [userId, market]);

		return result.rows;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.findAllByUserIdAndMarket',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllMarketByUserIdAndMarketInAndCandleUnit(
	userId: number,
	marketList: string[],
	candleUnit: string
): Promise<string[] | undefined> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_request_config
      WHERE TRUE
        AND deleted_at IS NULL
        AND user_id = $1
        AND market = ANY ($2)
        AND candle_unit = $3
      ORDER BY id DESC
	`;

	try {
		const result = await dbConn.query(query, [userId, marketList, candleUnit]);

		return result.rows.map((row) => row.market);
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.findAllByUserIdAndMarketInAndCandleUnit',
			`${error}`
		);
		return undefined;
	} finally {
		dbConn.release();
	}
}

async function countAllByUserIdAndMarketAndCandleUnit(
	userId: number,
	market: string,
	candleUnit: string
): Promise<number | undefined> {
	const dbConn = await connectToDB();

	const query = `
      SELECT COUNT(*)
      FROM prophet_analytics_request_config
      WHERE TRUE
        AND deleted_at IS NULL
        AND user_id = $1
        AND market = $2
        AND candle_unit = $3
	`;

	try {
		const result = await dbConn.query(query, [userId, market, candleUnit]);

		return result.rows[0].count;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.countAllByUserIdAndMarketAndCandleUnit',
			`${error}`
		);

		return undefined;
	} finally {
		dbConn.release();
	}
}

async function insertProphetAnalyticsRequestConfig(
	userId: number,
	createData: ProphetAnalyticsRequestConfigCreateData
): Promise<ProphetAnalyticsRequestConfigEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      insert into prophet_analytics_request_config
      (user_id,
       market,
       candle_unit,
       candle_time_zone,
       begin_candle_date_time,
       end_candle_date_time,
       growth,
       export_period,
       cap,
       floor,
       changepoint_list,
       changepoint_prior_scale,
       changepoint_number,
       changepoint_range,
       holidays_country,
       holidays_list,
       holidays_prior_scale,
       holidays_mode,
       seasonality_mode,
       seasonality_prior_scale,
       yearly_seasonality,
       weekly_seasonality,
       daily_seasonality,
       custom_seasonality_list,
       mcmc_samples,
       interval_width,
       uncertainty_samples,
       stan_backend,
       scaling)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19,
              $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      returning *`;

	try {
		const result = await dbConn.query(query, [
			userId,
			createData.market,
			createData.candleUnit,
			createData.candleTimeZone,
			createData.beginCandleDateTime,
			createData.endCandleDateTime,
			
			createData.growth,
			createData.exportPeriod,
			createData.cap,
			createData.floor,
			
			createData.changepointList,
			createData.changepointPriorScale,
			createData.changepointNumber,
			createData.changepointRange,
			
			createData.holidaysCountry,
			createData.holidaysList,
			createData.holidaysPriorScale,
			createData.holidaysMode,
			
			createData.seasonalityMode,
			createData.seasonalityPriorScale,
			createData.yearlySeasonality,
			createData.weeklySeasonality,
			createData.dailySeasonality,
			createData.customSeasonalityList,
			
			createData.mcmcSamples,
			createData.intervalWidth,
			createData.uncertaintySamples,
			createData.stanBackend,
			createData.scaling
		]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.insertProphetAnalyticsRequestConfig',
			`${error}`
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function updateProphetAnalyticsRequestConfig(
	updateData: ProphetAnalyticsRequestConfigUpdateData
): Promise<ProphetAnalyticsRequestConfigEntity | null> {
	const dbConn = await connectToDB();

	const query = `
      update prophet_analytics_request_config
      set candle_unit             = $2,
          candle_time_zone        = $3,
          begin_candle_date_time  = $4,
          end_candle_date_time    = $5,
          
          growth                  = $6,
          export_period           = $7,
          cap                     = $8,
          floor                   = $9,
          
          changepoint_list        = $10,
          changepoint_prior_scale = $11,
          changepoint_number      = $12,
          changepoint_range       = $13,
          
          holidays_country        = $14,
          holidays_list           = $15,
          holidays_prior_scale    = $16,
          holidays_mode           = $17,
          
          seasonality_mode        = $18,
          seasonality_prior_scale = $19,
          yearly_seasonality      = $20,
          weekly_seasonality      = $21,
          daily_seasonality       = $22,
          custom_seasonality_list = $23,
          
          mcmc_samples            = $24,
          interval_width          = $25,
          uncertainty_samples     = $26,
          stan_backend            = $27,
          scaling                 = $28
      where id = $1
      returning *`;

	try {
		const result = await dbConn.query(query, [
			updateData.id,
			updateData.candleUnit,
			updateData.candleTimeZone,
			updateData.beginCandleDateTime,
			updateData.endCandleDateTime,
			updateData.growth,
			updateData.exportPeriod,
			updateData.cap,
			updateData.floor,
			updateData.changepointList,
			updateData.changepointPriorScale,
			updateData.changepointNumber,
			updateData.changepointRange,
			updateData.holidaysCountry,
			updateData.holidaysList,
			updateData.holidaysPriorScale,
			updateData.holidaysMode,
			updateData.seasonalityMode,
			updateData.seasonalityPriorScale,
			updateData.yearlySeasonality,
			updateData.weeklySeasonality,
			updateData.dailySeasonality,
			updateData.customSeasonalityList,
			updateData.mcmcSamples,
			updateData.intervalWidth,
			updateData.uncertaintySamples,
			updateData.stanBackend,
			updateData.scaling
		]);

		return result.rows[0];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsRequestConfigRepository.updateProphetAnalyticsRequestConfig',
			`${error}`
		);

		return null;
	} finally {
		dbConn.release();
	}
}
