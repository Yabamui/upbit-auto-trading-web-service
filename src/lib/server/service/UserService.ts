import { UserInfoRepository } from '$lib/server/repository/UserInfoRepository';
import type { UserInfoData } from '$lib/common/models/UserInfoData';
import { CurrentCryptoUtils } from '$lib/common/utils/CurrentCryptoUtils';
import { type UserInfoEntity, UserInfoEntityUtils } from '$lib/server/entities/UserInfoEntity';

export const UserService = {
	checkUserExist: checkUserExist,
	registerUser: registerUser,
	login: login
};

async function checkUserExist(email: string): Promise<boolean> {
	return await UserInfoRepository.existByEmail(email);
}

async function registerUser(
	email: string,
	password: string,
	name: string,
	mobileNo: string
): Promise<UserInfoData | null> {
	const existYn = await UserInfoRepository.existByEmail(email);

	if (existYn) {
		return null;
	}

	const salt = CurrentCryptoUtils.createSalt();

	const hashedPassword: string = await CurrentCryptoUtils.createHashedPassword(password, salt);

	if (!hashedPassword) {
		return null;
	}

	const userInfoEntity: UserInfoEntity | null = await UserInfoRepository.insertUserInfo(
		email,
		hashedPassword,
		salt,
		name,
		mobileNo
	);

	if (!userInfoEntity) {
		return null;
	}

	return UserInfoEntityUtils.toUserInfoData(userInfoEntity);
}

async function login(email: string, password: string): Promise<UserInfoData | null> {
	const userInfoEntity: UserInfoEntity | null = await UserInfoRepository.findTopByEmail(email);

	if (!userInfoEntity) {
		return null;
	}

	const result = await CurrentCryptoUtils.checkPassword(
		password,
		userInfoEntity.salt,
		userInfoEntity.password
	);

	if (!result) {
		return null;
	}

	return UserInfoEntityUtils.toUserInfoData(userInfoEntity);
}
