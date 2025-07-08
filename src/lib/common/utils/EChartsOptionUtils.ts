import * as echarts from 'echarts';
import type { CandleData } from '$lib/common/models/CandleData';

export interface ECHartLineConfidenceBandSeriesData {
	highName: string;
	lowName: string;
	middleName: string;
	highColor: string;
	// lowColor: string;
	middleColor: string;
	itemList: EChartLineConfidenceBandSeriesItemData[];
}

export interface EChartLineConfidenceBandSeriesItemData {
	high: number;
	low: number;
	middle: number;
}

export const EChartOptionUtils = {
	getLegentOption: getLegentOption,
	getGridOption: getGridOption,
	getXAxisOption: getXAxisOption,
	getYAxisOption: getYAxisOption,
	getLineConfidenceBandSeriesOption: getLineConfidenceBandSeriesOption,
};

function getLegentOption(legendData: string[]): echarts.LegendComponentOption {
	return {
		bottom: 0,
		data: legendData,
		inactiveColor: '#777',
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
			top: '5%',
			height: '80%'
		}
	];

	if (xAxisDataListLength === 1) {
		return defaultGridOption;
	}

	if (xAxisDataListLength == 2) {
		defaultGridOption[0].height = '60%';
		defaultGridOption.push({
			left: '0%',
			right: '10%',
			top: '70%',
			height: '15%'
		});
		return defaultGridOption;
	}

	defaultGridOption[0].height = '50%';

	const basisTop: number = 40 / (xAxisDataListLength - 1);

	for (let i: number = 60; i < 100; i += basisTop) {
		defaultGridOption.push({
			left: '0%',
			right: '10%',
			top: `${i}%`,
			height: `${basisTop - 5}%`
		});
	}

	return defaultGridOption;
}

function getXAxisOption(xAxisDataList: string[][]): echarts.XAXisComponentOption[] {
	return xAxisDataList.map((dataList: string[], index: number): echarts.XAXisComponentOption => {
		return {
			type: 'category',
			gridIndex: index,
			data: dataList,
			boundaryGap: false,
			axisLine: { onZero: true },
			axisTick: { show: true },
			splitLine: { show: true }
			// axisLabel: { show: true },
			// min: 'dataMin',
			// max: 'dataMax'
		};
	});
}

function getYAxisOption(xAxisDataList: string[][]): echarts.YAXisComponentOption[] {
	return xAxisDataList.map((_: string[], index: number): echarts.YAXisComponentOption => {
		return {
			type: 'value',
			scale: true,
			gridIndex: index,
			splitNumber: 3,
			position: 'right',
			axisLine: { onZero: true },
			axisTick: { show: true },
			axisLabel: { show: true },
			splitLine: { show: true }
		};
	});
}

function getCandleSeriesData(
	chartName: string,
	candleDataList: CandleData[],
	highColor: string,
	lowColor: string,
	highBorderColor: string,
	lowBorderColor: string
): echarts.SeriesOption {
	return {
		type: 'candlestick',
		emphasis: {
			focus: 'series'
		},
		name: chartName,
		data: candleDataList.map((item: CandleData): number[] => {
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

function getLineSeriesData(
	chartName: string,
	dataList: number[],
	xAxisIndex: number,
	yAxisIndex: number,
	color: string
): echarts.SeriesOption {
	return {
		type: 'line',
		emphasis: {
			focus: 'series'
		},
		xAxisIndex: xAxisIndex,
		yAxisIndex: yAxisIndex,
		name: chartName,
		data: dataList,
		// smooth: false,
		showSymbol: false,
		lineStyle: {
			width: 1,
			color: color
		}
	};
}

function getBarSeriesData(
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
		},
		{
			name: data.middleName,
			type: 'line',
			data: data.itemList.map((item: EChartLineConfidenceBandSeriesItemData): number => {
				return Math.ceil(item.middle);
			}),
			itemStyle: {
				color: data.middleColor
			},
			showSymbol: false
		}
	];
}
