import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface ProphetAnalyticsResultItemEntity {
	id: number
	user_id: number
	market: string
	result_id: number
	price_type: string
	
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
	
	yearly: number | undefined
	yearly_lower: number | undefined
	yearly_upper: number | undefined
	
	weekly: number | undefined
	weekly_lower: number | undefined
	weekly_upper: number | undefined
	
	monthly: number | undefined
	monthly_lower: number | undefined
	monthly_upper: number | undefined
	
	daily: number | undefined
	daily_lower: number | undefined
	daily_upper: number | undefined
	
	
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}

export const ProphetAnalyticsResultItemEntityUtils = {
	toProphetAnalyticsResultItemData: (entity: ProphetAnalyticsResultItemEntity): ProphetAnalyticsResultItemData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			resultId: entity.result_id,
			priceType: entity.price_type,
			ds: CurrentDateUtils.toFormatStringByDate(entity.ds),
			y: entity.y,
			
			trend: entity.trend,
			trendLower: entity.trend_lower,
			trendUpper: entity.trend_upper,
			
			yhat: entity.yhat,
			yhatLower: entity.yhat_lower,
			yhatUpper: entity.yhat_upper,
			
			additiveTerms: entity.additive_terms,
			additiveTermsLower: entity.additive_terms_lower,
			additiveTermsUpper: entity.additive_terms_upper,
			
			multiplicativeTerms: entity.multiplicative_terms,
			multiplicativeTermsLower: entity.multiplicative_terms_lower,
			multiplicativeTermsUpper: entity.multiplicative_terms_upper,
			
			yearly: entity.yearly,
			yearlyLower: entity.yearly_lower,
			yearlyUpper: entity.yearly_upper,
			
			weekly: entity.weekly,
			weeklyLower: entity.weekly_lower,
			weeklyUpper: entity.weekly_upper,
			
			monthly: entity.monthly,
			monthlyLower: entity.monthly_lower,
			monthlyUpper: entity.monthly_upper,
			
			daily: entity.daily,
			dailyLower: entity.daily_lower,
			dailyUpper: entity.daily_upper,
			
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at),
		};
	},
}