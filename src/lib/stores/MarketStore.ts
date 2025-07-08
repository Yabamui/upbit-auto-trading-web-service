import { writable } from 'svelte/store';
import type {
	TickerCalculationData,
	TickerData
} from '$lib/common/models/TickerData';

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

function createTickerCalculationStore() {
	const { subscribe, set} = writable<string>(undefined);

	return {
		subscribe,
		set: (value: TickerCalculationData | undefined) => {
			if (value) {
				set(JSON.stringify(value));
			}
		},
	};
}

function createTickerListStore() {
	const initValue = '[]';
	
	const { subscribe, set } = writable<string>(initValue);

	return {
		subscribe,
		set: (value: TickerData[]) => {
			if (value && value.length > 0) {
				set(JSON.stringify(value));
			} else {
				set(initValue);
			}
		},
	};
}

export const currentMarketCodeStore = createCurrentMarketCodeStore('marketCode');
export const tickerCalculationStore = createTickerCalculationStore();
export const tickerListStore = createTickerListStore();