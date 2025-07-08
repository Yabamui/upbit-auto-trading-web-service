export const NumberUnitEnum = {
	Ones: {
		unit: '',
		value: 0
	},
	Thousands: {
		unit: 'K',
		value: 1000
	},
	Millions: {
		unit: 'M',
		value: 1000000
	},
	Billions: {
		unit: 'B',
		value: 1000000000
	},
	Trillions: {
		unit: 'T',
		value: 1000000000000
	},
} as const;

export type NumberUnitEnum = (typeof NumberUnitEnum)[keyof typeof NumberUnitEnum];

export const NumberUnitEnumUtils = {
	getNumberUnitEnum: (value: number): NumberUnitEnum => {
		const replaceCap = value < 0 ? -value : value;
		
		const numberUnit: NumberUnitEnum | undefined = Object.values(NumberUnitEnum).reverse().find(
			(item: NumberUnitEnum) => item.value <= replaceCap
		);
		
		if (numberUnit) {
			return numberUnit;
		}
		
		return NumberUnitEnum.Ones;
	}
};
