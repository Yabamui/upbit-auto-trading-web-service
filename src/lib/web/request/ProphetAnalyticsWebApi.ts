import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';
import type { ResponseObject } from '$lib/common/models/ResponseData';
import type {
	ProphetAnalyticsRequestConfigCreateData,
	ProphetAnalyticsRequestConfigUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestConfigData';
import type { ProphetAnalyticsRequestSchedulerCreateData } from '$lib/common/models/ProphetAnalyticsRequestSchedulerData';

export const ProphetAnalyticsWebApi = {
	getProphetAnalyticsRequestList: getProphetAnalyticsRequestList,
	createProphetAnalyticsRequest: createProphetAnalyticsRequest,
	checkProphetAnalyticsRequestComplete: checkProphetAnalyticsRequestComplete,

	getProphetAnalyticsResult: getProphetAnalyticsResult,
	getProphetAnalyticsResultByRequestId: getProphetAnalyticsResultByRequestId,
	getLatestProphetAnalyticsResultList: getLatestProphetAnalyticsResultList,
	getLatestProphetAnalyticsResultItemList: getLatestProphetAnalyticsResultItemList,
	deleteProphetAnalyticsResult: deleteProphetAnalyticsResult,

	getProphetAnalyticsRequestConfigList: getProphetAnalyticsRequestConfigList,
	createProphetAnalyticsRequestConfig: createProphetAnalyticsRequestConfig,
	createProphetAnalyticsRequestConfigByNotExistMarket:
		createProphetAnalyticsRequestConfigByNotExistMarket,
	updateProphetAnalyticsRequestConfig: updateProphetAnalyticsRequestConfig,

	getProphetAnalyticsRequestSchedulerList: getProphetAnalyticsRequestSchedulerList,
	createProphetAnalyticsRequestScheduler: createProphetAnalyticsRequestScheduler,
	updateProphetAnalyticsRequestScheduler: updateProphetAnalyticsRequestScheduler,
	deleteProphetAnalyticsRequestScheduler: deleteProphetAnalyticsRequestScheduler
};

// --- prophet analytics request ---
async function getProphetAnalyticsRequestList(market: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestList, params);

	return await WebApiRequestUtils.get(url);
}

async function createProphetAnalyticsRequest(
	market: string,
	configId: number,
	priceTypeList: string[]
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestCreate);

	return await WebApiRequestUtils.post(url, { market, configId, priceTypeList });
}

async function checkProphetAnalyticsRequestComplete(
	requestIdList: number[]
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ requestIdList: requestIdList });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestCompleteCheck, params);

	return await WebApiRequestUtils.get(url);
}

// --- prophet analytics result ---
async function getProphetAnalyticsResult(resultId: number): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ resultId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResult, params);

	return await WebApiRequestUtils.get(url);
}

async function getProphetAnalyticsResultByRequestId(
	requestId: number
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ requestId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResultByRequestId, params);

	return await WebApiRequestUtils.get(url);
}

async function getLatestProphetAnalyticsResultList(
	marketCurrency: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string,
	startDate: string = '',
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		marketCurrency,
		candleUnit,
		candleTimeZone,
		priceType,
		startDate
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResultLatestList, params);

	return await WebApiRequestUtils.get(url);
}

async function deleteProphetAnalyticsResult(requestId: number): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ requestId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResultDelete, params);

	return await WebApiRequestUtils.del(url);
}

async function getLatestProphetAnalyticsResultItemList(
	market: string,
	candleUnit: string,
	candleTimeZone: string,
	priceType: string
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({
		market,
		candleUnit,
		candleTimeZone,
		priceType
	});

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsLatestResultItemList, params);

	return await WebApiRequestUtils.get(url);
}

// --- prophet analytics request config ---
async function getProphetAnalyticsRequestConfigList(
	market: string
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfigList, params);

	return await WebApiRequestUtils.get(url);
}

async function createProphetAnalyticsRequestConfig(
	createData: ProphetAnalyticsRequestConfigCreateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfigCreate);

	return await WebApiRequestUtils.post(url, createData);
}

async function createProphetAnalyticsRequestConfigByNotExistMarket(
	marketCurrency: string,
	candleUnit: string,
	includeExclude: string,
	marketList: string[] | undefined
) {
	const url = ApiPathCodeUtils.getUrl(
		ApiPathCode.prophetAnalyticsRequestConfigCreateNotExistMarket
	);

	return await WebApiRequestUtils.post(url, {
		marketCurrency,
		candleUnit,
		includeExclude,
		marketList
	});
}

async function updateProphetAnalyticsRequestConfig(
	updateData: ProphetAnalyticsRequestConfigUpdateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfigUpdate);

	return await WebApiRequestUtils.put(url, updateData);
}

// --- prophet analytics request scheduler ---
async function getProphetAnalyticsRequestSchedulerList(): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestSchedulerList);

	return await WebApiRequestUtils.get(url);
}

async function createProphetAnalyticsRequestScheduler(
	createData: ProphetAnalyticsRequestSchedulerCreateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestSchedulerCreate);

	return await WebApiRequestUtils.post(url, createData);
}

async function updateProphetAnalyticsRequestScheduler(
	updateData: ProphetAnalyticsRequestSchedulerCreateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestSchedulerUpdate);

	return await WebApiRequestUtils.put(url, updateData);
}

async function deleteProphetAnalyticsRequestScheduler(
	schedulerId: number
): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ schedulerId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestSchedulerDelete, params);

	return await WebApiRequestUtils.del(url);
}
