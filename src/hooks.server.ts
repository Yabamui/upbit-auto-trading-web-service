import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { BatchJob } from '$lib/server/job/BatchJob';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	LoggingUtils.info('Server Route Id', event.route.id || '');

	return resolve(event);
}) satisfies Handle;

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	const convertError = error as Error;

	const errorJson = {
		errorId,
		status,
		message,
		eventUrl: event.url.href,
		eventRequestHeaders: event.request.headers,
		convertErrorMessage: convertError.message,
	}

	LoggingUtils.error('handleError Server', JSON.stringify(errorJson));

	return {
		errorId,
		code: ResponseCode.notFound.code,
		message: convertError.message
	};
};

export const init: ServerInit = async () => {
	LoggingUtils.info('### Server init', 'Start');

	await BatchJob.startAll();

	process.on('sveltekit:shutdown', async (reason) => {
		// const redisClient = await getRedisClient();
		LoggingUtils.info('### SvelteKit Shutdown', reason);

		await BatchJob.stopAll();
		// await redisClient.disconnect();
	});

	process.on('SIGINT', async () => {
		// const redisClient = await getRedisClient();
		LoggingUtils.info('### Process SIGINT', 'SIGINT');

		await BatchJob.stopAll();
		// await redisClient.disconnect();
		process.exit(130);
	});
};
