export interface ProphetAnalyticsRequestEntity {
	id: number
	user_id: number
	market: string
	candle_type: string
	candle_time_zone: string
	begin_candle_date_time: Date | null
	end_candle_date_time: Date | null
	
	growth: string
	export_period: number
	cap: number | null
	floor: number | null
	
	changepoint_list: string[] | null
	changepoint_number: number | null
	changepoint_range: number | null
	
	holidays_country: string
	holidays_list: string[] | null
	holidays_prior_scale: number
	holidays_mode: string | null
	
	seasonality_mode: string
	seasonality_prior_scale: number
	yearly_seasonality: string
	weekly_seasonality: string
	daily_seasonality: string
	monthly_seasonality: number | null
	
	mcmc_samples: number
	interval_width: number
	uncertainty_samples: number
	stan_backend: string | null
	scaling: string
	
	request_yn: boolean
	result_code: string | null
	result_message: string | null
	
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}