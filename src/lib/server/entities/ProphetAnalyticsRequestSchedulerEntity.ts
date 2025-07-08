import type { ProphetAnalyticsRequestSchedulerData } from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface ProphetAnalyticsRequestSchedulerEntity {
	id: number;
	user_id: number;
	market_currency: string;
	candle_unit: string;
	retry_yn: boolean;
	execute_hours: number;
	execute_minutes: number;
	execute_yn: boolean;

	include_exclude: string;
	market_list: string[] | undefined;
	price_type_list: string[] | undefined;

	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}

export const ProphetAnalyticsRequestSchedulerEntityUtils = {
	toProphetAnalyticsRequestSchedulerData: (
		entity: ProphetAnalyticsRequestSchedulerEntity
	): ProphetAnalyticsRequestSchedulerData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			marketCurrency: entity.market_currency,
			candleUnit: entity.candle_unit,
			retryYn: entity.retry_yn,
			executeHours: entity.execute_hours,
			executeMinutes: entity.execute_minutes,
			executeYn: entity.execute_yn,
			includeExclude: entity.include_exclude,
			marketList: entity.market_list,
			priceTypeList: entity.price_type_list,
			createdAt: CurrentDateUtils.toKSTFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.deleted_at)
		};
	},
}