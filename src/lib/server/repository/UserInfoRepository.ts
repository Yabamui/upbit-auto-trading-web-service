import type { UserInfoEntity } from '$lib/server/entities/UserInfoEntity';
import { connectToDB } from '$lib/server/config/PGConfig';

export const UserInfoRepository = {
	insertUserInfo: insertUserInfo,
	existByEmail: existByEmail,
	findTopByEmail: findTopByEmail
};

async function existByEmail( email: string): Promise<boolean> {
	const dbConn = await connectToDB();
	
	const existByEmailQuery = `
      SELECT COUNT(*) AS count
      FROM user_info
      WHERE email = $1;
	`;

	try {
		const result = await dbConn.query(existByEmailQuery, [email]);

		return result.rows[0].count > 0;
	} catch (error) {
		console.error('### UserInfoRepository.existByEmail Error: ' + error);
		return false;
	} finally {
		dbConn.release();
	}
}

async function insertUserInfo(
	
	email: string,
	hashedPassword: string,
	salt: string,
	name: string,
	mobileNo: string
): Promise<UserInfoEntity | null> {
	const dbConn = await connectToDB();
	
	const insertUserInfoQuery = `
      INSERT INTO user_info (email, password, salt, name, mobile_no, role, status)
      VALUES ($1, $2, $3, $4, $5, 'USER', 'ACTIVE')
      RETURNING *;
	`;

	try {
		const result = await dbConn.query(insertUserInfoQuery, [
			email,
			hashedPassword,
			salt,
			name,
			mobileNo
		]);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0];
	} catch (error) {
		console.error('### UserInfoRepository.insertUserInfo Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findTopByEmail( email: string): Promise<UserInfoEntity | null> {
	const dbConn = await connectToDB();
	
	const findTopByEmailQuery = `
      SELECT *
      FROM user_info
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1;
	`;

	try {
		const result = await dbConn.query(findTopByEmailQuery, [email]);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0];
	} catch (error) {
		console.error('### UserInfoRepository.findTopByEmail Error: ' + error);
		return null;
	}	finally {
		dbConn.release();
	}
}
