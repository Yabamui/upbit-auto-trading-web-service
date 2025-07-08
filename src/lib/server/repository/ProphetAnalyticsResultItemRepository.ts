import { connectToDB } from '$lib/server/config/PGConfig';
import type { ProphetAnalyticsResultItemEntity } from '$lib/server/entities/ProphetAnalyticsResultItemEntity';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const ProphetAnalyticsResultItemRepository = {
	deleteProphetAnalyticsResultItem: deleteProphetAnalyticsResultItem,
	deleteAllByUserIdAndResultIdIn: deleteAllByUserIdAndResultIdIn,
	findAllByUserIdAndResultId: findAllByUserIdAndResultId,
	findAllByUserIdAndResultIdInAndDs: findAllByUserIdAndResultIdInAndDs,
	findAllDSAndYhatByUserIdAndResultIdInAndDs: findAllDSAndYhatByUserIdAndResultIdInAndDs,
	findAllByUserIdAndResultIdIn: findAllByUserIdAndResultIdIn
};

async function findAllByUserIdAndResultId(
	userId: number,
	resultId: number
): Promise<ProphetAnalyticsResultItemEntity[]> {
	const dbConn = await connectToDB();

	const query = `SELECT *
                 FROM prophet_analytics_result_item
                 WHERE deleted_at is null
                   AND user_id = $1
                   AND result_id = $2
                 ORDER BY ds ASC`;

	try {
		const result = await dbConn.query(query, [userId, resultId]);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as ProphetAnalyticsResultItemEntity[];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultId',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndResultIdInAndDs(
	userId: number,
	resultIds: number[],
	ds: string
): Promise<ProphetAnalyticsResultItemEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_result_item
      WHERE deleted_at is null
        AND user_id = $1
        AND result_id = ANY ($2)
        AND ds >= $3`;

	try {
		const result = await dbConn.query(query, [userId, resultIds, ds]);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as ProphetAnalyticsResultItemEntity[];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultIdIn',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllDSAndYhatByUserIdAndResultIdInAndDs(
	userId: number,
	resultIds: number[],
	ds: string
): Promise<ProphetAnalyticsResultItemEntity[]> {
	const dbConn = await connectToDB();
	
	const query = `
      SELECT id, result_id, ds, yhat
      FROM prophet_analytics_result_item
      WHERE deleted_at is null
        AND user_id = $1
        AND result_id = ANY ($2)
        AND ds >= $3`;
	
	try {
		const result = await dbConn.query(query, [userId, resultIds, ds]);
		
		if (!result || result.rowCount === 0) {
			return [];
		}
		
		return result.rows as ProphetAnalyticsResultItemEntity[];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultIdIn',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByUserIdAndResultIdIn(
	userId: number,
	resultIds: number[]
): Promise<ProphetAnalyticsResultItemEntity[]> {
	const dbConn = await connectToDB();

	const query = `
      SELECT *
      FROM prophet_analytics_result_item
      WHERE deleted_at is null
        AND user_id = $1
        AND result_id = ANY ($2)`;

	try {
		const result = await dbConn.query(query, [userId, resultIds]);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as ProphetAnalyticsResultItemEntity[];
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.findAllByUserIdAndResultIdIn',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function deleteProphetAnalyticsResultItem(
	userId: number,
	resultId: number
): Promise<boolean> {
	const dbConn = await connectToDB();

	const query = `
      DELETE
      FROM prophet_analytics_result_item
      WHERE true
        AND user_id = $1
        AND result_id = $2
	`;

	try {
		await dbConn.query(query, [userId, resultId]);
		return true;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.deleteProphetAnalyticsResultItem',
			`${error}`
		);
		return false;
	} finally {
		dbConn.release();
	}
}

async function deleteAllByUserIdAndResultIdIn(
	userId: number,
	resultIdList: number[]
): Promise<boolean> {
	const dbConn = await connectToDB();

	const query = `
      DELETE
      FROM prophet_analytics_result_item
      WHERE true
        AND user_id = $1
        AND result_id = ANY ($2)
	`;

	try {
		await dbConn.query(query, [userId, resultIdList]);
		return true;
	} catch (error) {
		LoggingUtils.error(
			'ProphetAnalyticsResultItemRepository.deleteProphetAnalyticsResultItem',
			`${error}`
		);
		return false;
	} finally {
		dbConn.release();
	}
}
