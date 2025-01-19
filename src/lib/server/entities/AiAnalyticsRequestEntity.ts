import type { AiAnalyticsRequestData } from '$lib/common/models/AiAnalyticsRequestData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface AiAnalyticsRequestEntity {
	id: number;
	user_id: number;
	market: string;
	ai_model_id: number;
	ai_prompts_id: number;
	candle_type: string;
	candle_count: number;
	candle_time_zone: string;
	request_yn: boolean;
	result: string | null;
	result_code: string | null;
	ai_response_id: number | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export const AiAnalyticsRequestEntityUtils = {
	toAiAnalyticsRequestData: (entity: AiAnalyticsRequestEntity): AiAnalyticsRequestData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			aiModelId: entity.ai_model_id,
			aiPromptsId: entity.ai_prompts_id,
			candleType: entity.candle_type,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			requestYn: entity.request_yn,
			result: entity.result,
			resultCode: entity.result_code,
			aiResponseId: entity.ai_response_id,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	}
};
