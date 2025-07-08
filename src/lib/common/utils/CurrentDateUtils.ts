import moment, { type Moment } from 'moment';
import momentTz from 'moment-timezone';
import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';

export const CurrentDateUtils = {
	dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
	dateFormat: 'YYYY-MM-DD',
	timeFormat: 'HH:mm:ss',

	getFormat: (type: string) => {
		switch (type) {
			case 'SECONDS':
				return 'YYYY-MM-DD HH:mm:ss';
			case 'MINUTES':
			case 'MINUTES_3':
			case 'MINUTES_5':
			case 'MINUTES_10':
			case 'MINUTES_15':
			case 'MINUTES_30':
				return 'YYYY-MM-DD HH:mm';
			case 'HOURS':
			case 'HOURS_4':
				return 'YYYY-MM-DD HH';
			case 'DAYS':
				return CurrentDateUtils.dateFormat;
			case 'WEEKS':
				return 'YYYY-MM-DD';
			case 'MONTHS':
				return 'YYYY-MM';
			case 'YEARS':
				return 'YYYY';
			default:
				return CurrentDateUtils.dateTimeFormat;
		}
	},
	getAddUnit: (
		type: string
	): {
		amount: number;
		unit: moment.unitOfTime.Base;
	} => {
		switch (type) {
			case 'SECONDS':
				return {
					amount: 1,
					unit: 'seconds'
				};
			case 'MINUTES':
				return {
					amount: 1,
					unit: 'minutes'
				};
			case 'MINUTES_3':
				return {
					amount: 3,
					unit: 'minutes'
				};
			case 'MINUTES_5':
				return {
					amount: 5,
					unit: 'minutes'
				};
			case 'MINUTES_10':
				return {
					amount: 10,
					unit: 'minutes'
				};
			case 'MINUTES_15':
				return {
					amount: 15,
					unit: 'minutes'
				};
			case 'MINUTES_30':
				return {
					amount: 30,
					unit: 'minutes'
				};
			case 'HOURS':
				return {
					amount: 1,
					unit: 'hours'
				};
			case 'HOURS_4':
				return {
					amount: 4,
					unit: 'hours'
				};
			case 'DAYS':
				return {
					amount: 1,
					unit: 'days'
				};
			case 'WEEKS':
				return {
					amount: 1,
					unit: 'weeks'
				};
			case 'MONTHS':
				return {
					amount: 1,
					unit: 'months'
				};
			case 'YEARS':
				return {
					amount: 1,
					unit: 'years'
				};
			default:
				return {
					amount: 1,
					unit: 'seconds'
				};
		}
	},

	getNowDateTime: (timeZone: string = UPBitCandleTimeZones.kst): Date => {
		if (UPBitCandleTimeZones.kst === timeZone) {
			return momentTz().tz('Asia/Seoul').toDate();
		}

		return momentTz().tz('UTC').toDate();
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
	getNowDateTimeString: (
		format: string = 'YYYY-MM-DD HH:mm:ss',
		timeZone: string = UPBitCandleTimeZones.kst
	) => {
		if (UPBitCandleTimeZones.kst === timeZone) {
			return momentTz().tz('Asia/Seoul').format(format);
		}

		return momentTz().tz('UTC').format(format);
	},
	getNowDateString: (timeZone: string = UPBitCandleTimeZones.kst) => {
		const nowDate = moment().utc();

		if (UPBitCandleTimeZones.kst === timeZone) {
			return nowDate.add(9, 'hours').format(CurrentDateUtils.dateFormat);
		}

		return nowDate.format(CurrentDateUtils.dateFormat);
	},
	getUnixTimestamp: () => {
		return moment().unix();
	},

	toDateByString: (date: string) => {
		return moment(date).toDate();
	},
	toUnixTimestampByDate: (date: Date) => {
		return moment(date).unix();
	},
	toUnixTimestampByString: (date: string) => {
		return moment(date).unix();
	},
	toKSTFormatStringByDate: (
		date: Date | null | undefined,
		format: string = 'YYYY-MM-DD HH:mm:ss'
	) => {
		if (!date) {
			return '';
		}

		return moment(date).add(9, 'hours').format(format);
	},
	toFormatStringByDate: (
		date: Date | null | undefined,
		format: string = 'YYYY-MM-DD HH:mm:ss'
	): string => {
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
	toKSTStringByUTCString: (dateString: string, timeZone: string) => {
		if (UPBitCandleTimeZones.kst === timeZone) {
			return moment(dateString).format();
		} else {
			return moment(dateString).add(9, 'hours').format();
		}
	},

	addHoursByString: (date: string, number: number, format: string) => {
		return moment(date).add(number, 'hours').format(format);
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
	},

	getDateTimeList: (startDateTime: string, endDateTime: string, candleUnit: string) => {
		const start = CurrentDateUtils.getMomentStartOf(moment(startDateTime), candleUnit);

		const end = CurrentDateUtils.getMomentStartOf(moment(endDateTime), candleUnit);

		const dateTimeFormat = CurrentDateUtils.getFormat(candleUnit);

		const addUnit: {
			amount: number;
			unit: moment.unitOfTime.Base;
		} = CurrentDateUtils.getAddUnit(candleUnit);

		const dateTimeList: string[] = [];

		while (start.isBefore(end) || start.isSame(end)) {
			dateTimeList.push(start.format(dateTimeFormat));
			start.add(addUnit.amount, addUnit.unit);
		}

		return dateTimeList;
	},

	getMomentStartOf: (momentTime: Moment, candleUnit: string) => {
		switch (candleUnit) {
			case 'SECONDS':
				return momentTime.startOf('second');
			case 'MINUTES':
			case 'MINUTES_3':
			case 'MINUTES_5':
			case 'MINUTES_10':
			case 'MINUTES_15':
			case 'MINUTES_30':
				return momentTime.startOf('minute');
			case 'HOURS':
			case 'HOURS_4':
				return momentTime.startOf('hour');
			case 'DAYS':
				return momentTime.startOf('day');
			case 'WEEKS':
				return momentTime.startOf('week').add(1, 'days');
			case 'MONTHS':
				return momentTime.startOf('month');
			case 'YEARS':
				return momentTime.startOf('year');
			default:
				return momentTime;
		}
	},

	getDateTimeStringAndSetTime: (dateString: string, timeString: string, candleUnit: string) => {
		const momentDate = moment(dateString);

		const timeArray = timeString.split(':');

		if ('HOURS' === candleUnit) {
			momentDate.set('hour', parseInt(timeArray[0]));
		}

		return momentDate.format(CurrentDateUtils.dateTimeFormat);
	}
};
