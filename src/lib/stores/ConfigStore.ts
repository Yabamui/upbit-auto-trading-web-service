import { writable } from 'svelte/store';

export function createTradeIndicatorTableSortValueStore(key: string) {
	const { subscribe, set, update } = writable<string>('');

	return {
		subscribe,
		set: (value: string) => {
			set(value)
		},
		update,
	}
}


export function createTradeIndicatorTableIndicatorValueStore(key: string) {
	const { subscribe, set, update } = writable<string>('');

	return {
		subscribe,
		set: (value: string) => {
			set(value)
		},
		update,
	}
}

export function createTradeEChartIndicatorValueStore(key: string) {
	const { subscribe, set, update } = writable<string>('');

	return {
		subscribe,
		set: (value: string) => {
			set(value)
		},
		update,
	}
}


export const tradeIndicatorTableSortValueStore =
	createTradeIndicatorTableSortValueStore('tradeIndicatorTableSortValue');
export const tradeIndicatorTableIndicatorValueStore =
	createTradeIndicatorTableIndicatorValueStore('tradeIndicatorTableIndicatorValue');
export const tradeEChartIndicatorValueStore =
	createTradeEChartIndicatorValueStore('tradeEChartIndicatorValue');