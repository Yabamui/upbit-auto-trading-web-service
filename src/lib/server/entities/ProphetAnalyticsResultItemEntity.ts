export interface ProphetAnalyticsResultItemEntity {
	id: number
	user_id: number
	market: string
	prophet_analytics_result_id: number
	
	ds: Date
	y: number
	
	trend: number
	trend_lower: number
	trend_upper: number
	
	yhat: number
	yhat_lower: number
	yhat_upper: number
	
	additive_terms: number
	additive_terms_lower: number
	additive_terms_upper: number
	
	multiplicative_terms: number
	multiplicative_terms_lower: number
	multiplicative_terms_upper: number
	
	yearly: number | null
	yearly_lower: number | null
	yearly_upper: number | null
	
	weekly: number | null
	weekly_lower: number | null
	weekly_upper: number | null
	
	monthly: number | null
	monthly_lower: number | null
	monthly_upper: number | null
	
	daily: number | null
	daily_lower: number | null
	daily_upper: number | null
	
	
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}