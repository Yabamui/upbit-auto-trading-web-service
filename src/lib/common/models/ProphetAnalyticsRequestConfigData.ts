import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import { ProphetAnalyticsConfigEnum } from '$lib/common/enums/ProphetAnalyticsConfigEnum';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';

export interface ProphetAnalyticsRequestConfigData {
	id: number;
	userId: number;
	market: string;
	candleUnit: string;
	candleTimeZone: string;
	beginCandleDateTime: Date | undefined;
	endCandleDateTime: Date | undefined;

	growth: string;
	exportPeriod: number;
	cap: number | undefined;
	floor: number | undefined;

	changepointList: string[] | undefined;
	changepointPriorScale: number;
	changepointNumber: number | undefined;
	changepointRange: number | undefined;

	seasonalityMode: string;
	seasonalityPriorScale: number;
	yearlySeasonality: string;
	weeklySeasonality: string;
	dailySeasonality: string;
	customSeasonalityList: ProphetAnalyticsCustomSeasonalityData[] | undefined;

	holidaysCountry: string;
	holidaysList: string[] | undefined;
	holidaysPriorScale: number;
	holidaysMode: string | undefined;

	mcmcSamples: number;
	intervalWidth: number;
	uncertaintySamples: number;
	stanBackend: string | undefined;
	scaling: string;

	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}

export interface ProphetAnalyticsRequestConfigCreateData {
	market: string;
	candleUnit: string;
	candleTimeZone: string;
	beginCandleDateTime: Date | undefined;
	endCandleDateTime: Date | undefined;

	growth: string;
	exportPeriod: number;
	cap: number | undefined;
	floor: number | undefined;

	changepointList: string[] | undefined;
	changepointPriorScale: number;
	changepointNumber: number | undefined;
	changepointRange: number | undefined;

	seasonalityMode: string;
	seasonalityPriorScale: number;
	yearlySeasonality: string;
	weeklySeasonality: string;
	dailySeasonality: string;
	customSeasonalityList: ProphetAnalyticsCustomSeasonalityData[] | undefined;

	holidaysCountry: string;
	holidaysList: string[] | undefined;
	holidaysPriorScale: number;
	holidaysMode: string | undefined;

	mcmcSamples: number;
	intervalWidth: number;
	uncertaintySamples: number;
	stanBackend: string | undefined;
	scaling: string;
}

export interface ProphetAnalyticsRequestConfigUpdateData {
	id: number;
	market: string;
	candleUnit: string;
	candleTimeZone: string;
	beginCandleDateTime: Date | undefined;
	endCandleDateTime: Date | undefined;

	growth: string;
	exportPeriod: number;
	cap: number | undefined;
	floor: number | undefined;

	changepointList: string[] | undefined;
	changepointPriorScale: number;
	changepointNumber: number | undefined;
	changepointRange: number | undefined;

	seasonalityMode: string;
	seasonalityPriorScale: number;
	yearlySeasonality: string;
	weeklySeasonality: string;
	dailySeasonality: string;
	customSeasonalityList: ProphetAnalyticsCustomSeasonalityData[] | undefined;

	holidaysCountry: string;
	holidaysList: string[] | undefined;
	holidaysPriorScale: number;
	holidaysMode: string | undefined;

	mcmcSamples: number;
	intervalWidth: number;
	uncertaintySamples: number;
	stanBackend: string | undefined;
	scaling: string;
}

export interface ProphetAnalyticsCustomSeasonalityData {
	name: string;
	period: number;
	mode: string;
	fourierOrder: number;
}

export interface RequestConfigFormData {
	candleTimeZone: string;
	beginCandleDateTime: Date | undefined;
	endCandleDateTime: Date | undefined;

	growth: string;
	exportPeriod: number;
	cap: number | undefined;
	floor: number | undefined;

	changepointList: string[] | undefined;
	changepointDate: RequestConfigDateData;
	changepointPriorScale: number;
	changepointNumber: number | undefined;
	changepointRange: number | undefined;

	seasonalityMode: string;
	seasonalityPriorScale: number;
	yearlySeasonality: string;
	yearlySeasonalityFourierOrder: number;
	weeklySeasonality: string;
	weeklySeasonalityFourierOrder: number;
	dailySeasonality: string;
	dailySeasonalityFourierOrder: number;
	customSeasonalityList: ProphetAnalyticsCustomSeasonalityData[] | undefined;
	customSeasonality: ProphetAnalyticsCustomSeasonalityData;

	holidaysCountry: string;
	holidaysList: string[] | undefined;
	holidaysDate: RequestConfigDateData;
	holidaysPriorScale: number;
	holidaysMode: string | undefined;

	mcmcSamples: number;
	intervalWidth: number;
	uncertaintySamples: number;
	stanBackend: string | undefined;
	scaling: string;
}

export interface RequestConfigDateData {
	year: string;
	month: string;
	day: string;
}

export interface ProphetAnalyticsRequestConfigNotExistMarketCreateResultData {
	newConfigCount: number;
	createFailCount: number;
}

export const ProphetAnalyticsRequestConfigDataUtils = {
	createProphetAnalyticsRequestCreateDataByDefaultData: (
		market: string,
		candleUnit: string
	): ProphetAnalyticsRequestConfigCreateData => {
		return {
			market,
			candleUnit: candleUnit,
			candleTimeZone: ProphetAnalyticsConfigEnum.defaultData.candleTimeZone,
			beginCandleDateTime: ProphetAnalyticsConfigEnum.defaultData.beginCandleDateTime,
			endCandleDateTime: ProphetAnalyticsConfigEnum.defaultData.endCandleDateTime,

			growth: ProphetAnalyticsConfigEnum.defaultData.growth,
			exportPeriod: ProphetAnalyticsConfigEnum.defaultData.exportPeriod,
			cap: ProphetAnalyticsConfigEnum.defaultData.cap,
			floor: ProphetAnalyticsConfigEnum.defaultData.floor,

			changepointList: ProphetAnalyticsConfigEnum.defaultData
				.changepointList as unknown as string[],
			changepointPriorScale: ProphetAnalyticsConfigEnum.defaultData.changepointPriorScale,
			changepointNumber: ProphetAnalyticsConfigEnum.defaultData.changepointNumber,
			changepointRange: ProphetAnalyticsConfigEnum.defaultData.changepointRange,

			seasonalityMode: ProphetAnalyticsConfigEnum.defaultData.seasonalityMode,
			seasonalityPriorScale: ProphetAnalyticsConfigEnum.defaultData.seasonalityPriorScale,
			yearlySeasonality: ProphetAnalyticsConfigEnum.defaultData.yearlySeasonality,
			weeklySeasonality: ProphetAnalyticsConfigEnum.defaultData.weeklySeasonality,
			dailySeasonality: ProphetAnalyticsConfigEnum.defaultData.dailySeasonality,
			customSeasonalityList: ProphetAnalyticsConfigEnum.defaultData
				.customSeasonalityList as unknown as ProphetAnalyticsCustomSeasonalityData[],

			holidaysCountry: ProphetAnalyticsConfigEnum.defaultData.holidaysCountry,
			holidaysList: ProphetAnalyticsConfigEnum.defaultData.holidaysList as unknown as string[],
			holidaysPriorScale: ProphetAnalyticsConfigEnum.defaultData.holidaysPriorScale,
			holidaysMode: ProphetAnalyticsConfigEnum.defaultData.holidaysMode,

			mcmcSamples: ProphetAnalyticsConfigEnum.defaultData.mcmcSamples,
			intervalWidth: ProphetAnalyticsConfigEnum.defaultData.intervalWidth,
			uncertaintySamples: ProphetAnalyticsConfigEnum.defaultData.uncertaintySamples,
			stanBackend: ProphetAnalyticsConfigEnum.defaultData.stanBackend,
			scaling: ProphetAnalyticsConfigEnum.defaultData.scaling
		};
	},
	createProphetAnalyticsRequestCreateData: (
		market: string,
		candleUnit: string,
		requestConfigFormData: RequestConfigFormData
	): ProphetAnalyticsRequestConfigCreateData => {
		return {
			market,
			candleUnit: candleUnit,
			candleTimeZone: requestConfigFormData.candleTimeZone,
			beginCandleDateTime: requestConfigFormData.beginCandleDateTime,
			endCandleDateTime: requestConfigFormData.endCandleDateTime,

			growth: requestConfigFormData.growth,
			exportPeriod: requestConfigFormData.exportPeriod,
			cap: requestConfigFormData.cap,
			floor: requestConfigFormData.floor,

			changepointList: requestConfigFormData.changepointList,
			changepointPriorScale: requestConfigFormData.changepointPriorScale,
			changepointNumber: requestConfigFormData.changepointNumber,
			changepointRange: requestConfigFormData.changepointRange,

			seasonalityMode: requestConfigFormData.seasonalityMode,
			seasonalityPriorScale: requestConfigFormData.seasonalityPriorScale,
			yearlySeasonality: requestConfigFormData.yearlySeasonality,
			weeklySeasonality: requestConfigFormData.weeklySeasonality,
			dailySeasonality: requestConfigFormData.dailySeasonality,
			customSeasonalityList: requestConfigFormData.customSeasonalityList,

			holidaysCountry: requestConfigFormData.holidaysCountry,
			holidaysList: requestConfigFormData.holidaysList,
			holidaysPriorScale: requestConfigFormData.holidaysPriorScale,
			holidaysMode: requestConfigFormData.holidaysMode,

			mcmcSamples: requestConfigFormData.mcmcSamples,
			intervalWidth: requestConfigFormData.intervalWidth,
			uncertaintySamples: requestConfigFormData.uncertaintySamples,
			stanBackend: requestConfigFormData.stanBackend,
			scaling: requestConfigFormData.scaling
		};
	},
	createProphetAnalyticsRequestUpdateData: (
		id: number,
		market: string,
		candleUnit: string,
		requestConfigFormData: RequestConfigFormData
	): ProphetAnalyticsRequestConfigUpdateData => {
		return {
			id: id,
			market,
			candleUnit: candleUnit,
			candleTimeZone: requestConfigFormData.candleTimeZone,
			beginCandleDateTime: requestConfigFormData.beginCandleDateTime,
			endCandleDateTime: requestConfigFormData.endCandleDateTime,

			growth: requestConfigFormData.growth,
			exportPeriod: requestConfigFormData.exportPeriod,
			cap: requestConfigFormData.cap,
			floor: requestConfigFormData.floor,

			changepointList: requestConfigFormData.changepointList,
			changepointPriorScale: requestConfigFormData.changepointPriorScale,
			changepointNumber: requestConfigFormData.changepointNumber,
			changepointRange: requestConfigFormData.changepointRange,

			seasonalityMode: requestConfigFormData.seasonalityMode,
			seasonalityPriorScale: requestConfigFormData.seasonalityPriorScale,
			yearlySeasonality: requestConfigFormData.yearlySeasonality,
			weeklySeasonality: requestConfigFormData.weeklySeasonality,
			dailySeasonality: requestConfigFormData.dailySeasonality,
			customSeasonalityList: requestConfigFormData.customSeasonalityList,

			holidaysCountry: requestConfigFormData.holidaysCountry,
			holidaysList: requestConfigFormData.holidaysList,
			holidaysPriorScale: requestConfigFormData.holidaysPriorScale,
			holidaysMode: requestConfigFormData.holidaysMode,

			mcmcSamples: requestConfigFormData.mcmcSamples,
			intervalWidth: requestConfigFormData.intervalWidth,
			uncertaintySamples: requestConfigFormData.uncertaintySamples,
			stanBackend: requestConfigFormData.stanBackend,
			scaling: requestConfigFormData.scaling
		};
	},
	validRequestData: (
		createData: ProphetAnalyticsRequestConfigCreateData | ProphetAnalyticsRequestConfigUpdateData
	): {
		valid: boolean;
		message: string;
	} => {
		const methodName = 'ProphetAnalyticsRequestConfigDataUtils.validCreateData';

		if (!createData) {
			LoggingUtils.error(methodName, 'createData is empty');
			return {
				valid: false,
				message: 'createData is empty'
			};
		}

		if (!createData.market) {
			LoggingUtils.error(methodName, 'market is empty');
			return {
				valid: false,
				message: 'market is empty'
			};
		}

		if (
			!createData.candleUnit ||
			(UPBitCandleUnitEnum.days.key !== createData.candleUnit &&
				UPBitCandleUnitEnum.hours.key !== createData.candleUnit)
		) {
			LoggingUtils.error(methodName, 'candle unit is wrong ' + createData.candleUnit);
			return {
				valid: false,
				message: 'candle unit is wrong ' + createData.candleUnit
			};
		}

		if (
			!createData.candleTimeZone ||
			(UPBitCandleTimeZones.utc !== createData.candleTimeZone &&
				UPBitCandleTimeZones.kst !== createData.candleTimeZone)
		) {
			LoggingUtils.error(methodName, 'candleTimeZone is wrong ' + createData.candleTimeZone);
			return {
				valid: false,
				message: 'candleTimeZone is wrong ' + createData.candleTimeZone
			};
		}

		if (
			!createData.growth ||
			!Object.keys(ProphetAnalyticsConfigEnum.growth).includes(createData.growth)
		) {
			LoggingUtils.error(methodName, 'growth is wrong ' + createData.growth);
			return {
				valid: false,
				message: 'growth is wrong ' + createData.growth
			};
		}

		if (createData.growth === ProphetAnalyticsConfigEnum.growth.logistic) {
			if (!CurrentNumberUtils.isNumber(createData.cap)) {
				LoggingUtils.error(methodName, 'cap is empty');
				return {
					valid: false,
					message: 'cap is empty'
				};
			}

			if (!CurrentNumberUtils.isNumber(createData.floor)) {
				LoggingUtils.error(methodName, 'floor is empty');
				return {
					valid: false,
					message: 'floor is empty'
				};
			}
		}

		if (createData.exportPeriod <= 0) {
			LoggingUtils.error(methodName, 'exportPeriod is wrong ' + createData.exportPeriod);
			return {
				valid: false,
				message: 'exportPeriod is wrong ' + createData.exportPeriod
			};
		}

		if (createData.changepointPriorScale < 0) {
			LoggingUtils.error(
				methodName,
				'changepointPriorScale is wrong ' + createData.changepointPriorScale
			);
			return {
				valid: false,
				message: 'changepointPriorScale is wrong ' + createData.changepointPriorScale
			};
		}

		if (!createData.changepointList) {
			if (!createData.changepointNumber) {
				LoggingUtils.error(methodName, 'changepointNumber is empty');
				return {
					valid: false,
					message: 'changepointNumber is empty'
				};
			}

			if (!createData.changepointRange) {
				LoggingUtils.error(methodName, 'changepointRange is empty');
				return {
					valid: false,
					message: 'changepointRange is empty'
				};
			}
		}

		if (
			!createData.seasonalityMode ||
			!Object.keys(ProphetAnalyticsConfigEnum.mode).includes(createData.seasonalityMode)
		) {
			LoggingUtils.error(methodName, 'seasonalityMode is wrong ' + createData.seasonalityMode);
			return {
				valid: false,
				message: 'seasonalityMode is wrong ' + createData.seasonalityMode
			};
		}

		if (!createData.seasonalityPriorScale) {
			LoggingUtils.error(methodName, 'seasonalityPriorScale is empty');
			return {
				valid: false,
				message: 'seasonalityPriorScale is empty'
			};
		}

		const seasonalityValue: string[] = Object.values(ProphetAnalyticsConfigEnum.seasonalityValue);

		if (!createData.yearlySeasonality || !seasonalityValue.includes(createData.yearlySeasonality)) {
			if (!CurrentNumberUtils.isNumber(createData.yearlySeasonality)) {
				LoggingUtils.error(
					methodName,
					'yearlySeasonality is wrong ' + createData.yearlySeasonality
				);
				return {
					valid: false,
					message: 'yearlySeasonality is wrong ' + createData.yearlySeasonality
				};
			}
		}

		if (!createData.weeklySeasonality || !seasonalityValue.includes(createData.weeklySeasonality)) {
			if (!CurrentNumberUtils.isNumber(createData.weeklySeasonality)) {
				LoggingUtils.error(
					methodName,
					'weeklySeasonality is wrong ' + createData.weeklySeasonality
				);
				return {
					valid: false,
					message: 'weeklySeasonality is wrong ' + createData.weeklySeasonality
				};
			}
		}

		if (!createData.dailySeasonality || !seasonalityValue.includes(createData.dailySeasonality)) {
			if (!CurrentNumberUtils.isNumber(createData.dailySeasonality)) {
				LoggingUtils.error(methodName, 'dailySeasonality is wrong ' + createData.dailySeasonality);
				return {
					valid: false,
					message: 'dailySeasonality is wrong ' + createData.dailySeasonality
				};
			}
		}

		if (createData.customSeasonalityList && createData.customSeasonalityList.length > 0) {
			for (const customSeasonalityData of createData.customSeasonalityList) {
				const validCustomSeasonalityData =
					ProphetAnalyticsRequestConfigDataUtils.validCustomSeasonalityData(customSeasonalityData);

				if (!validCustomSeasonalityData.valid) {
					return validCustomSeasonalityData;
				}
			}
		}

		if (createData.holidaysCountry) {
			if (
				!Object.keys(ProphetAnalyticsConfigEnum.holidaysCountry).includes(
					createData.holidaysCountry
				)
			) {
				LoggingUtils.error(methodName, 'holidaysCountry is wrong ' + createData.holidaysCountry);
				return {
					valid: false,
					message: 'holidaysCountry is wrong ' + createData.holidaysCountry
				};
			}
		}

		if (
			createData.holidaysCountry ||
			(createData.holidaysList && createData.holidaysList.length > 0)
		) {
			if (!createData.holidaysPriorScale) {
				LoggingUtils.error(methodName, 'holidaysPriorScale is empty');
				return {
					valid: false,
					message: 'holidaysPriorScale is empty'
				};
			}

			if (!createData.holidaysMode) {
				LoggingUtils.error(methodName, 'holidaysMode is empty');
				return {
					valid: false,
					message: 'holidaysMode is empty'
				};
			}
		}

		if (createData.holidaysMode) {
			if (!Object.keys(ProphetAnalyticsConfigEnum.mode).includes(createData.holidaysMode)) {
				LoggingUtils.error(methodName, 'holidaysMode is wrong ' + createData.holidaysMode);
				return {
					valid: false,
					message: 'holidaysMode is wrong ' + createData.holidaysMode
				};
			}
		}

		if (createData.mcmcSamples < 0) {
			LoggingUtils.error(methodName, 'mcmcSamples is wrong ' + createData.mcmcSamples);
			return {
				valid: false,
				message: 'mcmcSamples is wrong ' + createData.mcmcSamples
			};
		}

		if (createData.intervalWidth < 0) {
			LoggingUtils.error(methodName, 'intervalWidth is wrong ' + createData.intervalWidth);
			return {
				valid: false,
				message: 'intervalWidth is wrong ' + createData.intervalWidth
			};
		}

		if (createData.uncertaintySamples < 0) {
			LoggingUtils.error(
				methodName,
				'uncertaintySamples is wrong ' + createData.uncertaintySamples
			);
			return {
				valid: false,
				message: 'uncertaintySamples is wrong ' + createData.uncertaintySamples
			};
		}

		if (
			!createData.scaling ||
			!Object.keys(ProphetAnalyticsConfigEnum.scaling).includes(createData.scaling)
		) {
			LoggingUtils.error(methodName, 'scaling is wrong ' + createData.scaling);
			return {
				valid: false,
				message: 'scaling is wrong ' + createData.scaling
			};
		}

		return { valid: true, message: '' };
	},
	validUpdateData: (
		updateData: ProphetAnalyticsRequestConfigUpdateData
	): {
		valid: boolean;
		message: string;
	} => {
		const methodName = 'ProphetAnalyticsRequestConfigDataUtils.validUpdateData';

		if (!updateData) {
			LoggingUtils.error(methodName, 'updateData is empty');
			return {
				valid: false,
				message: 'updateData is empty'
			};
		}

		if (!updateData.id) {
			LoggingUtils.error(methodName, 'id is empty');
			return {
				valid: false,
				message: 'id is empty'
			};
		}

		return ProphetAnalyticsRequestConfigDataUtils.validRequestData(updateData);
	},
	validCustomSeasonalityData: (
		customSeasonalityData: ProphetAnalyticsCustomSeasonalityData | undefined
	): {
		valid: boolean;
		message: string;
	} => {
		const methodName = 'ProphetAnalyticsRequestConfigDataUtils.validCustomSeasonalityData';

		if (!customSeasonalityData) {
			LoggingUtils.error(methodName, 'customSeasonalityData is empty');
			return {
				valid: false,
				message: 'customSeasonalityData is empty'
			};
		}

		if (!customSeasonalityData.name) {
			LoggingUtils.error(methodName, 'name is empty');
			return {
				valid: false,
				message: 'name is empty'
			};
		}

		if (
			!customSeasonalityData.period ||
			!CurrentNumberUtils.isNumber(customSeasonalityData.period)
		) {
			LoggingUtils.error(methodName, 'period is wrong');
			return {
				valid: false,
				message: 'period is wrong'
			};
		}

		if (
			!customSeasonalityData.mode ||
			!Object.keys(ProphetAnalyticsConfigEnum.mode).includes(customSeasonalityData.mode)
		) {
			LoggingUtils.error(methodName, 'mode is wrong');
			return {
				valid: false,
				message: 'mode is wrong'
			};
		}

		if (
			!customSeasonalityData.fourierOrder ||
			!CurrentNumberUtils.isNumber(customSeasonalityData.fourierOrder)
		) {
			LoggingUtils.error(methodName, 'fourierOrder is wrong');
			return {
				valid: false,
				message: 'fourierOrder is wrong'
			};
		}

		return { valid: true, message: '' };
	}
};
