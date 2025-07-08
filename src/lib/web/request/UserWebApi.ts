import type { UserInfoData } from '$lib/common/models/UserInfoData';
import axios from 'axios';
import { ResponseObject } from '$lib/common/models/ResponseData';
import { PUBLIC_API_HOST } from '$env/static/public';
import { ApiPathCode, ApiPathCodeUtils } from '$lib/common/enums/ApiPathCode';

export const UserWebApi = {
	login: login,
	registerUser: registerUser,
	logout: logout
};

async function login(email: string, password: string): Promise<ResponseObject<unknown>> {
	const body = {
		email: email,
		password: password
	};

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.userLogin);

	return await requestPost(url, body);
}

async function logout(): Promise<ResponseObject<boolean>> {
	const url = ApiPathCodeUtils.getUrl(ApiPathCode.userLogout);
	return await requestPost(url);
}

async function registerUser(
	email: string,
	password: string,
	name: string,
	mobileNo: string
): Promise<ResponseObject<UserInfoData | null>> {
	const body = {
		email: email,
		password: password,
		name: name,
		mobileNo: mobileNo
	};

	const url = ApiPathCodeUtils.getUrl(ApiPathCode.userRegister);

	return await requestPost(url, body);
}

async function requestPost(url: string, body: unknown = {}): Promise<ResponseObject<unknown>> {
	return axios
		.post(PUBLIC_API_HOST + url, body)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			return error.response.data;
		});
}
