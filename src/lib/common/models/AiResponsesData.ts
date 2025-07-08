import { AIModelCodeDataUtils } from '$lib/common/enums/AIModelCode';
import { UPBitCandleEnumUtils } from '$lib/common/enums/UPBitCandleEnum';

export interface AiResponsesData {
	id: number;
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	aiResponseModesId: number | null;
	response: object;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	candleDateTimeBegin: string;
	candleDateTimeEnd: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

export interface AiInferenceData {
	aiResponsesCreatedAt: string;
	market: string;
	aiResponsesId: number;
	aiModelId: number;
	aiPromptsId: number;
	aiResponseModesId: number | null;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	candleDateTimeBegin: string;
	candleDateTimeEnd: string;
	totalJudgement: string;
	totalJudgementKr: string;

	itemList: AiInferenceItemData[];
}

export interface AiInferenceItemData {
	dateTime: string;
	openPrice: number;
	highPrice: number;
	lowPrice: number;
	closePrice: number;
	evaluation: string;
	judgementBasis: string;
	judgementBasisKr: string;
}

export interface AiResponsesCreateRequestData {
	market: string;
	aiCode: string;
	aiModelId: number;
	aiPromptsId: number;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
}

export interface AiLatestInferenceData {
	id: number;
	userId: number;
	market: string;
	aiModelId: number;
	aiPromptsId: number;
	aiResponseModesId: number;
	candleUnit: string;
	candleCount: number;
	candleTimeZone: string;
	candleDateTimeBegin: string;
	candleDateTimeEnd: string;
	createdAt: string;
	updatedAt: string;
	totalJudgement: string;
	totalJudgementKr: string;
	dateTime: string;
	lowPrice: number;
	highPrice: number;
	openPrice: number;
	closePrice: number;
	evaluation: string;
	judgementBasis: string;
	judgementBasisKr: string;
}

export const AiResponsesDataUtils = {
	validCreateData: (
		data: AiResponsesCreateRequestData
	): {
		valid: boolean;
		message: string;
	} => {
		if (!data) {
			return {
				valid: false,
				message: 'Invalid data'
			};
		}

		if (!data.market) {
			return {
				valid: false,
				message: 'Invalid market'
			};
		}

		if (!data.aiCode || !AIModelCodeDataUtils.existAiModelCode(data.aiCode)) {
			return {
				valid: false,
				message: 'Invalid AI code'
			};
		}

		if (!data.aiModelId) {
			return {
				valid: false,
				message: 'Invalid AI model ID'
			};
		}

		if (!data.aiPromptsId) {
			return {
				valid: false,
				message: 'Invalid AI prompts ID'
			};
		}

		if (!data.candleUnit || !UPBitCandleEnumUtils.existCandleUnitYn(data.candleUnit)) {
			return {
				valid: false,
				message: 'Invalid candle unit'
			};
		}

		if (!data.candleCount) {
			return {
				valid: false,
				message: 'Invalid candle count'
			};
		}

		if (!data.candleTimeZone || !UPBitCandleEnumUtils.existCandleTimeZoneYn(data.candleTimeZone)) {
			return {
				valid: false,
				message: 'Invalid candle time zone'
			};
		}

		return {
			valid: true,
			message: ''
		};
	}
};
