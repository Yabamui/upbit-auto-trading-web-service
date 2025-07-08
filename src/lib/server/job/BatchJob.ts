import cron from 'node-cron';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { RedisService } from '$lib/server/service/RedisService';
import type { HashSetData } from '$lib/server/models/RedisData';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { TickerService } from '$lib/server/service/TickerService';

const redisKey = 'node-cron-job';

const job = {
	jobFunctionName: {
		cron: '0 */3 * * *', // every 3 hours
		options: {
			scheduled: false,
			timezone: 'Asia/Seoul',
			name: 'jobFunctionName'
		}
	},
	jobUpdateTickerList: {
		cron: '*/1 * * * * *', // every 1 second
		options: {
			scheduled: false,
			timezone: 'Asia/Seoul',
			name: 'jobUpdateTickerList'
		}
	}
};

const jobStatus = {
	stay: 'stay',
	work: 'work'
};

export const NodeCronJob = {
	nowAll: async () => {
		jobUpdateTickerList.now();
	},
	startAll: async () => {
		const result = await createRedisKey();

		if (!result) {
			return;
		}

		jobUpdateTickerList.start();
	},
	stopAll: async () => {
		await removeRedisKey();
		jobUpdateTickerList.stop();
	}
};

const jobUpdateTickerList = cron.schedule(
	job.jobUpdateTickerList.cron,
	async () => {
		const jobNames = job.jobUpdateTickerList.options.name;
		const result = await isWorking(jobNames);

		if (result) {
			logging(`${jobNames} is working`);
			return;
		}

		await setWorking(jobNames);

		await TickerService.updateTickerListByMarketCurrency("KRW");

		await setStay(jobNames);
	},
	{ ...job.jobUpdateTickerList.options }
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
