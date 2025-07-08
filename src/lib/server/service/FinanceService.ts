import { FINANCE_API_HOST, FINANCE_API_PASSWORD, FINANCE_API_SUBJECT_NAME } from '$env/static/private';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import type { ResponseObject } from '$lib/common/models/ResponseData';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { RedisService } from '$lib/server/service/RedisService';
import axios from 'axios';

export const FinanceService = {
	createAuth: createAuth,
}

async function createAuth(): Promise<string | null> {
	const path = '/auth/jwt';
	const subjectName = FINANCE_API_SUBJECT_NAME;
	const password = FINANCE_API_PASSWORD;

	const tokenByRedis = await getTokenByRedis(subjectName);

	if (tokenByRedis) {
		return tokenByRedis;
	}

	const url = `${FINANCE_API_HOST}${path}`;

	const body = {
		subjectName,
		password
	};

	const options = {
		headers: {
			'Content-Type': 'application/json',
		},
		timeout: 1000 * 30 // 30 seconds
	}

	const token = await axios.post(url, body, options)
		.then((response) => {
			const responseObject: ResponseObject<string> = response.data;

			if (ResponseCode.success.code === responseObject.code) {
				return responseObject.data as string;
			} else {
				LoggingUtils.error('createAuth', responseObject.message);
				return null;
			}
		})
		.catch((error) => {
			LoggingUtils.error('createAuth', error);
			return null;
		});

	if (token) {
		return await setTokenToRedis(subjectName, token);
	}

	return null;
}

async function getTokenByRedis(subjectName: string) {
	return await RedisService.get(subjectName);
}

async function setTokenToRedis(subjectName: string, token: string) {
	// 1 minute
	let expire = 60;

	// 30 minutes
	if (subjectName === 'SUPERVISOR') {
		expire = 60 * 30;
	}

	await RedisService.set(subjectName, token, expire);

	return token;
}