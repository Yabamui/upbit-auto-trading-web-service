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
	candleSavedList: {
		path: 'saved-list',
		fullPath: '/api/candle/saved-list',
		description: '저장된 캔들 정보'
	},
	candleSavedListByMarketCurrency: {
		path: 'saved-list-by-market-currency',
		fullPath: '/api/candle/saved-list-by-market-currency',
		description: '저장된 캔들 정보 - 마켓/화폐'
	},
	candleDaysUpdate: {
		path: 'days-update',
		fullPath: '/api/candle/days-update',
		description: '일 단위 캔들 정보 업데이트'
	},
	candleTechnicalIndicatorAnalyze: {
		path: 'technical-indicator-analyze',
		fullPath: '/api/candle/technical-indicator-analyze',
		description: '기술적 지표 분석'
	},

	orderBook: {
		path: 'list',
		fullPath: '/api/order-book/list',
		description: '호가 정보'
	},
	orderBookSupportedLevel: {
		path: 'supported-level',
		fullPath: '/api/order-book/supported-level',
		description: '호가 모아보기 단위 정보 조회'
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
	aiAnalyticsAiResponses: {
		path: 'ai-responses',
		fullPath: '/api/ai-analytics/ai-responses',
		description: 'AI 분석 응답'
	},
	aiAnalyticsAiResponsesList: {
		path: 'ai-responses-list',
		fullPath: '/api/ai-analytics/ai-responses-list',
		description: 'AI 분석 응답 리스트'
	},
	aiAnalyticsAiLatestInferenceList: {
		path: 'ai-latest-inference-list',
		fullPath: '/api/ai-analytics/ai-latest-inference-list',
		description: 'AI 분석 최신 추론 리스트'
	},
	aiAnalyticsAiResponseDelete: {
		path: 'ai-response-delete',
		fullPath: '/api/ai-analytics/ai-response-delete',
		description: 'AI 분석 응답 삭제'
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
	aiAnalyticsAiPromptsDelete: {
		path: 'ai-prompts-delete',
		fullPath: '/api/ai-analytics/ai-prompts-delete',
		description: 'AI 분석 프롬프트 삭제'
	},
	aiAnalyticsResponsesCreate: {
		path: 'responses-create',
		fullPath: '/api/ai-analytics/responses-create',
		description: 'AI 분석 응답 생성'
	},
	aiAnalyticsRequestSchedulerList: {
		path: 'request-scheduler-list',
		fullPath: '/api/ai-analytics/request-scheduler-list',
		description: 'AI 분석 요청 스케줄러 리스트',
	},
	aiAnalyticsRequestSchedulerCreate: {
		path: 'request-scheduler-create',
		fullPath: '/api/ai-analytics/request-scheduler-create',
		description: 'AI 분석 요청 스케줄러 생성',
	},
	aiAnalyticsRequestSchedulerUpdate: {
		path: 'request-scheduler-update',
		fullPath: '/api/ai-analytics/request-scheduler-update',
		description: 'AI 분석 요청 스케줄러 수정',
	},
	aiAnalyticsRequestSchedulerDelete: {
		path: 'request-scheduler-delete',
		fullPath: '/api/ai-analytics/request-scheduler-delete',
		description: 'AI 분석 요청 스케줄러 삭제',
	},

	prophetAnalyticsRequestList: {
		path: 'request-list',
		fullPath: '/api/prophet-analytics/request-list',
		description: 'Prophet 분석 요청 리스트'
	},
	prophetAnalyticsRequestCreate: {
		path: 'request-create',
		fullPath: '/api/prophet-analytics/request-create',
		description: 'Prophet 분석 요청 생성'
	},
	prophetAnalyticsRequestCompleteCheck: {
		path: 'request-complete-check',
		fullPath: '/api/prophet-analytics/request-complete-check',
		description: 'Prophet 분석 요청 완료 확인'
	},
	prophetAnalyticsResult: {
		path: 'result',
		fullPath: '/api/prophet-analytics/result',
		description: 'Prophet 분석 결과'
	},
	prophetAnalyticsResultByRequestId: {
		path: 'result-by-request-id',
		fullPath: '/api/prophet-analytics/result-by-request-id',
		description: 'Prophet 분석 결과 - 요청 ID',
	},
	prophetAnalyticsResultLatestList: {
		path: 'result-latest-list',
		fullPath: '/api/prophet-analytics/result-latest-list',
		description: 'Prophet 분석 결과 리스트'
	},
	prophetAnalyticsLatestResultItemList: {
		path: 'latest-result-item-list',
		fullPath: '/api/prophet-analytics/latest-result-item-list',
		description: 'Prophet 분석 최신 결과 아이템 리스트'
	},
	prophetAnalyticsResultDelete: {
		path: 'result-delete',
		fullPath: '/api/prophet-analytics/result-delete',
		description: 'Prophet 분석 결과 삭제'
	},
	prophetAnalyticsRequestConfigList: {
		path: 'request-config-list',
		fullPath: '/api/prophet-analytics/request-config-list',
		description: 'Prophet 분석 요청 설정 리스트'
	},
	prophetAnalyticsRequestConfigCreate: {
		path: 'request-config-create',
		fullPath: '/api/prophet-analytics/request-config-create',
		description: 'Prophet 분석 요청 설정 생성'
	},
	prophetAnalyticsRequestConfigCreateNotExistMarket: {
		path: 'request-config-create-not-exist-market',
		fullPath: '/api/prophet-analytics/request-config-create-not-exist-market',
		description: 'Prophet 분석 요청 설정 생성 - 마켓'
	},
	prophetAnalyticsRequestConfigUpdate: {
		path: 'request-config-update',
		fullPath: '/api/prophet-analytics/request-config-update',
		description: 'Prophet 분석 요청 설정 수정'
	},

	prophetAnalyticsRequestSchedulerList: {
		path: 'request-scheduler-list',
		fullPath: '/api/prophet-analytics/request-scheduler-list',
		description: 'Prophet 분석 요청 스케줄러 리스트'
	},
	prophetAnalyticsRequestSchedulerCreate: {
		path: 'request-scheduler-create',
		fullPath: '/api/prophet-analytics/request-scheduler-create',
		description: 'Prophet 분석 요청 스케줄러 생성'
	},
	prophetAnalyticsRequestSchedulerUpdate: {
		path: 'request-scheduler-update',
		fullPath: '/api/prophet-analytics/request-scheduler-update',
		description: 'Prophet 분석 요청 스케줄러 수정'
	},
	prophetAnalyticsRequestSchedulerDelete: {
		path: 'request-scheduler-delete',
		fullPath: '/api/prophet-analytics/request-scheduler-delete',
		description: 'Prophet 분석 요청 스케줄러 삭제'
	},
	
	newsFeedScrapResultList: {
		path: 'list',
		fullPath: '/api/news-feed-scrap-result/list',
		description: '뉴스 피드 스크랩 결과 리스트'
	},
	newsFeedScrapResultAiSummaryList: {
		path: 'ai-summary-list',
		fullPath: '/api/news-feed-scrap-result/ai-summary-list',
		description: '뉴스 피드 스크랩 AI 요약 리스트'
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
