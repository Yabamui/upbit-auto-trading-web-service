import { REDIS_HOST, REDIS_PORT } from '$env/static/private';
import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
	if (!redisClient) {
		redisClient = createClient({
			url: `redis://${REDIS_HOST}:${REDIS_PORT}/0`,
		});
		await redisClient.connect();
	}

	return redisClient;
}

export { redisClient };
