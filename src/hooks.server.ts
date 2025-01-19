import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { NodeCronJob } from '$lib/server/job/NodeCronJob';
import { redisClient } from '$lib/server/config/RedisConfig';

export const handle = (async ({ event, resolve }) => {
	console.log(
		`${CurrentDateUtils.getNowDateTimeString()} :: ### Server Route Id : ${event.route.id}`
	);

	const response = await resolve(event);

	return response;
}) satisfies Handle;

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	console.error('### handleError Server');
	console.error(errorId);
	console.error(error);
	console.error(event.url.href);
	console.error(event.request.headers);
	console.error(status);
	console.error(message);
	console.error('### handleError Server');

	return {
		errorId,
		code: ResponseCode.notFound.code,
		message: 'Something is Wrong!'
	};
};

export const init: ServerInit = async () => {
	console.log('### init Server');

	await NodeCronJob.startAll();

	process.on('sveltekit:shutdown', async (reason) => {
		console.log('### SvelteKit Shutdown because of ' + reason);
		
		await redisClient.disconnect();
		await NodeCronJob.stopAll();
	});

	process.on('SIGINT', async () => {
		console.log('### Process SIGINT');
		
		await NodeCronJob.stopAll();
		await redisClient.disconnect();
		process.exit(130);
	});
};
