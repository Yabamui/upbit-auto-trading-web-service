import { AiAnalyticsSchedulerEnumUtils } from '$lib/common/enums/AiAnalyticsSchedulerEnum';
import {
	UPBitCandleEnumUtils,
	UPBitCandleTimeZones,
	UPBitCandleUnitEnum
} from '$lib/common/enums/UPBitCandleEnum';
import { MarketCurrencyCode, MarketCurrencyTypeUtils } from '$lib/common/enums/MarketCurrencyType';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import { AIModelCode } from '$lib/common/enums/AIModelCode';

export interface AiAnalyticsRequestSchedulerData {
	id: number;
	userId: number;
	aiModelId: number;
	marketCurrency: string;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;
	includeExclude: string | undefined;
	marketList: string[] | undefined;
	aiPromptsId: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | undefined;
}

export interface AiAnalyticsRequestSchedulerCreateData {
	aiModelId: number;
	marketCurrency: string;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;
	includeExclude: string | undefined;
	marketList: string[] | undefined;
	aiPromptsId: number;
}

export interface AiAnalyticsRequestSchedulerUpdateData {
	id: number;
	aiModelId: number;
	marketCurrency: string;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	retryYn: boolean;
	executeHours: number;
	executeMinutes: number;
	executeYn: boolean;
	includeExclude: string | undefined;
	marketList: string[] | undefined;
	aiPromptsId: number;
}

export interface AiAnalyticsRequestSchedulerValidResultData {
	valid: boolean;
	message: string;
}

export interface AiAnalyticsRequestSchedulerFormData {
	ai: string;
	aiModelId: string;
	schedulerId: string;
	marketCurrency: string;
	includeExclude: string;
	marketList: string[];
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	retryYn: string;
	executeHours: number;
	executeMinutes: number;
	aiPromptsId: string;
}

export const AiAnalyticsRequestSchedulerDataUtils = {
	getFormDataByDefault: (): AiAnalyticsRequestSchedulerFormData => {
		const nowDateTime = new Date();
		return {
			ai: AIModelCode.GEMINI.code,
			aiModelId: '',
			schedulerId: '',
			marketCurrency: MarketCurrencyCode.KRW.code,
			includeExclude: '',
			marketList: [],
			candleUnit: UPBitCandleUnitEnum.days.key,
			candleCount: 200,
			candleTimeZone: UPBitCandleTimeZones.utc,
			retryYn: 'true',
			executeHours: nowDateTime.getHours(),
			executeMinutes: nowDateTime.getMinutes(),
			aiPromptsId: ''
		};
	},
	getFormData: (
		ai: string,
		schedulerData: AiAnalyticsRequestSchedulerData
	): AiAnalyticsRequestSchedulerFormData => {
		return {
			ai: ai,
			aiModelId: String(schedulerData.aiModelId),
			schedulerId: String(schedulerData.id),
			marketCurrency: schedulerData.marketCurrency,
			includeExclude: schedulerData.includeExclude || '',
			marketList: schedulerData.marketList || [],
			candleUnit: schedulerData.candleUnit,
			candleCount: schedulerData.candleCount,
			candleTimeZone: schedulerData.candleTimeZone,
			retryYn: String(schedulerData.retryYn),
			executeHours: schedulerData.executeHours,
			executeMinutes: schedulerData.executeMinutes,
			aiPromptsId: String(schedulerData.aiPromptsId)
		};
	},
	getCreateData: (
		formData: AiAnalyticsRequestSchedulerFormData
	): AiAnalyticsRequestSchedulerCreateData => {
		return {
			aiModelId: Number(formData.aiModelId),
			marketCurrency: formData.marketCurrency,
			candleUnit: formData.candleUnit,
			candleCount: formData.candleCount,
			candleTimeZone: formData.candleTimeZone,
			retryYn: formData.retryYn === 'true',
			executeHours: formData.executeHours,
			executeMinutes: formData.executeMinutes,
			executeYn: false,
			includeExclude: formData.includeExclude,
			marketList: formData.marketList,
			aiPromptsId: Number(formData.aiPromptsId)
		};
	},
	getUpdateData: (
		formData: AiAnalyticsRequestSchedulerFormData
	): AiAnalyticsRequestSchedulerUpdateData => {
		return {
			id: Number(formData.schedulerId),
			aiModelId: Number(formData.aiModelId),
			marketCurrency: formData.marketCurrency,
			candleUnit: formData.candleUnit,
			candleCount: formData.candleCount,
			candleTimeZone: formData.candleTimeZone,
			retryYn: formData.retryYn === 'true',
			executeHours: formData.executeHours,
			executeMinutes: formData.executeMinutes,
			executeYn: false,
			includeExclude: formData.includeExclude,
			marketList: formData.marketList,
			aiPromptsId: Number(formData.aiPromptsId)
		};
	},
	validCreateData: (
		createData:
			| AiAnalyticsRequestSchedulerCreateData
			| AiAnalyticsRequestSchedulerUpdateData
			| undefined
	): AiAnalyticsRequestSchedulerValidResultData => {
		if (!createData) {
			return {
				valid: false,
				message: 'createData is undefined'
			};
		}

		if (!createData.aiModelId) {
			return {
				valid: false,
				message: 'aiModelId is undefined'
			};
		}

		if (!createData.marketCurrency || !MarketCurrencyTypeUtils.existYn(createData.marketCurrency)) {
			return {
				valid: false,
				message: 'marketCurrency is undefined'
			};
		}

		if (createData.includeExclude) {
			if (!AiAnalyticsSchedulerEnumUtils.existYn(createData.includeExclude)) {
				return {
					valid: false,
					message: 'includeExclude is undefined'
				};
			}

			if (!createData.marketList || createData.marketList.length === 0) {
				return {
					valid: false,
					message: 'marketList is undefined'
				};
			}
		}

		if (!createData.candleUnit || !UPBitCandleEnumUtils.existCandleUnitYn(createData.candleUnit)) {
			return {
				valid: false,
				message: 'candleUnit is undefined'
			};
		}

		if (!createData.candleCount || createData.candleCount > 200) {
			return {
				valid: false,
				message: 'candleCount is undefined'
			};
		}

		if (
			!createData.candleTimeZone ||
			!UPBitCandleEnumUtils.existCandleTimeZoneYn(createData.candleTimeZone)
		) {
			return {
				valid: false,
				message: 'candleTimeZone is undefined'
			};
		}

		if (!CurrentNumberUtils.isNumber(createData.executeHours)) {
			return {
				valid: false,
				message: 'executeHours is undefined'
			};
		}

		if (!CurrentNumberUtils.isNumber(createData.executeMinutes)) {
			return {
				valid: false,
				message: 'executeMinutes is undefined'
			};
		}

		if (!createData.aiPromptsId) {
			return {
				valid: false,
				message: 'aiPromptsId is undefined'
			};
		}

		return {
			valid: true,
			message: ''
		};
	},
	validUpdateData: (
		data: AiAnalyticsRequestSchedulerUpdateData | undefined
	): AiAnalyticsRequestSchedulerValidResultData => {
		if (!data) {
			return {
				valid: false,
				message: 'data is undefined'
			};
		}

		if (!data.id) {
			return {
				valid: false,
				message: 'id is undefined'
			};
		}

		return AiAnalyticsRequestSchedulerDataUtils.validCreateData(data);
	}
};
