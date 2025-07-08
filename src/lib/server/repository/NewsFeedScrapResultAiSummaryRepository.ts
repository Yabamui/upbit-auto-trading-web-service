import { connectToDB } from '$lib/server/config/PGConfig';
import type { PoolClient, QueryResult } from 'pg';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import type { NewsFeedScrapResultAiSummaryEntity } from '$lib/server/entities/NewsFeedScrapResultAiSummaryEntity';

export const NewsFeedScrapResultAiSummaryRepository = {
	findAllByResultIdIn: findAllByResultIdIn
};

async function findAllByResultIdIn(
	resultIdList: number[]
): Promise<NewsFeedScrapResultAiSummaryEntity[]> {
	const dbConn: PoolClient = await connectToDB();

	const query: string = `
      select *
      from news_feed_scrap_result_ai_summary
      where true
        and result_id = any ($1)
        and result_code = $2
	`;

	try {
		const result: QueryResult = await dbConn.query(query, [
			resultIdList,
			ResponseCode.success.code
		]);

		return result.rows;
	} catch (error) {
		console.error('NewsFeedScrapResultAiSummaryRepository.findAllByResultIdIn', `${error}`);

		return [];
	}
}
