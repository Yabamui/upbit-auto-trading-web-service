export const ProphetAnalyticsEnum = {
	growth: {
		linear: {
			key: 'linear',
			descriptionKr:
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
			descriptionEn: 'linear: linearly increasing'
		},
		logistic: {
			key: 'logistic',
			descriptionKr:
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
				'데이터가 제한 없이 증가하거나 감소할 경우 부적합.\n',
			descriptionEn: 'logistic: logistic growth model'
		}
	},
	mode: {
		additive: {
			key: 'additive',
			descriptionKr: "",
		},
		multiplicative: {
			key: 'multiplicative',
			descriptionKr: "",
		}
	}
} as const;
