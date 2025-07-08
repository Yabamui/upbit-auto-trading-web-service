import cron from 'node-cron';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { RedisService } from '$lib/server/service/RedisService';
import type { HashSetData } from '$lib/server/models/RedisData';
import { BatchService } from '$lib/server/service/BatchService';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

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
	},
	jobCreateAnalyzeTechnicalIndicator: {
		cron: '*/10 * * * * *', // every 10 seconds
		options: {
			scheduled: false,
			timezone: 'Asia/Seoul',
			name: 'jobCreateAnalyzeTechnicalIndicator'
		}
	}
};

const jobStatus = {
	stay: 'stay',
	work: 'work'
};

export const BatchJob = {
	nowAll: async () => {
		jobUpdateTickerList.now();
		jobCreateAnalyzeTechnicalIndicator.now();
	},
	startAll: async () => {
		const result = await createRedisKey();

		if (!result) {
			return;
		}

		jobUpdateTickerList.start();
		jobCreateAnalyzeTechnicalIndicator.start();
	},
	stopAll: async () => {
		await removeRedisKey();
		jobUpdateTickerList.stop();
		jobCreateAnalyzeTechnicalIndicator.stop();
	}
};

const jobUpdateTickerList = cron.schedule(
	job.jobUpdateTickerList.cron,
	async () => {
		const jobNames = job.jobUpdateTickerList.options.name;

		LoggingUtils.info(jobNames, 'Started');
		const result = await isWorking(jobNames);

		if (result) {
			LoggingUtils.info(jobNames, 'Is working');
			return;
		}

		await setWorking(jobNames);

		await BatchService.executeUpdateMarketCurrencyTickerToRedis();

		await setStay(jobNames);
		LoggingUtils.info(jobNames, 'Finished');
	},
	{ ...job.jobUpdateTickerList.options }
);

const jobCreateAnalyzeTechnicalIndicator = cron.schedule(
	job.jobCreateAnalyzeTechnicalIndicator.cron,
	async () => {
		const jobNames = job.jobCreateAnalyzeTechnicalIndicator.options.name;
		LoggingUtils.info(jobNames, 'Started');

		const result = await isWorking(jobNames);

		if (result) {
			LoggingUtils.info(jobNames, 'Is working');
			return;
		}

		await setWorking(jobNames);

		await BatchService.executeCreateAnalyzeTechnicalIndicatorToRedis();

		await setStay(jobNames);
		LoggingUtils.info(jobNames, 'Finished');
	},
	{ ...job.jobCreateAnalyzeTechnicalIndicator.options }
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
