import type { AiPromptsData } from '$lib/common/models/AiPromptsData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface AiPromptsEntity {
	id: number;
	user_id: number;
	ai_model_id: number;
	title: string;
	system_prompts_array: string[];
	user_prompts_array: string[];
	default_yn: boolean;
	ai_response_models_id: number | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export const AiPromptsEntityUtils = {
	toAiPromptsData: (entity: AiPromptsEntity): AiPromptsData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			aiModelId: entity.ai_model_id,
			title: entity.title,
			systemPromptsList: entity.system_prompts_array,
			userPromptsList: entity.user_prompts_array,
			defaultYn: entity.default_yn,
			aiResponseModelsId: entity.ai_response_models_id,
			createdAt: CurrentDateUtils.toKSTFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toKSTFormatStringByDate(entity.deleted_at)
		};
	}
};
