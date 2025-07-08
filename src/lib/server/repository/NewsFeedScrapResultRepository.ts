import type { NewsFeedScrapResultEntity } from '$lib/server/entities/NewsFeedScrapResultEntity';
import type {
	PoolClient,
	QueryResult
} from 'pg';
import { connectToDB } from '$lib/server/config/PGConfig';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const NewsFeedScrapResultRepository = {
	findAllByPublishedAtLte: findAllByPublishedAtLte
};

async function findAllByPublishedAtLte(
	publishedAt: string,
	limit: number,
): Promise<NewsFeedScrapResultEntity[]> {
	const dbConn: PoolClient = await connectToDB();
	
	const query: string = `
        select *
        from news_feed_scrap_result
        where true
          and published_at < $1
        order by published_at desc
        limit $2
		`;
	
	try {
		const result: QueryResult = await dbConn.query(
			query,
			[publishedAt, limit]
		);
		
		return result.rows;
	} catch (error) {
		LoggingUtils.error(
			'NewsFeedScrapResultRepository.findAllByPublishedAt',
			`${error}`
		)
		
		return []
	} finally {
		dbConn.release();
	}
}