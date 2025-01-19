import { redisClient } from '$lib/server/config/RedisConfig';
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
	sMembers: sMembers
}

async function exists(key: string) {
	return await redisClient.exists(key);
}

async function del(key: string) {
	await redisClient.del(key);
}

async function hSet(data: HashSetData) {
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
	return await redisClient.hGet(data.key, data.hKey);
}

async function sAdd(data: SetsSetData) {
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
	return await redisClient.sMembers(data.key);
}