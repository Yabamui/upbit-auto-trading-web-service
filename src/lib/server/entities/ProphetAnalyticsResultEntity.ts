import type { ProphetAnalyticsResultData } from '$lib/common/models/ProphetAnalyticsResultData';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';

export interface ProphetAnalyticsResultEntity {
	id: number;
	user_id: number;
	request_id: number;
	market: string;
	candle_unit: string;
	candle_count: number;
	candle_time_zone: string;
	begin_candle_date_time: Date;
	end_candle_date_time: Date;

	changepoint_date_time_array: string[] | undefined;
	
	error_rate_avg: number | undefined;
	positive_error_rate_avg: number | undefined;
	negative_error_rate_avg: number | undefined
	
	price_type: string;

	created_at: Date;
	updated_at: Date;
	deleted_at: Date | undefined;
}

export const ProphetAnalyticsResultEntityUtils = {
	toProphetAnalyticsResultData: (
		entity: ProphetAnalyticsResultEntity
	): ProphetAnalyticsResultData => {
		return {
			id: entity.id,
			userId: entity.user_id,
			requestId: entity.request_id,
			market: entity.market,
			candleUnit: entity.candle_unit,
			candleCount: entity.candle_count,
			candleTimeZone: entity.candle_time_zone,
			beginCandleDateTime: entity.begin_candle_date_time,
			endCandleDateTime: entity.end_candle_date_time,
			changepointDateTimeList: entity.changepoint_date_time_array,
			errorRateAvg: entity.error_rate_avg,
			positiveErrorRateAvg: entity.positive_error_rate_avg,
			negativeErrorRateAvg: entity.negative_error_rate_avg,
			priceType: entity.price_type,
			createdAt: CurrentDateUtils.toFormatStringByDate(entity.created_at),
			updatedAt: CurrentDateUtils.toFormatStringByDate(entity.updated_at),
			deletedAt: CurrentDateUtils.toFormatStringByDate(entity.deleted_at)
		};
	}
};
