import moment from 'moment';
import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';

export const CurrentDateUtils = {
	dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
	dateFormat: 'YYYY-MM-DD',
	timeFormat: 'HH:mm:ss',

	getFormat: (type: string) => {
		switch (type) {
			case 'SECOND':
				return 'MM-DD HH:mm:ss';
			case 'MINUTE':
				return 'MM-DD HH:mm';
			case 'HOUR':
				return 'MM-DD HH';
			case 'DAYS':
				return CurrentDateUtils.dateFormat;
			case 'WEEK':
				return 'YYYY-MM-DD';
			case 'MONTHS':
				return 'YYYY-MM';
			case 'YEAR':
				return 'YYYY';
			default:
				return CurrentDateUtils.dateTimeFormat;
		}
	},

	getNowISOString: () => {
		return moment().toISOString();
	},
	getTodayISOString: () => {
		return moment.utc().startOf('day').toISOString();
	},
	addDaysISOString: (number: number = 0) => {
		return moment().add(number).toISOString();
	},
	getNowDateTimeString: (format: string = 'YYYY-MM-DD HH:mm:ss') => {
		return moment().format(format);
	},
	getNowDateString: (format: string = 'YYYY-MM-DD') => {
		return moment().format(format);
	},
	getUnixTimestamp: () => {
		return moment().unix();
	},

	toDateTimeByDate: (date: string) => {
		return moment(date).toDate();
	},
	toUnixTimestampByDate: (date: Date) => {
		return moment(date).unix();
	},
	toUnixTimestampByString: (date: string) => {
		return moment(date).unix();
	},
	toFormatStringByDate: (date: Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss') => {
		if (!date) {
			return '';
		}
		return moment(date).format(format);
	},
	convertFormat: (dateString: string, format: string) => {
		return moment(dateString).format(format);
	},
	convertFormatWithTimeZone: (dateString: string, format: string, timeZone: string) => {
		if (UPBitCandleTimeZones.kst === timeZone) {
			return moment(dateString).format(format);
		} else {
			return moment(dateString).add(9, 'hours').format(format);
		}
	},

	addDays: (date: string, number: number, format: string = 'YYYY-MM-DD HH:mm:ss') => {
		return moment(date).add(number, 'days').format(format);
	},
	clearTime: (date: string) => {
		return moment(date).format('YYYY-MM-DD 00:00:00');
	},
	clearMinutes: (date: string) => {
		return moment(date).format('YYYY-MM-DD HH:00:00');
	},
	clearSeconds: (date: string) => {
		return moment(date).format('YYYY-MM-DD HH:mm:00');
	}
};
