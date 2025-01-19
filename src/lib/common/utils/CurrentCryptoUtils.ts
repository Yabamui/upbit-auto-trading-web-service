import { PASSWORD_ITERATIONS } from '$env/static/private';
import crypto from 'crypto';

export const CurrentCryptoUtils = {
	createSalt: createSalt,
	createHashedPassword: createHashedPassword,
	checkPassword: checkPassword,
};

function createSalt(): string {
	return crypto.randomBytes(64).toString('base64');
}

function createHashedPassword(inputPassword: string, salt: string): Promise<string> {
	return new Promise((resolve) => {
		const iterations = parseInt(PASSWORD_ITERATIONS);

		crypto.pbkdf2(inputPassword, salt, iterations, 64, 'sha512', (err, key) => {
			if (err) {
				console.error('### createHashedPassword Error: ' + err);
				resolve('');
			}

			resolve(key.toString('base64'));
		});
	});
}

function checkPassword(inputPassword: string, salt: string, hashedPassword: string) {
	return new Promise((resolve, reject) => {
		const iterations = parseInt(PASSWORD_ITERATIONS);

		crypto.pbkdf2(inputPassword, salt, iterations, 64, 'sha512', (err, key) => {
			if (err) {
				console.error('### checkPassword Error: ' + err);
				reject(false);
			}

			const hashed = key.toString('base64');
			console.log('### checkPassword hashed: ' + hashed);

			resolve(hashed === hashedPassword);
		});
	});
}
