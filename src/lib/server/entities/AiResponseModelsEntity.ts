import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import type { AiResponseModelsData } from '$lib/common/models/AiResponseModelsData';

export interface AiResponseModelsEntity {
	id: number;
	ai_model_id: number;
	title: string;
	response_model_json: object;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export const AiResponseModelsEntityUtils = {
	toAiResponseModelData: (entity: AiResponseModelsEntity): AiResponseModelsData => {
		return {
			id: entity.id,
			aiModelId: entity.ai_model_id,
			title: entity.title,
			responseModelJson: entity.response_model_json,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	}
};
