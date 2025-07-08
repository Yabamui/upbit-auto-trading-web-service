export interface ProphetAnalyticsResultItemData {
	id: number
	userId: number
	market: string
	resultId: number
	priceType: string
	
	ds: string
	y: number
	
	trend: number
	trendLower: number
	trendUpper: number
	
	yhat: number
	yhatLower: number
	yhatUpper: number
	
	additiveTerms: number
	additiveTermsLower: number
	additiveTermsUpper: number
	
	multiplicativeTerms: number
	multiplicativeTermsLower: number
	multiplicativeTermsUpper: number
	
	yearly: number | undefined
	yearlyLower: number | undefined
	yearlyUpper: number | undefined
	
	weekly: number | undefined
	weeklyLower: number | undefined
	weeklyUpper: number | undefined
	
	monthly: number | undefined
	monthlyLower: number | undefined
	monthlyUpper: number | undefined
	
	daily: number | undefined
	dailyLower: number | undefined
	dailyUpper: number | undefined
	
	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}