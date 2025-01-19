// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { PoolClient } from 'pg';

declare global {
	namespace App {
		interface Error {
			readonly errorId: string;
			readonly code: string;
			readonly message: string;
		}
		
		interface Locals {
			dbConn: PoolClient,
			dbConnYn: boolean
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
