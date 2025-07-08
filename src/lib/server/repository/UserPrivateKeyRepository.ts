import { connectToDB } from '$lib/server/config/PGConfig';
import type { UserPrivateKeyEntity } from '$lib/server/entities/UserPrivateKeyEntity';

export const UserPrivateKeyRepository = {
	findTopByUserId: findTopByUserId
}

async function findTopByUserId(userId: number): Promise<UserPrivateKeyEntity | undefined> {
	const client = await connectToDB();

	try {
		const query = `
        SELECT *
        FROM user_private_key
        WHERE true
          AND user_id = $1
        LIMIT 1;
		`;

		const result = await client.query(query, [userId]);

		if (result.rows.length === 0) {
			return undefined;
		}

		return result.rows[0];
	} catch (error) {
		console.error('Error executing query:', error);
		return undefined;
	} finally {
		client.release();
	}
}