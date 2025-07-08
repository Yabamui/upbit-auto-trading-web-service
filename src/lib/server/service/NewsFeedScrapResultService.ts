import { NewsFeedScrapResultRepository } from '$lib/server/repository/NewsFeedScrapResultRepository';
import {
	type NewsFeedScrapResultEntity,
	NewsFeedScrapResultEntityUtils
} from '$lib/server/entities/NewsFeedScrapResultEntity';
import type {
	NewsFeedScrapResultAiSummaryData,
	NewsFeedScrapResultData,
	NewsFeedScrapResultWithAiSummaryData
} from '$lib/common/models/NewsFeedScrapResultData';
import { NewsFeedScrapResultAiSummaryRepository } from '$lib/server/repository/NewsFeedScrapResultAiSummaryRepository';
import {
	type NewsFeedScrapResultAiSummaryEntity,
	NewsFeedScrapResultAiSummaryEntityUtils
} from '$lib/server/entities/NewsFeedScrapResultAiSummaryEntity';
import { ResponseCode } from '$lib/common/enums/ResponseCode';

export const NewsFeedScrapResultService = {
	getNewsFeedScrapResultList: getNewsFeedScrapResultList,
	getNewFeedScrapResultAiSummaryList: getNewFeedScrapResultAiSummaryList
};

async function getNewsFeedScrapResultList(
	publishedAt: string
): Promise<NewsFeedScrapResultWithAiSummaryData[]> {
	const limit: number = 20;
	const resultEntities: NewsFeedScrapResultEntity[] =
		await NewsFeedScrapResultRepository.findAllByPublishedAtLte(
			publishedAt,
			limit
		);

	if (resultEntities.length === 0) {
		return [];
	}

	const aiSummaryByResultId: Record<number, NewsFeedScrapResultAiSummaryData> =
		await _getNewsFeedScrapResultAiSummaryByResultId(
			resultEntities.map((entity: NewsFeedScrapResultEntity): number => entity.id)
		);

	return resultEntities.map(
		(entity: NewsFeedScrapResultEntity): NewsFeedScrapResultWithAiSummaryData => {
			const result: NewsFeedScrapResultData =
				NewsFeedScrapResultEntityUtils.toNewsFeedScrapResultData(entity);

			return {
				result: result,
				aiSummary: aiSummaryByResultId[entity.id] || null
			} as NewsFeedScrapResultWithAiSummaryData;
		}
	);
}

async function _getNewsFeedScrapResultAiSummaryByResultId(
	resultIdList: number[]
): Promise<Record<number, NewsFeedScrapResultAiSummaryData>> {
	const aiSummaryEntities: NewsFeedScrapResultAiSummaryEntity[] =
		await NewsFeedScrapResultAiSummaryRepository.findAllByResultIdIn(resultIdList);

	if (aiSummaryEntities.length === 0) {
		return {};
	}

	return aiSummaryEntities
		.filter(
			(item: NewsFeedScrapResultAiSummaryEntity): boolean =>
				ResponseCode.success.code === item.result_code
		)
		.reduce(
			(
				acc: Record<number, NewsFeedScrapResultAiSummaryData>,
				item: NewsFeedScrapResultAiSummaryEntity
			): Record<number, NewsFeedScrapResultAiSummaryData> => {
				acc[item.result_id] =
					NewsFeedScrapResultAiSummaryEntityUtils.toNewsFeedScrapResultAiSummaryData(item);
				return acc;
			},
			{} as Record<number, NewsFeedScrapResultAiSummaryData>
		);
}

async function getNewFeedScrapResultAiSummaryList(resultIdList: number[]) {
	const aiSummaryEntities: NewsFeedScrapResultAiSummaryEntity[] =
		await NewsFeedScrapResultAiSummaryRepository.findAllByResultIdIn(resultIdList);

	if (aiSummaryEntities.length === 0) {
		return [];
	}

	return aiSummaryEntities.map(
		(entity: NewsFeedScrapResultAiSummaryEntity): NewsFeedScrapResultAiSummaryData => {
			return NewsFeedScrapResultAiSummaryEntityUtils.toNewsFeedScrapResultAiSummaryData(entity);
		}
	);
}
