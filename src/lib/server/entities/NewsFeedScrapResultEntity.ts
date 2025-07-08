import type { NewsFeedScrapResultData } from '$lib/common/models/NewsFeedScrapResultData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface NewsFeedScrapResultEntity {
	id: number;
	post_id: string;
	media_name: string;
	title: string;
	link: string | null;
	categories: string[] | null;
	guid: string | null;
	contents: string;
	tag: string | null;
	published_at: Date;
	created_at: Date;
	updated_at: Date;
	ai_summary_yn: boolean;
}

export const NewsFeedScrapResultEntityUtils = {
	toNewsFeedScrapResultData: (entity: NewsFeedScrapResultEntity) => {
		return {
			id: entity.id,
			postId: entity.post_id,
			mediaName: entity.media_name,
			title: entity.title,
			link: entity.link,
			categories: entity.categories,
			guid: entity.guid,
			contents: entity.contents,
			tag: entity.tag,
			publishedAt: CurrentDateUtils.toFormatStringByDate(entity.published_at),
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			aiSummaryYn: entity.ai_summary_yn
		} as NewsFeedScrapResultData
	}
}
