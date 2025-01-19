export interface AnalyticsRequestMarket {
	id: number;
	user_id: number;
	market: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}
