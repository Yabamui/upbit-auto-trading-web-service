import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],
	server: {
		port: 15001,
		strictPort: true,
		cors: false,
	},
	optimizeDeps: {
		exclude: []
	},
	
	// resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*'],
	},
});
