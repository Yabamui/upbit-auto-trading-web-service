import {  createClient } from 'redis';
import { REDIS_URL, REDIS_PASSWORD } from '$env/static/private';

export const redisClient = createClient({
	url: REDIS_URL,
	password: REDIS_PASSWORD
});

await redisClient.connect();
