import { test } from 'vitest';
import { CurrentCryptoUtils } from '$lib/common/utils/CurrentCryptoUtils';
import moment from 'moment';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

test('createUserTest', async () => {
	const inputPassword = '1234';
	const salt = CurrentCryptoUtils.createSalt();

	const hashedPassword: string = await CurrentCryptoUtils.createHashedPassword(inputPassword, salt);

	console.log('### createUserTest password: ' + hashedPassword);
	console.log('### createUserTest salt: ' + salt);

	if (!hashedPassword) {
		console.error('### createUserTest hashedPassword is null');
		return;
	}

	const result = await CurrentCryptoUtils.checkPassword(inputPassword, salt, hashedPassword);

	console.log('### createUserTest result: ' + result);
});

test('createUserTest2', async () => {
	const dataTimeString = '2025-01-16 11:00:00'
	
	console.log(moment(dataTimeString).format(CurrentDateUtils.dateTimeFormat))
	console.log(moment(dataTimeString).add(9, 'hours').format(CurrentDateUtils.dateTimeFormat))
}, {timeout: 1000});