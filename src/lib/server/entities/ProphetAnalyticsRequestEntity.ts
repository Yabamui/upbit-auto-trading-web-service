import type { ProphetAnalyticsRequestData } from '$lib/common/models/ProphetAnalyticsRequestData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import type { ProphetAnalyticsCustomSeasonalityData } from '$lib/common/models/ProphetAnalyticsRequestConfigData';

export interface ProphetAnalyticsRequestEntity {
	id: number;
	user_id: number;
	market: string;
	candle_unit: string;
	candle_time_zone: string;
	begin_candle_date_time: Date | undefined;
	end_candle_date_time: Date | undefined;

	growth: string;
	export_period: number;
	cap: number | undefined;
	floor: number | undefined;

	changepoint_list: string[] | undefined;
	changepoint_prior_scale: number;
	changepoint_number: number | undefined;
	changepoint_range: number | undefined;

	holidays_country: string;
	holidays_list: string[] | undefined;
	holidays_prior_scale: number;
	holidays_mode: string | undefined;

	seasonality_mode: string;
	seasonality_prior_scale: number;
	yearly_seasonality: string;
	weekly_seasonality: string;
	daily_seasonality: string;
	custom_seasonality_list: string[] | undefined;

	mcmc_samples: number;
	interval_width: number;
	uncertainty_samples: number;
	stan_backend: string | undefined;
	scaling: string;

	request_yn: boolean;
	result_code: string | undefined;
	result_message: string | undefined;
	
	scheduler_id: number | undefined;
	execute_date_time: string | undefined;

	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}

export const ProphetAnalyticsRequestEntityUtils = {
	toProphetAnalyticsRequestData: (
		entity: ProphetAnalyticsRequestEntity
	): ProphetAnalyticsRequestData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			candleUnit: entity.candle_unit,
			candleTimeZone: entity.candle_time_zone,
			beginCandleDateTime: entity.begin_candle_date_time,
			endCandleDateTime: entity.end_candle_date_time,

			growth: entity.growth,
			exportPeriod: entity.export_period,
			cap: entity.cap,
			floor: entity.floor,

			changepointList: entity.changepoint_list,
			changepointPriorScale: entity.changepoint_prior_scale,
			changepointNumber: entity.changepoint_number,
			changepointRange: entity.changepoint_range,

			holidaysCountry: entity.holidays_country,
			holidaysList: entity.holidays_list,
			holidaysPriorScale: entity.holidays_prior_scale,
			holidaysMode: entity.holidays_mode,

			seasonalityMode: entity.seasonality_mode,
			seasonalityPriorScale: entity.seasonality_prior_scale,
			yearlySeasonality: entity.yearly_seasonality,
			weeklySeasonality: entity.weekly_seasonality,
			dailySeasonality: entity.daily_seasonality,
			customSeasonalityList: entity.custom_seasonality_list
				? entity.custom_seasonality_list.map(
						(customSeasonality: string): ProphetAnalyticsCustomSeasonalityData =>
							JSON.parse(customSeasonality) as ProphetAnalyticsCustomSeasonalityData
					)
				: undefined,

			mcmcSamples: entity.mcmc_samples,
			intervalWidth: entity.interval_width,
			uncertaintySamples: entity.uncertainty_samples,
			stanBackend: entity.stan_backend,
			scaling: entity.scaling,

			requestYn: entity.request_yn,
			resultCode: entity.result_code,
			resultMessage: entity.result_message,
			
			schedulerId: entity.scheduler_id,
			executeDateTime: entity.execute_date_time,

			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	}
};
