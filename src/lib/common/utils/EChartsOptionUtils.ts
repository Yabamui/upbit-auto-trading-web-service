import * as echarts from 'echarts';
import type { CandleData } from '$lib/common/models/CandleData';
import type {
	CallbackDataParams,
	MarkAreaOption,
	MarkLineOption,
	MarkPointOption
} from 'echarts/types/dist/shared';
import { CurrentNumberUtils } from '$lib/common/utils/CurrentNumberUtils';
import Decimal from 'decimal.js';
import { type NumberUnitEnum, NumberUnitEnumUtils } from '$lib/common/enums/NumberUnitEnum';
import { AnalyzeTechnicalIndicatorUtils } from '$lib/common/utils/AnalyzeTechnicalIndicatorUtils';
import type { StochasticData, StochasticRSIData } from '$lib/common/models/TechnicalIndicatorData';

export interface EChartCandlestickSeriesData {
	openingPrice: number;
	tradePrice: number;
	highPrice: number;
	lowPrice: number;
}

export interface ECHartLineConfidenceBandSeriesData {
	highName: string;
	lowName: string;
	// middleName: string;
	highColor: string;
	// lowColor: string;
	// middleColor: string;
	itemList: EChartLineConfidenceBandSeriesItemData[];
}

export interface EChartLineConfidenceBandSeriesItemData {
	high: number;
	low: number;
	// middle: number;
}

export const EChartsOptionUtils = {
	getLegentOption: getLegentOption,
	getGridOption: getGridOption,
	getXAxisOption: getXAxisOption,
	getYAxisOption: getYAxisOption,
	getCandleSeriesOption: getCandleSeriesOption,
	getLineSeriesOption: getLineSeriesOption,
	getMASeriesOption: getMASeriesOption,
	getVolumeSeriesOption: getVolumeSeriesOption,
	getMACDSeriesOption: getMACDSeriesOption,
	getRSISeriesOption: getRSISeriesOption,
	getPriceRateSeriesOption: getPriceRateSeriesOption,
	getStochasticSeriesOption: getStochasticSeriesOption,
	getStochasticRSISeriesOption: getStochasticRSISeriesOption,
	getATRSeriesOption: getATRSeriesOption,
	getBarSeriesOption: getBarSeriesOption,
	getLineConfidenceBandSeriesOption: getLineConfidenceBandSeriesOption,
	getMarkPointOption: getMarkPointOption,
	getMinMaxMarkLineOption: getMinMaxMarkLineOption,
	getXAxisMarkLineOption: getXAxisMarkLineOption,
	getMarkAreaOption: getMarkAreaOption,
	getVisualMapOption: getVisualMapOption,
	getVisualMapOptionByMACD: getVisualMapOptionByMACD,
	getVisualMapOptionByRSI: getVisualMapOptionByRSI,
	getVisualMapOptionPriceRate: getVisualMapOptionPriceRate,
	tooltipPosition: tooltipPosition
};

function getLegentOption(legendData: string[]): echarts.LegendComponentOption {
	return {
		type: 'scroll',
		data: legendData,
		// inactiveColor: '#777',
		textStyle: {
			color: '#ccc'
		}
	};
}

function getGridOption(xAxisDataListLength: number): echarts.GridComponentOption[] {
	const defaultGridOption: echarts.GridComponentOption[] = [
		{
			left: '0%',
			right: '10%',
			top: 24,
			height: '90%'
		}
	];

	if (xAxisDataListLength === 1) {
		return defaultGridOption;
	}

	if (xAxisDataListLength == 2) {
		defaultGridOption[0].height = '50%';
		defaultGridOption.push({
			left: '0%',
			right: '10%',
			top: '60%',
			height: '35%'
		});
		return defaultGridOption;
	}

	if (xAxisDataListLength == 3) {
		defaultGridOption[0].height = '40%';

		const basisTop: number = 50 / (xAxisDataListLength - 1);

		for (let i: number = 50; i < 100; i += basisTop) {
			defaultGridOption.push({
				left: '0%',
				right: '10%',
				top: `${i}%`,
				height: `${basisTop - 5}%`
			});
		}

		return defaultGridOption;
	}

	defaultGridOption[0].height = '30%';

	const basisTop: number = 60 / (xAxisDataListLength - 1);

	for (let i: number = 40; i < 100; i += basisTop) {
		defaultGridOption.push({
			left: '0%',
			right: '10%',
			top: `${i}%`,
			height: `${basisTop - 5}%`
		});
	}

	return defaultGridOption;
}

function getXAxisOption(
	datetimeList: string[],
	eChartCount: number
): echarts.XAXisComponentOption[] {
	return Array(eChartCount)
		.fill(0)
		.map((_, index: number): echarts.XAXisComponentOption => {
			return {
				show: true,
				type: 'category',
				gridIndex: index,
				data: datetimeList,
				boundaryGap: false,
				axisLine: {
					onZero: true,
					lineStyle: {
						width: 1
					}
				},
				axisLabel: {
					show: index === eChartCount - 1
				},
				axisTick: { show: true },
				splitLine: { show: false }
				// axisLabel: { show: true },
				// min: 'dataMin',
				// max: 'dataMax'
			};
		});
}

function getYAxisOption(eChartCount: number): echarts.YAXisComponentOption[] {
	return Array(eChartCount)
		.fill(0)
		.map((_, index: number): echarts.YAXisComponentOption => {
			return {
				type: 'value',
				scale: false,
				gridIndex: index,
				splitNumber: 4,
				position: 'right',
				splitLine: { show: true },
				axisLine: { onZero: true },
				axisTick: { show: false },
				axisLabel: {
					show: true,
					margin: 10,
					fontSize: 10,
					align: 'left',
					verticalAlign: 'middle',
					formatter: (params) => {
						const decimalDepth: number = new Decimal(params).dp();

						if (decimalDepth > 0) {
							return CurrentNumberUtils.numberWithCommas(params, decimalDepth);
						}

						const numberUnit: NumberUnitEnum = NumberUnitEnumUtils.getNumberUnitEnum(params);

						return (
							CurrentNumberUtils.numberWithCommas(
								CurrentNumberUtils.divideCeil(params, Number(numberUnit.value)),
								2
							) + numberUnit.unit
						);
					}
				},
			};
		});
}

function getCandleSeriesOption(
	chartName: string,
	candleDataList: CandleData[] | EChartCandlestickSeriesData[],
	highColor: string | undefined,
	lowColor: string | undefined,
	highBorderColor: string,
	lowBorderColor: string
): echarts.SeriesOption {
	return {
		type: 'candlestick',
		emphasis: {
			focus: 'series'
		},
		name: chartName,
		data: candleDataList.map((item: CandleData | EChartCandlestickSeriesData): number[] => {
			return [item.openingPrice, item.tradePrice, item.lowPrice, item.highPrice];
		}),
		itemStyle: {
			color: highColor,
			color0: lowColor,
			borderColor: highBorderColor,
			borderColor0: lowBorderColor
		}
	};
}

function getLineSeriesOption(
	chartName: string,
	dataList: number[],
	xAxisIndex: number,
	yAxisIndex: number,
	color: string = ''
): echarts.SeriesOption {
	const lineStyle = color
		? {
				width: 1,
				color: color
			}
		: undefined;

	return {
		type: 'line',
		emphasis: {
			focus: 'series'
		},
		xAxisIndex: xAxisIndex,
		yAxisIndex: yAxisIndex,
		name: chartName,
		data: dataList,
		showSymbol: false,
		lineStyle: lineStyle,
		label: {
			show: true
		}
	};
}

function getVolumeSeriesOption(
	chartName: string,
	dataList: number[][],
	axisIndex: number
): echarts.SeriesOption {
	return {
		name: chartName,
		type: 'bar',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: dataList,
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			data: [
				[
					{
						name: `Volume`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	};
}

async function getMASeriesOption(
	chartName: string,
	dataList: number[],
	periodList: number[],
	axisIndex: number,
	decimalDepth: number
): Promise<echarts.SeriesOption[]> {
	const chartColor:string[] = [
		'#E73223',
		'#E732F4',
		'#EC854E',
		'#333333',
		'#AAAAAA'
	];
	
	return Promise.all(
		periodList.map(async (period: number, index: number) => {
			const maList = await AnalyzeTechnicalIndicatorUtils.calculateMA(
				dataList,
				period,
				decimalDepth
			);
			
			const color = chartColor[index] || undefined;

			return {
				name: `${chartName}(${period})`,
				type: 'line',
				xAxisIndex: axisIndex,
				yAxisIndex: axisIndex,
				data: maList,
				showSymbol: false,
				lineStyle: {
					width: 1,
					color: color
				},
				label: {
					show: true
				}
			};
		})
	);
}

async function getRSISeriesOption(
	rsiChartName: string,
	dataList: number[],
	rsiPeriod: number,
	signalPeriod: number,
	xAxisIndex: number,
	yAxisIndex: number,
	rsiLineColor: string,
	signalLineColor: string
): Promise<echarts.SeriesOption[]> {
	const rsiResult: number[] = await AnalyzeTechnicalIndicatorUtils.calculateRSI(
		dataList,
		rsiPeriod
	);

	const rsiSeriesOption = {
		name: 'RSI',
		type: 'line',
		xAxisIndex: xAxisIndex,
		yAxisIndex: yAxisIndex,
		data: rsiResult,
		showSymbol: false,
		lineStyle: {
			width: 1,
			color: rsiLineColor
		},
		label: {
			show: true
		},
		markLine: {
			symbol: ['none', 'none'],
			silent: true,
			lineStyle: {
				color: '#333'
			},
			label: {
				show: false
			},
			data: [
				{
					yAxis: 30
				},
				{
					yAxis: 70
				}
			]
		},
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			itemStyle: {
				opacity: 0.3,
				color: '#0062DF'
			},
			data: [
				[
					{
						yAxis: 30
					},
					{
						yAxis: 70
					}
				],
				[
					{
						name: `RSI(${rsiPeriod} ${signalPeriod})`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	} as echarts.SeriesOption;

	const signalList: number[] = await AnalyzeTechnicalIndicatorUtils.calculateMA(
		rsiResult,
		signalPeriod,
		2
	);

	const signalSeriesOption = {
		name: 'SIGNAL',
		type: 'line',
		xAxisIndex: xAxisIndex,
		yAxisIndex: yAxisIndex,
		data: signalList,
		showSymbol: false,
		lineStyle: {
			width: 1,
			color: signalLineColor
		},
		label: {
			show: true
		}
	} as echarts.SeriesOption;

	return [rsiSeriesOption, signalSeriesOption];
}

async function getMACDSeriesOption(
	chartName: string,
	dataList: number[],
	fastPeriod: number,
	slowPeriod: number,
	signalPeriod: number,
	axisIndex: number,
	macdLineColor: string,
	signalLineColor: string
): Promise<echarts.SeriesOption[]> {
	const decimalDepth = dataList.reduce((acc, cur) => {
		const curDecimalDepth = new Decimal(cur).dp();
		return curDecimalDepth > acc ? curDecimalDepth : acc;
	}, 0);

	const macdResultList = await AnalyzeTechnicalIndicatorUtils.calculateMACD(
		dataList,
		decimalDepth,
		fastPeriod,
		slowPeriod,
		signalPeriod,
		false,
		false
	);

	const histogramSeriesOption = {
		name: 'HISTOGRAM',
		type: 'bar',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: macdResultList.map((item) => {
			if (!item.histogram) {
				return NaN;
			}

			return item.histogram;
		}),
		large: false,
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			data: [
				[
					{
						name: `MACD(${fastPeriod} ${slowPeriod} ${signalPeriod})`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	} as echarts.SeriesOption;

	const macdSeriesOption = {
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'cross'
			}
		},
		name: chartName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: macdResultList.map((item) => {
			return item.macd || NaN;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: macdLineColor
		}
	} as echarts.SeriesOption;

	const signalSeriesOption = {
		name: 'SIGNAL',
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: macdResultList.map((item) => {
			return item.signal || NaN;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: signalLineColor
		}
	} as echarts.SeriesOption;

	return [histogramSeriesOption, macdSeriesOption, signalSeriesOption];
}

function getPriceRateSeriesOption(
	chartName: string,
	dataList: number[],
	axisIndex: number
): echarts.SeriesOption {
	return {
		name: chartName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: dataList,
		showSymbol: false,
		label: {
			show: true
		},
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			data: [
				[
					{
						name: `Price Rate`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	};
}

async function getStochasticSeriesOption(
	stochasticKItemName: string,
	stochasticDItemName: string,
	dataList: number[][],
	period: number,
	signalPeriod: number,
	dPeriod: number,
	axisIndex: number
): Promise<echarts.SeriesOption[]> {
	const stochasticResultList: StochasticData[] =
		await AnalyzeTechnicalIndicatorUtils.calculateStochastic(
			dataList,
			period,
			signalPeriod,
			dPeriod
		);

	const stochasticKSeriesOption = {
		name: stochasticKItemName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: stochasticResultList.map((item: StochasticData) => {
			return item.k;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: '#FF0000'
		}
	} as echarts.SeriesOption;

	const stochasticDSeriesOption = {
		name: stochasticDItemName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: stochasticResultList.map((item: StochasticData) => {
			return item.d;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: '#0000FF'
		},
		markLine: {
			symbol: ['none', 'none'],
			silent: true,
			lineStyle: {
				color: '#333'
			},
			label: {
				show: false
			},
			data: [
				{
					yAxis: 20
				},
				{
					yAxis: 80
				}
			]
		},
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			itemStyle: {
				opacity: 0.3,
				color: '#0062DF'
			},
			data: [
				[
					{
						yAxis: 20
					},
					{
						yAxis: 80
					}
				],
				[
					{
						name: `Stochastic Slow (${period} %K ${dPeriod} %D ${signalPeriod})`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	} as echarts.SeriesOption;

	return [stochasticKSeriesOption, stochasticDSeriesOption];
}

async function getStochasticRSISeriesOption(
	stochasticRSIItemName: string,
	stochasticKItemName: string,
	stochasticDItemName: string,
	dataList: number[],
	rsiPeriod: number,
	stochasticPeriod: number,
	kPeriod: number,
	dPeriod: number,
	axisIndex: number
): Promise<echarts.SeriesOption[]> {
	const stochasticRSIResultList: StochasticRSIData[] =
		await AnalyzeTechnicalIndicatorUtils.calculateStochasticRSI(
			dataList,
			rsiPeriod,
			stochasticPeriod,
			kPeriod,
			dPeriod
		);

	const stochasticKSeriesOption = {
		name: stochasticKItemName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: stochasticRSIResultList.map((item: StochasticRSIData) => {
			return item.k;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: '#FF0000'
		},
		markLine: {
			symbol: ['none', 'none'],
			silent: true,
			lineStyle: {
				color: '#333'
			},
			label: {
				show: false
			},
			data: [
				{
					yAxis: 20
				},
				{
					yAxis: 80
				}
			]
		},
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			itemStyle: {
				opacity: 0.3,
				color: '#0062DF'
			},
			data: [
				[
					{
						yAxis: 20
					},
					{
						yAxis: 80
					}
				],
				[
					{
						name: `Stochastic RSI (${rsiPeriod} ${stochasticPeriod}) %K ${kPeriod} %D ${dPeriod})`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	} as echarts.SeriesOption;

	const stochasticDSeriesOption = {
		name: stochasticDItemName,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: stochasticRSIResultList.map((item: StochasticRSIData) => {
			return item.d;
		}),
		showSymbol: false,
		label: {
			show: true
		},
		lineStyle: {
			width: 1,
			color: '#0000FF'
		}
	} as echarts.SeriesOption;

	return [stochasticKSeriesOption, stochasticDSeriesOption];
}

async function getATRSeriesOption(
	dataListInList: number[][],
	period: number,
	axisIndex: number
): Promise<echarts.SeriesOption> {
	const atrList: number[] = await AnalyzeTechnicalIndicatorUtils.calculateATR(
		dataListInList,
		period
	);

	return {
		name: `ATR(${period})`,
		type: 'line',
		xAxisIndex: axisIndex,
		yAxisIndex: axisIndex,
		data: atrList,
		showSymbol: false,
		lineStyle: {
			width: 1,
			color: '#000000'
		},
		label: {
			show: true
		},
		markArea: {
			silent: true,
			label: {
				position: ['0%', '0%']
			},
			data: [
				[
					{
						name: `ATR (${period})`,
						x: '1%',
						valueIndex: 1
					},
					{
						x: '1%',
						valueIndex: 1
					}
				]
			]
		}
	};
}

function getBarSeriesOption(
	chatName: string,
	dataList: number[][],
	xAxisIndex: number,
	yAxisIndex: number
): echarts.SeriesOption {
	return {
		name: chatName,
		type: 'bar',
		xAxisIndex: xAxisIndex,
		yAxisIndex: yAxisIndex,
		data: dataList
	};
}

function getLineConfidenceBandSeriesOption(
	data: ECHartLineConfidenceBandSeriesData
): echarts.SeriesOption[] {
	return [
		{
			name: data.lowName,
			type: 'line',
			data: data.itemList.map((item: EChartLineConfidenceBandSeriesItemData): number => {
				return Math.ceil(item.low);
			}),
			lineStyle: {
				opacity: 0
			},
			// areaStyle: {
			// 	color: data.lowColor
			// },
			stack: 'confidence-band',
			symbol: 'none'
		},
		{
			name: data.highName,
			type: 'line',
			data: data.itemList.map((item: EChartLineConfidenceBandSeriesItemData): number => {
				return Math.ceil(item.high - item.low);
			}),
			lineStyle: {
				opacity: 0
			},
			areaStyle: {
				color: data.highColor
			},
			stack: 'confidence-band',
			symbol: 'none'
		}
	];
}

function getMarkPointOption(): MarkPointOption {
	return {
		label: {
			formatter: function (param: CallbackDataParams): string {
				if (!param || !param.value) {
					return '';
				}

				if (typeof param.value === 'number') {
					return Math.ceil(param.value).toLocaleString();
				}

				return param.value.toLocaleString();
			}
		},
		data: [
			{
				name: 'highest value',
				type: 'max',
				valueDim: 'highest',
				itemStyle: {
					color: '#5FE051'
				}
			},
			{
				name: 'lowest value',
				type: 'min',
				valueDim: 'lowest',
				itemStyle: {
					color: '#df2424'
				}
			},
			{
				name: 'average value on close',
				type: 'average',
				valueDim: 'close'
			}
		]
	};
}

function getMinMaxMarkLineOption(): MarkLineOption {
	return {
		symbol: ['none', 'none'],
		data: [
			[
				{
					type: 'min',
					valueDim: 'lowest',
					symbol: 'circle',
					symbolSize: 5,
					label: {
						show: false
					},
					emphasis: {
						label: {
							show: false
						}
					},
					lineStyle: {
						color: 'red'
					}
				},
				{
					type: 'max',
					valueDim: 'highest',
					symbol: 'circle',
					symbolSize: 5,
					label: {
						show: false
					},
					emphasis: {
						label: {
							show: false
						}
					},
					lineStyle: {
						color: 'blue'
					}
				}
			],
			{
				name: 'min line on close',
				type: 'min',
				valueDim: 'close',
				lineStyle: {
					color: 'blue'
				}
			},
			{
				name: 'max line on close',
				type: 'max',
				valueDim: 'close',
				lineStyle: {
					color: '#fe4343'
				}
			}
		]
	};
}

function getXAxisMarkLineOption(xAxisDataList: string[]): MarkLineOption {
	return {
		symbol: ['none', 'none'],
		label: { show: false },
		data: xAxisDataList.map((item: string) => {
			return {
				xAxis: item
			};
		})
	};
}

function getMarkAreaOption(): MarkAreaOption {
	return {
		silent: true,
		itemStyle: {
			color: 'transparent',
			borderWidth: 1,
			borderType: 'dashed'
		},
		data: [
			[
				{
					name: 'Male Data Range',
					xAxis: 'min',
					yAxis: 'min'
				},
				{
					xAxis: 'max',
					yAxis: 'max'
				}
			]
		]
	};
}

function getVisualMapOption(seriesIndex: number): echarts.VisualMapComponentOption {
	return {
		type: 'piecewise',
		show: false,
		seriesIndex: seriesIndex,
		dimension: 2,
		pieces: [
			{
				value: 1,
				color: 'blue'
			},
			{
				value: -1,
				color: 'red'
			}
		]
	};
}

function getVisualMapOptionByMACD(seriesIndex: number): echarts.VisualMapComponentOption {
	return {
		type: 'piecewise',
		show: false,
		seriesIndex: seriesIndex,
		pieces: [
			{
				max: 0,
				color: '#0000FF'
			},
			{
				gt: 0,
				color: '#FF0000'
			}
		],
		outOfRange: {
			color: '#999'
		}
	};
}

function getVisualMapOptionByRSI(seriesIndex: number): echarts.VisualMapComponentOption {
	return {
		type: 'piecewise',
		show: false,
		seriesIndex: seriesIndex,
		// dimension: 0,
		pieces: [
			{
				gte: 0,
				lte: 30,
				color: '#0000FF'
			},
			{
				gt: 70,
				lte: 100,
				color: '#FF0000'
			}
		],
		outOfRange: {
			color: '#999'
		}
	};
}

function getVisualMapOptionPriceRate(seriesIndex: number): echarts.VisualMapComponentOption {
	return {
		type: 'piecewise',
		show: false,
		seriesIndex: seriesIndex,
		pieces: [
			{
				gt: -100,
				lt: 0,
				color: '#0000FF'
			},
			{
				gt: 0,
				color: '#FF0000'
			}
		],
		outOfRange: {
			color: '#999'
		}
	};
}

function tooltipPosition(
	pos: [number, number],
	params: unknown,
	el: unknown,
	elRect: unknown,
	size: {
		/**
		 * Size of popup content
		 */
		contentSize: [number, number];
		/**
		 * Size of the chart view
		 */
		viewSize: [number, number];
	}
): Record<string, number> {
	const obj: Record<string, number> = {
		top: 10
	};
	obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;

	return obj;
}
