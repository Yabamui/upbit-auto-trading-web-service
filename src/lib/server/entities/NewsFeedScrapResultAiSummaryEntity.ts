import type { NewsFeedScrapResultAiSummaryData } from '$lib/common/models/NewsFeedScrapResultData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface NewsFeedScrapResultAiSummaryEntity {
	id: number;
	result_id: number;
	model_name: string;
	result_code: string;
	result_message: string;
	source_category: string | null;
	primary_cryptocurrency: string | null;
	other_mentioned_cryptocurrencies: string[] | null;
	core_event_summary: string | null;
	sentiment_towards_primary_cryptocurrency: string | null;
	sentiment_towards_overall_market: string | null;
	potential_impact_level: string | null;
	key_entities_mentioned: string[] | null;
	relevance_to_price_prediction: string | null;
	created_at: Date;
	updated_at: Date;
}

export const NewsFeedScrapResultAiSummaryEntityUtils = {
	toNewsFeedScrapResultAiSummaryData: (entity: NewsFeedScrapResultAiSummaryEntity) => {
		return {
			id: entity.id,
			resultId: entity.result_id,
			modelName: entity.model_name,
			resultCode: entity.result_code,
			resultMessage: entity.result_message,
			sourceCategory: entity.source_category,
			primaryCryptocurrency: entity.primary_cryptocurrency,
			otherMentionedCryptocurrencies: entity.other_mentioned_cryptocurrencies,
			coreEventSummary: entity.core_event_summary,
			sentimentTowardsPrimaryCryptocurrency: entity.sentiment_towards_primary_cryptocurrency,
			sentimentTowardsOverallMarket: entity.sentiment_towards_overall_market,
			potentialImpactLevel: entity.potential_impact_level,
			keyEntitiesMentioned: entity.key_entities_mentioned,
			relevanceToPricePrediction: entity.relevance_to_price_prediction,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
		} as NewsFeedScrapResultAiSummaryData
	}
}