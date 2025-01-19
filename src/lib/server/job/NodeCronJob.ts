import cron from 'node-cron';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { RedisService } from '$lib/server/service/RedisService';
import type { HashSetData } from '$lib/server/models/RedisData';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';

const redisKey = 'node-cron-job';

const job = {
	jobCreateAiAnalyticsRequest: {
		cron: '0 */3 * * *', // every 3 hours
		options: {
			scheduled: false,
			timezone: 'Asia/Seoul',
			name: 'jobCreateAiAnalyticsRequest'
		}
	}
};

const jobStatus = {
	stay: 'stay',
	work: 'work'
};

export const NodeCronJob = {
	nowAll: async () => {
		jobCreateAiAnalyticsRequest.now();
	},
	startAll: async () => {
		const result = await createRedisKey();

		if (!result) {
			return;
		}

		jobCreateAiAnalyticsRequest.start();
	},
	stopAll: async () => {
		await removeRedisKey();
		jobCreateAiAnalyticsRequest.stop();
	}
};

const jobCreateAiAnalyticsRequest = cron.schedule(
	job.jobCreateAiAnalyticsRequest.cron,
	async () => {
		const jobNames = job.jobCreateAiAnalyticsRequest.options.name;
		const result = await isWorking(jobNames);

		if (result) {
			logging(`${jobNames} is working`);
			return;
		}

		await setWorking(jobNames);

		logging(`${jobNames} start`);

		const userId = 1;
		const marketCurrency = 'KRW-%';
		const aiModelId = 2;
		const aiPromptsId = 3;
		const candleType = 'DAYS';
		const candleCount = 200;
		const candleTimeZone = 'UTC';

		await AiAnalyticsService.createAiAnalyticsRequest(
			userId,
			marketCurrency,
			aiModelId,
			aiPromptsId,
			candleType,
			candleCount,
			candleTimeZone
		);

		logging(`${jobNames} end`);

		await setStay(jobNames);
	},
	{ ...job.jobCreateAiAnalyticsRequest.options }
);

async function createRedisKey() {
	const existYn = await RedisService.exists(redisKey);

	if (existYn) {
		logging(`Already Exist Redis Key : ${redisKey}`);
		return false;
	}

	const hashDataList = Object.values(job).map((value) => {
		return {
			key: value.options.name,
			value: jobStatus.stay
		};
	});

	const hashSetData: HashSetData = {
		key: redisKey,
		hashDataList: hashDataList,
		expire: 0
	};

	await RedisService.hSet(hashSetData);

	return true;
}

async function removeRedisKey() {
	const existYn = await RedisService.exists(redisKey);

	if (existYn) {
		await RedisService.del(redisKey);
	}
}

async function isWorking(hKey: string) {
	const result = await RedisService.hGet({
		key: redisKey,
		hKey: hKey
	});

	if (!result) {
		logging(`${hKey} is not exist`);
		return true;
	}

	return result === jobStatus.work;
}

async function setWorking(hKey: string) {
	await RedisService.hSet({
		key: redisKey,
		hashDataList: [
			{
				key: hKey,
				value: jobStatus.work
			}
		],
		expire: 0
	});
}

async function setStay(hKey: string) {
	await RedisService.hSet({
		key: redisKey,
		hashDataList: [
			{
				key: hKey,
				value: jobStatus.stay
			}
		],
		expire: 0
	});
}

function logging(lgo: string) {
	console.log(`${CurrentDateUtils.getNowDateTimeString()} :: ### ${lgo}`);
}
