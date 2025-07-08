import type { AiAnalyticsRequestSchedulerData } from '$lib/common/models/AiAnalyticsRequestSchedulerData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface AiAnalyticsRequestSchedulerEntity {
	id: number;
	user_id: number;
	ai_model_id: number;
	market_currency: string;
	candle_unit: string;
	candle_count: number;
	candle_time_zone: string;
	retry_yn: boolean;
	execute_hours: number;
	execute_minutes: number;
	execute_yn: boolean;
	include_exclude: string | undefined;
	market_list: string[] | undefined;
	ai_prompts_id: number;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}

export const AiAnalyticsRequestSchedulerEntityUtils = {
	toAiAnalyticsRequestSchedulerData: (entity: AiAnalyticsRequestSchedulerEntity): AiAnalyticsRequestSchedulerData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			aiModelId: entity.ai_model_id,
			marketCurrency: entity.market_currency,
			candleUnit: entity.candle_unit,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			retryYn: entity.retry_yn,
			executeHours: entity.execute_hours,
			executeMinutes: entity.execute_minutes,
			executeYn: entity.execute_yn,
			includeExclude: entity.include_exclude,
			marketList: entity.market_list,
			aiPromptsId: entity.ai_prompts_id,
			createdAt: CurrentDateUtils.toKSTFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.deleted_at)
		};
	},
};