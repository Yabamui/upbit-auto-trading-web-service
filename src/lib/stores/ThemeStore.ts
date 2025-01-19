import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createColorTheme(key: string) {
	const colorTheme = browser ? localStorage.getItem(key) : 'light';

	const { subscribe, set } = writable(colorTheme);

	return {
		subscribe,
		set: () => {
			if (browser) {
				const newColorTheme = localStorage.getItem(key) === 'light' ? 'light' : 'dark';
				set(newColorTheme);
			}
		}
	};
}

export const colorThemeStore = createColorTheme('color-theme');
