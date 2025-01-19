import { writable } from 'svelte/store';
import type { UserInfoData } from '$lib/common/models/UserInfoData';
import { browser } from '$app/environment';

const defaultUserInfoData: UserInfoData = {
	id: 0,
	email: 'example@gmail.com',
	name: 'Example User',
	mobileNo: '',
	imageUrl: '',
	role: '',
	status: 'ACTIVE',
	createdAt: 0,
	updatedAt: 0,
	deletedAt: null
};

function createUserStore(key: string) {
	const { set, subscribe } = writable<UserInfoData>(defaultUserInfoData);

	return {
		subscribe,
		set: (value: UserInfoData) => {
			set(value);
			
			if (browser) {
				localStorage.setItem(key, JSON.stringify(value));
			}
		},
		reset() {
			set(defaultUserInfoData);
			
			if (browser) {
				localStorage.removeItem(key);
			}
		}
	};
}

export const userStore = createUserStore('user-info');
