import { getRedisClient } from '$lib/server/config/RedisConfig';
import type {
	HashGetData,
	HashSetData,
	SetsMembersData,
	SetsSetData
} from '$lib/server/models/RedisData';

export const RedisService = {
	exists: exists,
	del: del,
	hGet: hGet,
	hSet: hSet,
	sAdd: sAdd,
	sMembers: sMembers,
	get: get,
	set: set,
};

async function exists(key: string) {
	const redisClient = await getRedisClient();
	return await redisClient.exists(key);
}

async function del(key: string) {
	const redisClient = await getRedisClient();
	await redisClient.del(key);
}

async function hSet(data: HashSetData) {
	const redisClient = await getRedisClient();

	for (const hashData of data.hashDataList) {
		await redisClient.hSet(data.key, hashData.key, hashData.value);
	}

	if (data.expire === 0) {
		return true;
	}

	const ttl = await redisClient.ttl(data.key);

	if (ttl === -1) {
		await redisClient.expire(data.key, data.expire);
	}

	return true;
}

async function hGet(data: HashGetData) {
	const redisClient = await getRedisClient();

	return await redisClient.hGet(data.key, data.hKey);
}

async function sAdd(data: SetsSetData) {
	const redisClient = await getRedisClient();

	for (const value of data.valueList) {
		await redisClient.sAdd(data.key, value);
	}

	if (data.expire === 0) {
		return true;
	}

	const ttl = await redisClient.ttl(data.key);

	if (ttl === -1) {
		await redisClient.expire(data.key, data.expire);
	}

	return true;
}

async function sMembers(data: SetsMembersData) {
	const redisClient = await getRedisClient();

	return await redisClient.sMembers(data.key);
}

async function get(key: string): Promise<string | null> {
	const redisClient = await getRedisClient();
	return await redisClient.get(key);
}

async function set(key: string, value: string, expire: number) {
	const redisClient = await getRedisClient();
	await redisClient.set(key, value);

	if (expire === 0) {
		return true;
	}

	await redisClient.expire(key, expire);

	return true;
}
