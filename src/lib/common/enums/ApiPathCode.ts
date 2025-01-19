export const ApiPathCode = {
	marketAll: {
		path: 'all',
		fullPath: '/api/market/all',
		description: '전체 마켓 정보를 조회합니다.'
	},
	marketInfo: {
		path: 'info',
		fullPath: '/api/market/info',
		description: '특정 마켓 정보를 조회합니다.'
	},

	tickerCurrency: {
		path: 'currency',
		fullPath: '/api/ticker/currency',
		description: '마켓 단위 현재가 정보'
	},
	tickerMarketCode: {
		path: 'market',
		fullPath: '/api/ticker/market',
		description: '마켓 코드별 현재가 정보'
	},

	candleList: {
		path: 'list',
		fullPath: '/api/candle/list',
		description: '캔들 정보'
	},
	candleDaysUpdate: {
		path: 'days-update',
		fullPath: '/api/candle/days-update',
		description: '일 단위 캔들 정보 업데이트'
	},

	userLogin: {
		path: 'login',
		fullPath: '/api/user/login',
		description: '로그인'
	},
	userRegister: {
		path: 'register',
		fullPath: '/api/user/register',
		description: '회원가입'
	},
	userLogout: {
		path: 'logout',
		fullPath: '/api/user/logout',
		description: '로그아웃'
	},

	aiAnalyticsAiModelList: {
		path: 'ai-model-list',
		fullPath: '/api/ai-analytics/ai-model-list',
		description: 'AI 분석 모델 리스트'
	},
	aiAnalyticsAiResponsesList: {
		path: 'ai-responses-list',
		fullPath: '/api/ai-analytics/ai-responses-list',
		description: 'AI 분석 응답 리스트'
	},
	aiAnalyticsAiResponseDelete: {
		path: 'ai-response-delete',
		fullPath: '/api/ai-analytics/ai-response-delete',
		description: 'AI 분석 응답 삭제'
	},
	aiAnalyticsAiResponsesTodayInference: {
		path: 'ai-responses-today-inference',
		fullPath: '/api/ai-analytics/ai-responses-today-inference',
		description: 'AI 분석 응답 오늘 추론'
	},
	aiAnalyticsAiResponseModelsList: {
		path: 'ai-response-models-list',
		fullPath: '/api/ai-analytics/ai-response-models-list',
		description: 'AI 분석 응답 모델 리스트'
	},
	aiAnalyticsAiPromptsList: {
		path: 'ai-prompts-list',
		fullPath: '/api/ai-analytics/ai-prompts-list',
		description: 'AI 분석 프롬프트 리스트'
	},
	aiAnalyticsAiPromptsCreate: {
		path: 'ai-prompts-create',
		fullPath: '/api/ai-analytics/ai-prompts-create',
		description: 'AI 분석 프롬프트 생성'
	},
	aiAnalyticsAiPromptsUpdate: {
		path: 'ai-prompts-update',
		fullPath: '/api/ai-analytics/ai-prompts-update',
		description: 'AI 분석 프롬프트 업데이트'
	},
	aiAnalyticsRequest: {
		path: 'request',
		fullPath: '/api/ai-analytics/request',
		description: 'AI 분석 요청'
	}
};

export type ApiPathCodeData = (typeof ApiPathCode)[keyof typeof ApiPathCode];

export const ApiPathCodeUtils = {
	getUrl: (apiPathCode: ApiPathCodeData, params: string = '') => {
		if (params) {
			return `${apiPathCode.fullPath}?${params}`;
		}

		return apiPathCode.fullPath;
	}
};
