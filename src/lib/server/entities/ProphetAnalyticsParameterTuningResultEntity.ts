export interface ProphetAnalyticsParameterTuningResultEntity {
	id: number;
	market: string;
	candle_unit: number;
	candle_time_zone: string;
	price_type: string;
	changepoint_prior_scale: number;
	seasonality_prior_scale: number;
	holidays_prior_scale: number;
	seasonality_mode: string;
	holidays_mode: string;
	created_at: Date;
	updated_at: Date;
}