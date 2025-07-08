import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';

export const ProphetAnalyticsConfigEnum = {
	growth: {
		linear: 'linear',
		logistic: 'logistic'
	},
	mode: {
		additive: 'additive',
		multiplicative: 'multiplicative'
	},
	holidaysCountry: {
		US: 'US',
		KR: 'KR'
	},
	scaling: {
		absmax: 'absmax',
		minmax: 'minmax'
	},
	seasonalityValue: {
		auto: 'auto',
		true: 'True',
		false: 'False',
		number: 'Number'
	},
	seasonalityCustomName: {
		yearly: 'yearly',
		weekly: 'weekly',
		daily: 'daily',
		monthly: 'monthly'
	},
	regressor: {
		volume: 'volume',
		atr: 'atr',
		rss: 'rss',
		macd: 'macd',
		bollingerBand: 'bollingerBand',
	},
	
	defaultData: {
		market: '',
		candleTimeZone: UPBitCandleTimeZones.utc,
		beginCandleDateTime: undefined,
		endCandleDateTime: undefined,

		growth: 'linear',
		exportPeriod: 30,
		cap: 0,
		floor: 0,

		changepointList: [],
		changepointPriorScale: 0.05,
		changepointNumber: 25,
		changepointRange: 0.95,

		holidaysCountry: 'US',
		holidaysList: [
			'2025-03-02',
			'2025-02-24',
			'2025-02-02',
			'2025-01-20',
			'2024-11-05',
			'2021-01-20',
			'2020-11-03',
			'2017-01-20',
			'2016-11-08',
			'2013-01-20',
			'2012-11-06'
		],
		holidaysPriorScale: 0.01,
		holidaysMode: 'additive',

		seasonalityMode: 'additive',
		seasonalityPriorScale: 0.01,
		yearlySeasonality: 'auto',
		weeklySeasonality: 'auto',
		dailySeasonality: 'auto',
		monthlySeasonality: undefined,
		customSeasonalityList: [
			{
				name: 'monthly',
				period: 30.5,
				mode: 'additive',
				fourierOrder: 5
			}
		],
		regressor: {
			volume: true,
			atr: true,
			rsi: true,
			macd: true,
			bollingerBand: true
		},
		mcmcSamples: 0,
		intervalWidth: 0.8,
		uncertaintySamples: 1000,
		stanBackend: undefined,
		scaling: 'absmax'
	}
} as const;

export const ProphetAnalyticsConfigDescriptionEnum = {
	growth: [
		"String 'linear', 'logistic' or 'flat' to specify a linear, logistic or flat trend",
		'linear : 선형적으로 증가, 데이터가 일정한 증가 또는 감소 추세를 보이는 경우(EX: 주식 가격, 환율, 판매량 등)',
		'- 장점 : 간단한 설정으로 대부분의 데이터에 적합, 모델링과 해석이 직관적',
		'- 단점 : 제한이 없기 때문에 포화(saturation)나 극단적인 변화를 잘 반영하지 못함',
		'logistic : 로지스틱 성장 모델, 데이터의 성장 또는 감소가 특정 한계(포화점)에 접근하며 점진적으로 변화하는 경우(EX: 심리적 저항선, 기술적 지지선 등)',
		'- cap(최대값) 및 floor(최소값) 매개변수를 설정 필요',
		'- 장점 : 현실적으로 한계값을 가질 가능성이 있는 데이터에 적합, 특정 구간에서의 변화율을 더 잘 반영함',
		'- 단점 : cap(최대값) 및 floor(최소값)을 적절히 설정해야 하므로, 추가적인 도메인 지식이 필요, 데이터가 제한 없이 증가하거나 감소할 경우 부적합'
	],
	changepointList: [
		'Value: list of dates (YYYY-MM-DD)',
		'잠재적 변경점 후보 날짜 목록.',
		'해당 정보를 입력하면 changepointRange, changepointNumber 는 무시됩니다.'
	],
	changepointRange: [
		'Value: float, default: 0.8, range: [0, 1]',
		'**잠재적 변경점 후보(changepoints)**를 배치할 데이터의 구간을 제어하는 변수',
		'추세 변화가 발생할 가능성이 있다고 판단하는 데이터를 어디까지 고려할지를 결정, {value}% 구간에만 변경점 후보를 균등하게 배치'
	],
	changepointNumber: [
		'Value: number, default: 25',
		'changepointList 가 입력된다면 changepointNumber 는 무시됩니다.',
		"추세(trend)의 변화가 발생할 수 있는 '잠재적인 변화 지점(changepoints)'의 개수를 지정",
		'자동으로 특정 지점에서 추세가 변화한다고 판단하며, 이러한 추세 변화를 탐지하기 위해 사용할 수 있는 최대 지점의 수',
		'기본값 25 : 대부분의 데이터에 잘 작동하므로, 초기에 기본값을 사용하고 결과를 평가',
		'작은 값 (예: 5~10): 추세 변화가 적고, 데이터가 전체적으로 부드럽고 단순한 경우 적합, 과적합(overfitting)을 방지',
		'큰 값 (예: 50~100 이상): 데이터에 급격한 변화가 자주 발생할 것으로 예상되거나, 매우 복잡한 데이터를 학습해야 할 때 적합, 과적합 가능성',
		'0 : 추세 변화를 허용하지 않고, 단일 추세로 데이터를 모델링'
	],

	seasonalityMode: [
		"Value: 'additive' or 'multiplicative', default: 'additive'",
		'계절성(seasonality)의 변동 방식을 제어',
		'해당 설정은 yearlySeasonality, weeklySeasonality, dailySeasonality, monthlySeasonality 에 영향을 줌',
		'customSeasonality 에서 mode 가 None 이면 seasonalityMode 를 따름',
		'additive: 안정적인 데이터, 변화폭이 일정한 경우(EX: 기온, 강수량, 평균적인 수요 변화 등)',
		'multiplicative: 급격한 변화, 데이터 크기에 비례한 경우(EX: 주식 가격, 환율, 판매량 등)'
	],
	seasonalityPriorScale: [
		'Parameter modulating the strength of the seasonality model.',
		'Larger values allow the model to fit larger seasonal fluctuations, smaller values dampen the seasonality.',
		'Can be specified for individual seasonalities using add_seasonality.'
	],
	yearlySeasonality: [
		'Fit yearly seasonality.',
		"Value: 'auto', True, False, (a number of Fourier terms)",
		'yearly_seasonality=auto : Prophet은 기본적으로 데이터를 분석하여 자동으로 연간 계절성을 감지할 수 있습니다. 2년 이상의 기록이 있는 경우 연간 계절성을 활성화합니다.',
		'yearly_seasonality=True : 연도 단위로 유사한 가격 변동 패턴을 반복한다고 판단될 때 설정합니다.',
		'yearly_seasonality=False : 연간 패턴을 따르지 않고, 변동성이 계절과 무관하게 발생할 경우에는 비활성화하는 것이 좋습니다.(EX: 움직임이 정책, 경제 이벤트, 투자 심리 등 외부 요인에 크게 의존할 경우)',
		'yearly_seasonality=Number : fourier_order 설정, 연간 계절성을 모델링하는 데 사용할 Fourier 구성 요소의 수',
		'fourier_order > 5 : 세밀한 계절 패턴을 학습, 장점: 복잡한 계절 변동을 학습, 단점: 과적합 가능성',
		'fourier_order < 5 : 단순한 계절 패턴을 학습, 장점: 과적합을 방지, 단점: 복잡한 계절 변동을 놓칠 수 있음'
	],
	weeklySeasonality: [
		'Fit weekly seasonality.',
		"Value: 'auto', True, False, (a number of Fourier terms)",
		'weeklySeasonality=auto : Prophet은 기본적으로 데이터를 분석하여 자동으로 주간 계절성을 감지할 수 있습니다. 2주 이상의 기록이 있는 경우 주간 계절성을 활성화합니다.',
		'weeklySeasonality=True : 주간 단위로 유사한 가격 변동 패턴을 반복한다고 판단될 때 설정합니다.',
		'weeklySeasonality=False : 주간 패턴을 따르지 않고, 변동성이 계절과 무관하게 발생할 경우에는 비활성화하는 것이 좋습니다.(EX: 움직임이 정책, 경제 이벤트, 투자 심리 등 외부 요인에 크게 의존할 경우)',
		'weeklySeasonality=Number : fourier_order 설정, 주간 계절성을 모델링하는 데 사용할 Fourier 구성 요소의 수',
		'fourier_order > 5 : 세밀한 계절 패턴을 학습, 장점: 복잡한 계절 변동을 학습, 단점: 과적합 가능성',
		'fourier_order < 5 : 단순한 계절 패턴을 학습, 장점: 과적합을 방지, 단점: 복잡한 계절 변동을 놓칠 수 있음'
	],
	dailySeasonality: [
		'Fit daily seasonality.',
		"Value: 'auto', True, False, (a number of Fourier terms)",
		'dailySeasonality=auto : Prophet은 기본적으로 데이터를 분석하여 자동으로 일간 계절성을 감지할 수 있습니다. 2일 이상의 기록이 있는 경우 일간 계절성을 활성화합니다.',
		'dailySeasonality=True : 일간 단위로 유사한 가격 변동 패턴을 반복한다고 판단될 때 설정합니다.',
		'dailySeasonality=False : 일간 패턴을 따르지 않고, 변동성이 계절과 무관하게 발생할 경우에는 비활성화하는 것이 좋습니다.(EX: 움직임이 정책, 경제 이벤트, 투자 심리 등 외부 요인에 크게 의존할 경우)',
		'dailySeasonality=Number : fourier_order 설정, 일간 계절성을 모델링하는 데 사용할 Fourier 구성 요소의 수',
		'fourier_order > 5 : 세밀한 계절 패턴을 학습, 장점: 복잡한 계절 변동을 학습, 단점: 과적합 가능성',
		'fourier_order < 5 : 단순한 계절 패턴을 학습, 장점: 과적합을 방지, 단점: 복잡한 계절 변동을 놓칠 수 있음'
	],
	customSeasonality: [
		'Add custom seasonality.',
		'Property : name, period, (a number of Fourier terms)',
		'name: 계절의 이름',
		'period: 계절의 년, 월, 일 수',
		"mode: None, 'additive', 'multiplicative', None이면 seasonalityMode 를 따름",
		'fourier_order: fourier_order 는 계절성을 모델링하는 데 사용할 Fourier 구성 요소의 수',
		'fourier_order > 5 : 세밀한 계절 패턴을 학습, 장점: 복잡한 계절 변동을 학습, 단점: 과적합 가능성',
		'fourier_order < 5 : 단순한 계절 패턴을 학습, 장점: 과적합을 방지, 단점: 복잡한 계절 변동을 놓칠 수 있음'
	],
	monthlySeasonality: [
		'Fit monthly seasonality.',
		'Value: (a number of Fourier terms)',
		'monthlySeasonality=Number : 월간 단위로 유사한 가격 변동 패턴을 반복한다고 판단될 때 설정합니다.',
		'monthlySeasonality= : 월간 패턴을 따르지 않고, 변동성이 계절과 무관하게 발생할 경우에는 비활성화하는 것이 좋습니다.(EX: 움직임이 정책, 경제 이벤트, 투자 심리 등 외부 요인에 크게 의존할 경우)'
	],
	holidays: [
		'pd.DataFrame with columns holiday (string) and ds (date type) and optionally columns lower_window and upper_window which specify a range of days around the date to be included as holidays.',
		'lower_window=-2 will include 2 days prior to the date as holidays.',
		'Also optionally can have a column prior_scale specifying the prior scale for that holiday.'
	],
	holidaysPriorScale: [
		'Parameter modulating the strength of the holiday components model, unless overridden in the holidays input.'
	],
	changepointPriorScale: [
		'Parameter modulating the flexibility of the automatic changepoint selection.',
		'Large values will allow many changepoints, small values will allow few changepoints.'
	],
	mcmcSamples: [
		'Integer, if greater than 0, will do full Bayesian inference with the specified number of MCMC samples.',
		'If 0, will do MAP estimation.'
	],
	intervalWidth: [
		'Float, width of the uncertainty intervals provided for the forecast.',
		'If mcmc_samples=0, this will be only the uncertainty  in the trend using the MAP estimate of the extrapolated generative model.',
		'If mcmc.samples>0, this will be integrated over all model parameters, which will include uncertainty in seasonality.'
	],
	uncertaintySamples: [
		'Number of simulated draws used to estimate uncertainty intervals.',
		'Settings this value to 0 or False will disable uncertainty estimation and speed up the calculation.'
	],
	stanBackend: [
		'str as defined in StanBackendEnum default: None - will try to iterate over all available backends and find the working one'
	],
	holidaysMode: ["'additive' or 'multiplicative'. Defaults to seasonality_mode."],
	linear:
		'선형적으로 증가' +
		'특징:\n' +
		'\n' +
		'데이터가 일정한 증가 또는 감소 추세를 보이는 경우 사용합니다.\n' +
		'기울기가 일정하며 제한 없이 증가하거나 감소합니다.\n' +
		'기본 설정이며, 별도의 추가 매개변수 없이 사용할 수 있습니다.\n' +
		'적합한 경우:\n' +
		'\n' +
		'주식 또는 가상화폐 가격이 비교적 안정적이고, 제한 없는 추세를 따를 때.\n' +
		'데이터에 급격한 변화(예: 포화, 급격한 하락 등)가 없는 경우.\n' +
		'장점:\n' +
		'\n' +
		'간단한 설정으로 대부분의 데이터에 적합.\n' +
		'모델링과 해석이 직관적.\n' +
		'단점:\n' +
		'\n' +
		'제한이 없기 때문에 포화(saturation)나 극단적인 변화를 잘 반영하지 못함.',
	logistic:
		'로지스틱 성장 모델' +
		'특징:\n' +
		'\n' +
		'데이터의 성장 또는 감소가 특정 한계(포화점)에 접근하며 점진적으로 변화하는 경우 사용합니다.\n' +
		'cap(최대값) 및 floor(최소값) 매개변수를 설정해야 합니다.\n' +
		'비선형적인 성장 모델을 기반으로 합니다.\n' +
		'적합한 경우:\n' +
		'\n' +
		'주식 또는 가상화폐가 특정 한계에 접근할 가능성이 있을 때(예: 심리적 저항선, 기술적 지지선).\n' +
		'거래량 또는 성장률이 초기에는 빠르지만, 점차 둔화되는 패턴을 보일 때.\n' +
		'가상화폐 시장의 경우, 수요-공급 또는 규제로 인해 상한선이 생길 가능성이 있는 경우.\n' +
		'장점:\n' +
		'\n' +
		'현실적으로 한계값을 가질 가능성이 있는 데이터에 적합.\n' +
		'특정 구간에서의 변화율을 더 잘 반영함.\n' +
		'단점:\n' +
		'\n' +
		'cap(최대값) 및 floor(최소값)을 적절히 설정해야 하므로, 추가적인 도메인 지식이 필요함.\n' +
		'데이터가 제한 없이 증가하거나 감소할 경우 부적합.\n'
};
