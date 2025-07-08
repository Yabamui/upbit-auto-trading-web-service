import Decimal from 'decimal.js';

export const CurrentNumberUtils = {
	isNumber: isNumber,
	getDecimalDepth: getDecimalDepth,
	divideCeil: divideCeil,
	ceilPrice: ceilPrice,
	calculateRate: calculateRate,
	calculatePercent: calculatePercent,
	subtractPrice: subtractPrice,
	numberWithCommas: numberWithCommas,
	getDecimalPlaceValue: getDecimalPlaceValue,
};

function isNumber(value: unknown): boolean {
	if (value === null || value === undefined) {
		return false;
	}

	if (typeof value === 'number') {
		return true;
	}

	if (typeof value === 'string') {
		return !isNaN(Number(value));
	}

	return false;
}

function divideCeil(value: number, divideUnit: number = 0): number {
	if (value === 0) {
		return 0;
	}
	
	if (divideUnit === 0) {
		return new Decimal(value).toNumber();
	}
	
	return new Decimal(value).dividedBy(divideUnit).toNumber();
}

function ceilPrice(value: number, unit: number = 0): number {
	if (value === 0) {
		return 0;
	}
	
	try {
		return new Decimal(value).toDecimalPlaces(unit, Decimal.ROUND_CEIL)
			.toNumber();
	} catch (error) {
		console.error('CurrentNumberUtils.ceilPrice', error);
		console.log(`value: ${value}, unit: ${unit}`);
		return 0;
	}
}

function subtractPrice(price: number, basePrice: number): number {
	const priceDecimal = new Decimal(price);
	const basePriceDecimal = new Decimal(basePrice);
	
	return priceDecimal.minus(basePriceDecimal)
		.toNumber();
}

function calculateRate(price: number, basePrice: number): number {
	if (!price || !basePrice) {
		return 0;
	}
	
	const priceDecimal = new Decimal(price);
	const basePriceDecimal = new Decimal(basePrice);
	
	return priceDecimal.minus(basePriceDecimal)
		.dividedBy(basePriceDecimal.abs())
		.times(100)
		.toNumber();
}

function calculatePercent(price: number, basePrice: number): number {
	if (!price || !basePrice) {
		return 0;
	}
	
	const priceDecimal = new Decimal(price);
	const basePriceDecimal = new Decimal(basePrice);
	
	return priceDecimal.dividedBy(basePriceDecimal).times(100).toNumber();
}

function getDecimalDepth(value: number): number {
	if (value === 0) {
		return 0;
	}
	
	return new Decimal(value).dp();
}

function numberWithCommas(num: number, digits: number): string {
	if (num === 0) {
		return '0';
	}
	
	const fixed = num.toFixed(digits);
	const split = fixed.split('.');
	const integer = split[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	
	if (split.length === 1) {
		return integer;
	}
	
	const decimal = split[1];
	
	return `${integer}.${decimal}`;
}

function getDecimalPlaceValue(decimalPlace: number): number {
	switch (decimalPlace) {
		case 0:
			return 1;
		case 1:
			return 0.1;
		case 2:
			return 0.01;
		case 3:
			return 0.001;
		case 4:
			return 0.0001;
		case 5:
			return 0.00001;
		case 6:
			return 0.000001;
		case 7:
			return 0.0000001;
		case 8:
			return 0.00000001;
		case 9:
			return 0.000000001;
		case 10:
			return 0.0000000001;
		default:
			return 1;
	}
}