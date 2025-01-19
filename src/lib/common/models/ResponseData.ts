import { type ResponseCodeData } from '$lib/common/enums/ResponseCode';

export class ResponseObject<T> {
	code: string;
	title: string;
	message: string;
	data: T | T[] | unknown;

	constructor(code: string, title: string, message: string, data: T | unknown = null) {
		this.code = code;
		this.title = title;
		this.message = message;
		this.data = data;
	}

	static of<T>(responseCode: ResponseCodeData, data: T | unknown = null) {
		return new ResponseObject(
			responseCode.code,
			responseCode.title,
			responseCode.message,
			data || undefined
		);
	}
}

export interface PageObject<T> {
	list: T[];
	totalCount: number;
	totalPage: number;
	currentPage: number;
}
