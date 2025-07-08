import {
	type UserPrivateKeyEntity,
	UserPrivateKeyEntityUtils
} from '$lib/server/entities/UserPrivateKeyEntity';
import { UserPrivateKeyRepository } from '$lib/server/repository/UserPrivateKeyRepository';
import type { UserPrivateKeyData } from '$lib/common/models/UserPrivateKeyData';

export const UserPrivateKeyService = {
	getUserPrivateKey: getUserPrivateKey
};

async function getUserPrivateKey(userId: number): Promise<UserPrivateKeyData | undefined> {
	const userPrivateKeyEntity: UserPrivateKeyEntity | undefined =
		await UserPrivateKeyRepository.findTopByUserId(userId);

	if (!userPrivateKeyEntity) {
		return undefined;
	}

	return UserPrivateKeyEntityUtils.toUserPrivateKeyData(userPrivateKeyEntity);
}
