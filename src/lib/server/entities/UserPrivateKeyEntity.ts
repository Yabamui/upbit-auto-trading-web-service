import type { UserPrivateKeyData } from '$lib/common/models/UserPrivateKeyData';

export interface UserPrivateKeyEntity {
	id: number;
	user_id: number;
	google_ai_api_key: string;
	upbit_access_key: string;
	upbit_secret_key: string;
	
	created_at: Date;
	updated_at: Date;
}

export const UserPrivateKeyEntityUtils = {
	toUserPrivateKeyData: (entity: UserPrivateKeyEntity): UserPrivateKeyData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			googleAiApiKey: entity.google_ai_api_key,
			upbitAccessKey: entity.upbit_access_key,
			upbitSecretKey: entity.upbit_secret_key
		};
	}
}