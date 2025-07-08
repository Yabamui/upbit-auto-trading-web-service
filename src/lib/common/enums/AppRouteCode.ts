export const AppRouteCode = {
	Home: {
		href: '/',
		name: '홈',
	},
	Trade: {
		href: '/trade',
		name: '거래',
	},
	Login: {
		href: '/login',
		name: '로그인',
	},
	AiAnalytics: {
		href: '/ai-analytics',
		name: 'AI 분석',
	},
	ProphetAnalytics: {
		href: '/prophet-analytics',
		name: 'Prophet 분석',
	},
}

export type AppRouteCode = typeof AppRouteCode[keyof typeof AppRouteCode];

export const AppRouteCodeUtils = {
	getNavList: () => {
		return [
			AppRouteCode.Trade,
			AppRouteCode.AiAnalytics,
			AppRouteCode.ProphetAnalytics,
		];
	}
}