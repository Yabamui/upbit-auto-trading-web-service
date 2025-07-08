import { test } from 'vitest';
import Decimal from 'decimal.js';

test('NumberUtilsTest', async () => {
	const price = new Decimal(15);
	const before = new Decimal(1);
	
	const result = price.minus(before)
		.dividedBy(before.abs())
		.mul(100);
	
	console.log(result);
}, {timeout: 1000 * 20});