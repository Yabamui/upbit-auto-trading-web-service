export interface NewsFeedScrapResultData {
	id: number;
	postId: string;
	mediaName: string;
	title: string;
	link: string;
	categories: string[]
	guid: string;
	contents: string;
	tag: string;
	publishedAt: string;
	createdAt: string;
	updatedAt: string;
	aiSummaryYn: boolean;
}

export interface NewsFeedScrapResultAiSummaryData {
	id: number;
	resultId: number;
	modelName: string;
	resultCode: string;
	resultMessage: string;
	sourceCategory: string | null;
	primaryCryptocurrency: string | null;
	otherMentionedCryptocurrencies: string[] | null;
	coreEventSummary: string | null;
	sentimentTowardsPrimaryCryptocurrency: string | null;
	sentimentTowardsOverallMarket: string | null;
	potentialImpactLevel: string | null;
	keyEntitiesMentioned: string[] | null;
	relevanceToPricePrediction: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface NewsFeedScrapResultWithAiSummaryData {
	result: NewsFeedScrapResultData;
	aiSummary: NewsFeedScrapResultAiSummaryData | null;
}