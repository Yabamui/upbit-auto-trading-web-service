import { writable } from 'svelte/store';

const initMarketCode = 'KRW-BTC';

function createCurrentMarketCodeStore(key: string) {
	const { subscribe, set, update } = writable<string>(initMarketCode);

	return {
		subscribe,
		set: (value: string) => {
			set(value);
			localStorage.setItem(key, value);
		},
		update,
		useLocalStorage: () => {
			const json = localStorage.getItem(key);
			
			if (json) {
				set(JSON.parse(json));
			}
			
			subscribe(current => {
				localStorage.setItem(key, current);
			});
		},
	};
}

export const currentMarketCodeStore = createCurrentMarketCodeStore('marketCode');
