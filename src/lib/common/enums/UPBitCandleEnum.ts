export interface UPBitCandleUnitCodeData {
	unit: number;
	key: string;
	name: string;
}

export const UPBitCandleUnitEnum = {
	seconds: {
		unit: 0,
		key: 'SECONDS',
		name: '초'
	},
	minutes: {
		unit: 1,
		key: 'MINUTES',
		name: '1분'
	},
	minutes3: {
		unit: 3,
		key: 'MINUTES_3',
		name: '3분'
	},
	minutes5: {
		unit: 5,
		key: 'MINUTES_5',
		name: '5분'
	},
	minutes10: {
		unit: 10,
		key: 'MINUTES_10',
		name: '10분'
	},
	minutes15: {
		unit: 15,
		key: 'MINUTES_15',
		name: '15분'
	},
	minutes30: {
		unit: 30,
		key: 'MINUTES_30',
		name: '30분'
	},
	hours: {
		unit: 60,
		key: 'HOURS',
		name: '1시간'
	},
	hours4: {
		unit: 240,
		key: 'HOURS_4',
		name: '4시간'
	},
	days: {
		unit: 0,
		key: 'DAYS',
		name: '일'
	},
	weeks: {
		unit: 0,
		key: 'WEEKS',
		name: '주'
	},
	months: {
		unit: 0,
		key: 'MONTHS',
		name: '월'
	},
	years: {
		unit: 0,
		key: 'YEARS',
		name: '년'
	}
};

export const UPBitCandleTimeZones = {
	utc: 'UTC',
	kst: 'KST'
};

export const UPBitCandleEnumUtils = {
	existCandleUnitYn: (candleUnitKey: string): boolean => {
		return Object.values(UPBitCandleUnitEnum)
			.some(
				(item: UPBitCandleUnitCodeData): boolean => item.key === candleUnitKey
			);
	},
	existCandleTimeZoneYn: (candleTimeZone: string): boolean => {
		return Object.values(UPBitCandleTimeZones)
			.some((item: string): boolean => item === candleTimeZone
			);
	},
	getUPBitCandleUnitCode: (key: string): UPBitCandleUnitCodeData => {
		return Object.values(UPBitCandleUnitEnum)
			.find(
				(item) => item.key === key
			) as UPBitCandleUnitCodeData;
	},
	getAiRequestUnit: () => {
		return [
			UPBitCandleUnitEnum.minutes,
			UPBitCandleUnitEnum.hours,
			UPBitCandleUnitEnum.days,
			UPBitCandleUnitEnum.months,
			UPBitCandleUnitEnum.years
		];
	}
};
