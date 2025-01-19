import { json } from '@sveltejs/kit';
import { ResponseObject } from '$lib/common/models/ResponseData';
import {
	ResponseCode,
	type ResponseCodeData
} from '$lib/common/enums/ResponseCode';

export const ResponseUtils = {
	ok: ok,
	error: error
};

function ok<T>(data: T | null = null, headers: Record<string, string> | null = null) {
	if (headers) {
		return json(ResponseObject.of(ResponseCode.success, data), {
			status: ResponseCode.success.status,
			headers: headers
		});
	}
	return json(ResponseObject.of(ResponseCode.success, data), {
		status: ResponseCode.success.status,
	});
}

function error<T>(responseCodeData: ResponseCodeData, data: T | null = null) {
	return json(ResponseObject.of(responseCodeData, data), {
		status: responseCodeData.status
	});
}
