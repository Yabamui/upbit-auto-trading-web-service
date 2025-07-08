import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export const LoggingUtils = {
	info: info,
	error: error,
}

function info(method: string, message: string): void {
	console.log(`${CurrentDateUtils.getNowDateTimeString()} :: [INFO] ${method} :: ${message}`);
}

function error(method: string, message: string): void {
	console.error(`${CurrentDateUtils.getNowDateTimeString()} :: [ERROR] ${method} :: ${message}`);
}