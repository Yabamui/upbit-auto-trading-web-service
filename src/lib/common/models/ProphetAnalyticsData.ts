import type { ProphetAnalyticsResultData } from '$lib/common/models/ProphetAnalyticsResultData';
import type { ProphetAnalyticsResultItemData } from '$lib/common/models/ProphetAnalyticsResultItemData';

export interface ProphetAnalyticsResultAndItemData {
	result: ProphetAnalyticsResultData;
	resultItemList: ProphetAnalyticsResultItemData[];
}