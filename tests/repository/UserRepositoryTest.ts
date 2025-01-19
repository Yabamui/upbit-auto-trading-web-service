import { test } from 'vitest';
import { connectToDB } from '$lib/server/config/PGConfig';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

test('UserRepositoryTest', async () => {
	const dbConn = await connectToDB();
	
	const query = 'SELECT * FROM user_info WHERE true';
	
	try {
		const result = await dbConn.query(query);
		console.log('### UserRepositoryTest Result' + result.rowCount);
	} catch (error) {
		console.error('### UserRepositoryTest Error' + error);
	} finally {
		dbConn.release();
	}
});

test('AiAnalyticsServiceTest', async () => {
	console.log(CurrentDateUtils.getUnixTimestamp());
});