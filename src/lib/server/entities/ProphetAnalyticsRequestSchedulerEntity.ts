export interface ProphetAnalyticsSchedulerEntity {
	id: number;
	user_id: number;
	candle_type: string;
	retry_yn: boolean;
	execute_hours: number;
	execute_minutes: number;
	execute_yn: boolean;

	include_market_list: string[] | undefined;
	exclude_market_list: string[] | undefined;

	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}
