import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import { MarketCurrencyTypeUtils } from '$lib/common/enums/MarketCurrencyType';
import { ProphetAnalyticsSchedulerEnum } from '$lib/common/enums/ProphetAnalyticsSchedulerEnum';
import {
	ProphetAnalyticsPriceTypeEnum,
	ProphetAnalyticsPriceTypeEnumUtils
} from '$lib/common/enums/ProphetAnalyticsPriceTypeEnum';

export interface ProphetAnalyticsRequestSchedulerData {
	id: number;
	userId: number;
	marketCurrency: string;
	candleUnit: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;

	includeExclude: string;
	marketList: string[] | undefined;
	priceTypeList: string[] | undefined;

	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}

export interface ProphetAnalyticsRequestSchedulerCreateData {
	marketCurrency: string;
	candleUnit: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;
	
	includeExclude: string;
	marketList: string[] | undefined;
	priceTypeList: string[] | undefined;
}

export interface ProphetAnalyticsRequestSchedulerUpdateData {
	id: number;
	marketCurrency: string;
	candleUnit: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;
	
	includeExclude: string;
	marketList: string[] | undefined;
	priceTypeList: string[] | undefined;
}

export const ProphetAnalyticsRequestSchedulerDataUtils = {
	validCreateData: (
		createData:
			| ProphetAnalyticsRequestSchedulerCreateData
			| ProphetAnalyticsRequestSchedulerUpdateData
			| undefined
	): {
		valid: boolean;
		message: string;
	} => {
		if (!createData) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'createData is undefined'
			);
			return {
				valid: false,
				message: 'createData is undefined'
			};
		}

		if (
			!createData.marketCurrency ||
			MarketCurrencyTypeUtils.getMarketCurrencyType(createData.marketCurrency) === null
		) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'marketCurrency is undefined'
			);
			return {
				valid: false,
				message: 'marketCurrency is undefined'
			};
		}

		if (
			!createData.candleUnit ||
			(UPBitCandleUnitEnum.days.key !== createData.candleUnit &&
				UPBitCandleUnitEnum.hours.key !== createData.candleUnit)
		) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'candleUnit is undefined'
			);
			return {
				valid: false,
				message: 'candleUnit is undefined'
			};
		}

		if (createData.retryYn === undefined) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'retryYn is undefined'
			);
			return {
				valid: false,
				message: 'retryYn is undefined'
			};
		}

		if (!CurrentNumberUtils.isNumber(createData.executeHours)) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'executeHours is undefined'
			);
			return {
				valid: false,
				message: 'executeHours is undefined'
			};
		}

		if (!CurrentNumberUtils.isNumber(createData.executeMinutes)) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'executeMinutes is undefined'
			);
			return {
				valid: false,
				message: 'executeMinutes is undefined'
			};
		}

		if (createData.executeYn === undefined) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'executeYn is undefined'
			);
			return {
				valid: false,
				message: 'executeYn is undefined'
			};
		}
		
		if (createData.includeExclude) {
			if (createData.includeExclude !== ProphetAnalyticsSchedulerEnum.include.key &&
				createData.includeExclude !== ProphetAnalyticsSchedulerEnum.exclude.key) {
				LoggingUtils.error(
					'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
					'includeExclude is undefined'
				);
				return {
					valid: false,
					message: 'includeExclude is undefined'
				};
			}
			
			if (!createData.marketList || createData.marketList.length === 0) {
				LoggingUtils.error(
					'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
					'marketList is undefined'
				);
				return {
					valid: false,
					message: 'marketList is undefined'
				};
			}
		}
		
		if (!createData.priceTypeList || createData.priceTypeList.length === 0 ||
			!ProphetAnalyticsPriceTypeEnumUtils.existYn(createData.priceTypeList)) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validCreateData',
				'priceTypeList is undefined'
			);
			return {
				valid: false,
				message: 'priceTypeList is undefined'
			};
		}

		return {
			valid: true,
			message: ''
		};
	},
	validUpdateData: (
		updateData: ProphetAnalyticsRequestSchedulerUpdateData | undefined
	): {
		valid: boolean;
		message: string;
	} => {
		if (!updateData) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validUpdateData',
				'updateData is undefined'
			);
			return {
				valid: false,
				message: 'updateData is undefined'
			};
		}

		if (!updateData.id) {
			LoggingUtils.error(
				'ProphetAnalyticsRequestSchedulerDataUtils.validUpdateData',
				'id is undefined'
			);
			return {
				valid: false,
				message: 'id is undefined'
			};
		}

		return ProphetAnalyticsRequestSchedulerDataUtils.validCreateData(updateData);
	}
};
