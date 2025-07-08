import axios from 'axios';
import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { ResponseObject } from '$lib/common/models/ResponseData';

const defaultHeaders = {
	timeout: 1000 * 60
};

export const WebApiRequestUtils = {
	get: get,
	post: post,
	put: put,
	del: del
};

async function get(url: string): Promise<ResponseObject<unknown>> {
	
	const headers = {
		...defaultHeaders
	};
	return axios
		.get(url, headers)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			if (error.response?.data) {
				return error.response.data;
			}

			return ResponseUtils.error(ResponseCode.internalServerError);
		});
}

async function post(url: string, data: unknown): Promise<ResponseObject<unknown>> {
	const headers = {
		...defaultHeaders
	};

	return axios
		.post(url, data, headers)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			if (error.response?.data) {
				return error.response.data;
			}

			return ResponseUtils.error(ResponseCode.internalServerError);
		});
}

async function put(url: string, data: unknown): Promise<ResponseObject<unknown>> {
	const headers = {
		...defaultHeaders
	};

	return axios
		.put(url, data, headers)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			if (error.response?.data) {
				return error.response.data;
			}

			return ResponseUtils.error(ResponseCode.internalServerError);
		});
}

async function del(url: string): Promise<ResponseObject<unknown>> {
	const headers = {
		...defaultHeaders
	};

	return axios
		.delete(url, headers)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			if (error.response?.data) {
				return error.response.data;
			}

			return ResponseUtils.error(ResponseCode.internalServerError);
		});
}
