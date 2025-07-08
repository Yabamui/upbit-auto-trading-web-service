export interface ProphetAnalyticsResultEntity {
	id: number
	user_id: number
	market: string
	candle_type: string
	candle_count: number
	candle_time_zone: string
	begin_candle_date_time: Date
	end_candle_date_time: Date
	
	changepoint_date_time: string[] | null
	
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}