import type { AiLatestInferenceData, AiResponsesData } from '$lib/common/models/AiResponsesData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import moment from 'moment/moment';
import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';

export interface AiResponsesEntity {
	id: number;
	user_id: number;
	market: string;
	ai_model_id: number;
	ai_prompts_id: number;
	ai_response_models_id: number | null;
	response: object;
	candle_unit: string;
	candle_count: number;
	candle_time_zone: string;
	candle_date_time_begin: string;
	candle_date_time_end: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export interface AiLatestInferenceEntity {
	id: number;
	user_id: number;
	market: string;
	ai_model_id: number;
	ai_prompts_id: number;
	ai_response_models_id: number;
	candle_unit: string;
	candle_count: number;
	candle_time_zone: string;
	candle_date_time_begin: string;
	candle_date_time_end: string;
	created_at: Date;
	updated_at: Date;
	total_judgement: string;
	total_judgement_kr: string;
	date: string;
	time: string;
	low_price: number;
	high_price: number;
	open_price: number;
	close_price: number;
	evaluation: string;
	judgement_basis: string;
	judgement_basis_kr: string;
}

export const AiResponsesEntityUtils = {
	toAiResponsesData: (entity: AiResponsesEntity): AiResponsesData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			aiModelId: entity.ai_model_id,
			aiPromptsId: entity.ai_prompts_id,
			aiResponseModesId: entity.ai_response_models_id,
			response: entity.response,
			candleUnit: entity.candle_unit,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			candleDateTimeBegin: entity.candle_date_time_begin,
			candleDateTimeEnd: entity.candle_date_time_end,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	},
	toAiLatestInferenceData: (
		entity: AiLatestInferenceEntity,
		judgementYn: boolean
	): AiLatestInferenceData => {
		const dateTime: string = CurrentDateUtils.getDateTimeStringAndSetTime(
			entity.date,
			entity.time,
			entity.candle_unit
		);

		return {
			id: entity.id,
			userId: entity.user_id,
			market: entity.market,
			aiModelId: entity.ai_model_id,
			aiPromptsId: entity.ai_prompts_id,
			aiResponseModesId: entity.ai_response_models_id,
			candleUnit: entity.candle_unit,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			candleDateTimeBegin: entity.candle_date_time_begin,
			candleDateTimeEnd: entity.candle_date_time_end,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			totalJudgement: judgementYn ? entity.total_judgement : '',
			totalJudgementKr: judgementYn ? entity.total_judgement_kr : '',
			dateTime: dateTime,
			lowPrice: entity.low_price,
			highPrice: entity.high_price,
			openPrice: entity.open_price,
			closePrice: entity.close_price,
			evaluation: entity.evaluation,
			judgementBasis: judgementYn ? entity.judgement_basis : '',
			judgementBasisKr: judgementYn ? entity.judgement_basis_kr : ''
		};
	}
};
