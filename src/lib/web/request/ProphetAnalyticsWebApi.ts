import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';
import { WebApiRequestUtils } from '$lib/web/api/WebApiRequestUtils';
import type { ResponseObject } from '$lib/common/models/ResponseData';
import type {
	ProphetAnalyticsRequestConfigCreateData,
	ProphetAnalyticsRequestConfigUpdateData
} from '$lib/common/models/ProphetAnalyticsRequestConfigData';

export const ProphetAnalyticsWebApi = {
	getProphetAnalyticsRequestList: getProphetAnalyticsRequestList,
	createProphetAnalyticsRequest: createProphetAnalyticsRequest,

	getProphetAnalyticsResult: getProphetAnalyticsResult,
	deleteProphetAnalyticsResult: deleteProphetAnalyticsResult,

	getProphetAnalyticsRequestConfig: getProphetAnalyticsRequestConfig,
	createProphetAnalyticsRequestConfig: createProphetAnalyticsRequestConfig,
	updateProphetAnalyticsRequestConfig: updateProphetAnalyticsRequestConfig
};

async function getProphetAnalyticsRequestList(market: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestList, params);

	return await WebApiRequestUtils.get(url);
}

async function createProphetAnalyticsRequest(market: string): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestCreate);

	return await WebApiRequestUtils.post(url, { market });
}

async function getProphetAnalyticsResult(requestId: number): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ requestId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResult, params);

	return await WebApiRequestUtils.get(url);
}

async function deleteProphetAnalyticsResult(requestId: number): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ requestId });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsResultDelete, params);

	return await WebApiRequestUtils.del(url);
}

async function getProphetAnalyticsRequestConfig(market: string): Promise<ResponseObject<unknown>> {
	const params = await CurrentStringUtils.generateQueryParam({ market });

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfig, params);

	return await WebApiRequestUtils.get(url);
}

async function createProphetAnalyticsRequestConfig(
	createData: ProphetAnalyticsRequestConfigCreateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfigCreate);

	return await WebApiRequestUtils.post(url, createData);
}

async function updateProphetAnalyticsRequestConfig(
	updateData: ProphetAnalyticsRequestConfigUpdateData
): Promise<ResponseObject<unknown>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.prophetAnalyticsRequestConfigUpdate);

	return await WebApiRequestUtils.put(url, updateData);
}
