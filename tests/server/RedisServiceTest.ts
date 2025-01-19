import {
	expect,
	test
} from 'vitest';
import { redisClient } from '$lib/server/config/RedisConfig';

test('RedisServiceTest', async () => {
	const key = 'test';
	const hKey = 'test1';
	const hValue = 'test2';
	
	await redisClient.hSet(key, hKey, hValue);
	await redisClient.expire(key, 60);
	
	const result = await redisClient.hGet(key, hKey);
	
	expect(result).toBe(hValue);
	
	console.log(result);
}, { timeout: 1000 * 60 });