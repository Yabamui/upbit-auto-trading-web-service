import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import type { Cookies } from '@sveltejs/kit';
import { UserService } from '$lib/server/service/UserService';
import { ApiPathCode } from '$lib/common/enums/ApiPathCode';

export async function GET({ params, url }) {
	const path = params.path;

	if ('info' === path) {
		return ResponseUtils.ok(null);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

export async function POST({ params, request, cookies }) {
	const path = params.path;

	if (ApiPathCode.userRegister.path === path) {
		return await registerUser(request);
	}

	if (ApiPathCode.userLogin.path === path) {
		return await login(request, cookies);
	}

	if (ApiPathCode.userLogout.path === path) {
		return await logout(cookies);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
}

async function registerUser(request: Request) {
	const { email, password, name, mobileNo } = await request.json();

	if (!email || !password || !name || !mobileNo) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	if (await UserService.checkUserExist(email)) {
		return ResponseUtils.error(ResponseCode.alreadyExists);
	}

	const userInfoData = await UserService.registerUser(email, password, name, mobileNo);

	if (!userInfoData) {
		return ResponseUtils.error(ResponseCode.internalServerError);
	}

	return ResponseUtils.ok(userInfoData);
}

async function login(request: Request, cookies: Cookies) {
	const { email, password } = await request.json();

	if (!email || !password) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const userInfoData = await UserService.login(email, password);

	if (!userInfoData) {
		return ResponseUtils.error(ResponseCode.notFound);
	}

	cookies.set('user_id', userInfoData.id.toString(), {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'strict'
	});

	return ResponseUtils.ok(userInfoData);
}

async function logout(cookies: Cookies) {
	cookies.delete('user_id', {
		path: '/',
		httpOnly: true,
		secure: false,
		sameSite: 'strict'
	});

	return ResponseUtils.ok();
}
