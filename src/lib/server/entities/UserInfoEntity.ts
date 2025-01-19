import type { UserInfoData } from '$lib/common/models/UserInfoData';

export interface UserInfoEntity {
	id: number;
	email: string;
	password: string;
	salt: string;
	name: string;
	mobile_no: string;
	image_url: string;
	role: string;
	status: string;
	created_at: number;
	updated_at: number;
	deleted_at: number | null;
}

export const UserInfoEntityUtils = {
	toUserInfoData: (entity: UserInfoEntity): UserInfoData => {
		return {
			id: entity.id,
			email: entity.email,
			name: entity.name,
			mobileNo: entity.mobile_no,
			imageUrl: entity.image_url,
			role: entity.role,
			status: entity.status,
			createdAt: entity.created_at,
			updatedAt: entity.updated_at,
			deletedAt: entity.deleted_at
		};
	}
}