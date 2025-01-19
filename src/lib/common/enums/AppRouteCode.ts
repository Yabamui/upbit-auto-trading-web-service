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
	Analytics: {
		href: '/analytics',
		name: '분석',
	},
	Test: {
		href: '/test',
		name: 'UI 테스트',
	},
}

export type AppRouteCode = typeof AppRouteCode[keyof typeof AppRouteCode];

export const AppRouteCodeUtils = {
	getNavList: () => {
		return [
			AppRouteCode.Trade,
			AppRouteCode.Analytics
		];
	}
}