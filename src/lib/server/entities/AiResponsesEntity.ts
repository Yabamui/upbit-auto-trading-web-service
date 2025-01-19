import type {
	AiResponsesData,
	AiResponsesTodayInferenceData
} from '$lib/common/models/AiResponsesData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import type { AiModelEntity } from '$lib/server/entities/AiModelEntity';

export interface AiResponsesEntity {
	id: number;
	user_id: number;
	market: string;
	ai_model_id: number;
	ai_prompts_id: number;
	ai_response_models_id: number | null;
	response: object;
	candle_type: string;
	candle_count: number;
	candle_time_zone: string
	candle_date_time_kst_begin: string;
	candle_date_time_kst_end: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export interface AiResponseTodayInferenceEntity {
	market: string;
	korean_name: string;
	created_at: Date;
	candle_type: string;
	date: string;
	time: string;
	judgement_basis_kr: string;
	evaluation: string;
	open_price: number;
	close_price: number;
	high_price: number;
	low_price: number;
}

export const AiResponsesEntityUtils = {
	toAiResponsesData: (entity: AiResponsesEntity, aiModelEntity: AiModelEntity): AiResponsesData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			aiModelId: entity.ai_model_id,
			aiPromptsId: entity.ai_prompts_id,
			aiResponseModesId: entity.ai_response_models_id,
			response: entity.response,
			candleType: entity.candle_type,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			candleDateTimeKstBegin: entity.candle_date_time_kst_begin,
			candleDateTimeKstEnd: entity.candle_date_time_kst_end,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at),

			aiCode: aiModelEntity.ai_code,
			aiName: aiModelEntity.ai_name,
			aiModelCode: aiModelEntity.model_code,
			aiModelName: aiModelEntity.model_name
		};
	},

	toAiResponseTodayInferenceData: (entity: AiResponseTodayInferenceEntity): AiResponsesTodayInferenceData => {
		return {
			market: entity.market,
			koreanName: entity.korean_name,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			candleType: entity.candle_type,
			date: entity.date,
			time: entity.time,
			judgementBasisKr: entity.judgement_basis_kr,
			evaluation: entity.evaluation,
			openPrice: entity.open_price,
			closePrice: entity.close_price,
			highPrice: entity.high_price,
			lowPrice: entity.low_price
		};
	}
};
