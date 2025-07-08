import { writable } from 'svelte/store';
import type { OrderBuyData } from '$lib/common/models/OrderData';

function createOrderBuyStore() {
	const { set, subscribe } = writable<OrderBuyData | undefined>();
	
	return {
		subscribe,
		set: (value: OrderBuyData | undefined) => {
			set(value);
		},
		update: (value: OrderBuyData | undefined) => {
			set(value);
		}
	}
}

export const orderBuyStore = createOrderBuyStore();