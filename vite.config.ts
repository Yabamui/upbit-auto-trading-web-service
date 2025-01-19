import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 15001,
		strictPort: true,
		cors: true
	},
	optimizeDeps: {
		exclude: [
		
		]
	},
	
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*'],
	},
});
