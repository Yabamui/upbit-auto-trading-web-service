import type { AiModelData } from '$lib/common/models/AiModelData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface AiModelEntity {
	id: number;
	ai_code: string;
	ai_name: string;
	model_code: string;
	model_name: string;
	model_description: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export const AiModelEntityUtils = {
	toAiModelData: (entity: AiModelEntity): AiModelData => {
		return {
			id: entity.id,
			aiCode: entity.ai_code,
			aiName: entity.ai_name,
			modelCode: entity.model_code,
			modelName: entity.model_name,
			modelDescription: entity.model_description,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	}
};
