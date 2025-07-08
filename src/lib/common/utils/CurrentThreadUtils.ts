export const CurrentThreadUtils = {
	sleep: sleep
}

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}