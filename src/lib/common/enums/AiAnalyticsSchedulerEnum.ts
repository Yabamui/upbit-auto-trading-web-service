export interface AiAnalyticsSchedulerEnumData {
	key: string;
	name: string;
}

export const AiAnalyticsSchedulerEnum = {
	include: {
		key: 'INCLUDE',
		name: '포함'
	},
	exclude: {
		key: 'EXCLUDE',
		name: '제외'
	}
}

export const AiAnalyticsSchedulerEnumUtils = {
	existYn: (key: string) => {
		return Object.values(AiAnalyticsSchedulerEnum)
			.some((item: AiAnalyticsSchedulerEnumData): boolean => {
				return item.key === key;
			});
	}
}