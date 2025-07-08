import { POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT } from '$env/static/private';
import pg from 'pg';

const pool = new pg.Pool({
	host: POSTGRES_HOST,
	database: POSTGRES_DB,
	user: POSTGRES_USER,
	password: POSTGRES_PASSWORD,
	port: parseInt(POSTGRES_PORT)
});

export const connectToDB = async () => await pool.connect();
export const disconnectToDB = async () => await pool.end();
