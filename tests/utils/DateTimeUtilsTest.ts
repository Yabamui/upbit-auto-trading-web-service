import { test } from 'vitest';
import moment, { type Moment } from 'moment';
import momentTz from 'moment-timezone'
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import {
	UPBitCandleTimeZones,
	UPBitCandleUnitEnum
} from '$lib/common/enums/UPBitCandleEnum';

test(
	'dateTimeUtilsTest',
	async () => {
		console.log(moment());
		console.log(moment().utc());
		
	},
	{ timeout: 1000 * 60 }
);

test('getMomentByCandleUnitTest', async () => {
	const date = '2025-02-01 08:00:00';
	const time = '09:20:00';
	const candleUnit = UPBitCandleUnitEnum.hours.key;
	
	const momentDate: Moment = moment(date);
	
	if (UPBitCandleUnitEnum.hours.key === candleUnit) {
		momentDate.set('hour', parseInt(time.split(':')[0]));
	} else if (UPBitCandleUnitEnum.minutes.key === candleUnit) {
		momentDate.set('hour', parseInt(time.split(':')[0]));
		momentDate.set('minute', parseInt(time.split(':')[1]));
	}
	
	console.log(momentDate.format(CurrentDateUtils.dateTimeFormat));
}, { timeout: 1000 * 60 });
