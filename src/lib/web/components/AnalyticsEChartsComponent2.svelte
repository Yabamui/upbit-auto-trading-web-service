<script lang="ts">
	import * as echarts from 'echarts';
	import {
		onDestroy,
		onMount,
		tick
	} from 'svelte';
	import type {
		MarkAreaOption,
		MarkLineOption,
		MarkPointOption
	} from 'echarts/types/dist/shared';
	import { colorThemeStore } from '$lib/stores/ThemeStore';
	import type {
		AiAnalyticsCandleData,
		AiAnalyticsCandleItemData
	} from '$lib/common/models/AiAnalyticsData';

	let {
		marketCandleData = $bindable(),
		candleAccTradePriceData = $bindable(),
		xAxisData = $bindable(),
		inferenceCandleData = $bindable(),
		showMarkPoint = $bindable(),
		showMarkLine = $bindable(),
		dataZoomStart = $bindable(),
		chartClearYn = $bindable()
	} = $props();

	const _markPoint: MarkPointOption = {
		label: {
			formatter: formatter
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
	const _markLine: MarkLineOption = {
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
						color: '#2087fc'
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
						color: '#2087fc'
					}
				}
			],
			{
				name: 'min line on close',
				type: 'min',
				valueDim: 'close',
				lineStyle: {
					color: '#fe4343'
				}
			},
			{
				name: 'max line on close',
				type: 'max',
				valueDim: 'close',
				lineStyle: {
					color: '#00bc09'
				}
			}
		]
	};
	const _markArea: MarkAreaOption = {
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

	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);

	onMount(() => {
		tick()
			.then(() => {
				if (_eCharts) {
					window.addEventListener('resize', () => {
						_eCharts?.resize();
					});

					_eCharts.on('dataZoom', (params) => {
						console.log(params);
					});
				}
			});
	});

	$effect(() => {
		if ((marketCandleData && xAxisData.length > 0 && candleAccTradePriceData.length > 0) || inferenceCandleData) {
			mount();
		}
	});

	onDestroy(() => {
		if (_eCharts) {

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});

			_eCharts?.dispose();
		}
	});

	$inspect(showMarkPoint)
		.with(() => addMarkPoint());
	$inspect(showMarkLine)
		.with(() => addMarkLine());
	$inspect($colorThemeStore)
		.with(() => reflectColorTheme(_textColor));

	async function mount() {

		await tick();

		if (!_eCharts) {
			_eCharts = echarts.init(_eChartsElement, '', {
				renderer: 'canvas',
				width: 'auto',
				height: 'auto'
			});

			window.addEventListener('resize', () => {
				_eCharts?.resize();
			});
		}

		if (chartClearYn) {
			_eCharts.clear();
			chartClearYn = false;
		}

		const xAxis = getXAxisData(xAxisData, xAxisData);
		const marketCandleSeries = getCandleSeriesData(marketCandleData);
		const mainDataSet = marketCandleSeries.data as number[][];
		const ma5Series = getLineSeriesData('MA5', calculateMA(5, mainDataSet));
		const ma10Series = getLineSeriesData('MA10', calculateMA(10, mainDataSet));
		const ma20Series = getLineSeriesData('MA20', calculateMA(20, mainDataSet));
		const ma30Series = getLineSeriesData('MA30', calculateMA(30, mainDataSet));

		if (inferenceCandleData) {
			const legend = getLegendData([
				marketCandleData.candleName,
				inferenceCandleData.candleName,
				'MA5',
				'MA10',
				'MA20',
				'MA30'
			]);

			const inferenceSeries = getCandleSeriesData(inferenceCandleData);

			const eChartsOption = getEChartsOption(legend, xAxis, [
				marketCandleSeries,
				ma5Series,
				ma10Series,
				ma20Series,
				ma30Series,
				getBarSeriesData(candleAccTradePriceData),
				inferenceSeries
			]);

			_eCharts.setOption(eChartsOption);
		} else {
			const legend = getLegendData([
				marketCandleData.candleName,
				'MA5',
				'MA10',
				'MA20',
				'MA30'
			]);

			const eChartsOption = getEChartsOption(legend, xAxis, [
				marketCandleSeries,
				ma5Series,
				ma10Series,
				ma20Series,
				ma30Series,
				getBarSeriesData(candleAccTradePriceData)
			]);

			_eCharts.setOption(eChartsOption);
		}

		reflectColorTheme(_textColor);
	}

	function getLegendData(dataList: string[]) {
		return {
			bottom: 10,
			data: dataList,
			inactiveColor: '#777',
			textStyle: {
				color: '#ccc'
			}
		};
	}

	function getXAxisData(firstDataList: string[], secondDataList: string[]) {
		return [
			{
				type: 'category',
				data: firstDataList
			},
			{
				type: 'category',
				gridIndex: 1,
				data: secondDataList,
				boundaryGap: false,
				axisLine: { onZero: false },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: { show: false },
				min: 'dataMin',
				max: 'dataMax'
			}
		];
	}

	function getCandleSeriesData(aiAnalyticsCandleData: AiAnalyticsCandleData) {
		return {
			type: 'candlestick',
			emphasis: {
				focus: 'series'
			},
			name: aiAnalyticsCandleData.candleName,
			data: aiAnalyticsCandleData.itemList.map((item: AiAnalyticsCandleItemData) => {
				return [
					item.openingPrice,
					item.tradePrice,
					item.lowPrice,
					item.highPrice
				];
			}),
			itemStyle: {
				color: aiAnalyticsCandleData.highColor,
				color0: aiAnalyticsCandleData.lowColor,
				borderColor: aiAnalyticsCandleData.highBorderColor,
				borderColor0: aiAnalyticsCandleData.lowBorderColor
			}
		};
	}

	function getLineSeriesData(name: string, dataList: number[]) {
		return {
			type: 'line',
			emphasis: {
				focus: 'series'
			},
			name: name,
			data: dataList,
			smooth: true,
			showSymbol: false,
			lineStyle: {
				width: 1
			}
		};
	}

	function getBarSeriesData(dataList: number[][]) {
		return {
			name: '누적거래금액',
			type: 'bar',
			xAxisIndex: 1,
			yAxisIndex: 1,
			data: dataList
		};
	}

	function getEChartsOption(legend, xAxis, series) {
		return {
			legend: legend,
			tooltip: {
				trigger: 'axis',
				axisPointer: {
					type: 'cross'
				},
				borderWidth: 1,
				borderColor: '#ccc',
				padding: 10,
				textStyle: {
					color: '#000',
					fontSize: 12
				},
				position: tooltipPosition
			},
			axisPointer: {
				link: [
					{
						xAxisIndex: 'all'
					}
				],
				label: {
					backgroundColor: '#777'
				}
			},
			visualMap: {
				show: false,
				seriesIndex: 5,
				dimension: 2,
				pieces: [
					{
						value: 1,
						color: marketCandleData.lowColor
					},
					{
						value: -1,
						color: marketCandleData.highColor
					}
				]
			},
			grid: [
				{
					left: '0%',
					right: '10%',
					height: '50%'
				},
				{
					left: '0%',
					right: '10%',
					top: '65%',
					height: '16%'
				}
			],
			xAxis: xAxis,
			yAxis: [
				{
					scale: true,
					type: 'value',
					name: '',
					position: 'right'
				},
				{
					scale: true,
					gridIndex: 1,
					splitNumber: 2,
					axisLabel: { show: false },
					axisLine: { show: false },
					axisTick: { show: false },
					splitLine: { show: false }
				}
			],
			dataZoom: [
				{
					type: 'inside',
					xAxisIndex: [0, 1],
					start: dataZoomStart,
					end: 100,
					zoomLock: true
				},
				{
					show: true,
					xAxisIndex: [0, 1],
					type: 'slider',
					top: '0%',
					start: dataZoomStart,
					end: 100
				}
			],
			series: series
		};
	}

	function addMarkPoint() {
		if (!_eCharts) {
			return;
		}

		if (!_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markPoint: showMarkPoint ? _markPoint : undefined }
			]
		});
	}

	function addMarkLine() {
		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			series: [
				{ markLine: showMarkLine ? _markLine : undefined }
			]
		});
	}

	function reflectColorTheme(textColor: string) {
		if (!textColor) {
			return;
		}

		if (!_eCharts || !_eCharts.getOption()) {
			return;
		}

		_eCharts.setOption({
			legend: {
				textStyle: {
					color: textColor
				}
			},
			xAxis: [
				{
					axisLabel: {
						color: textColor
					}
				},
				{
					axisLabel: {
						color: textColor
					}
				}
			],
			yAxis: [
				{
					nameTextStyle: {
						color: textColor
					},
					axisLabel: {
						color: textColor
					}
				},
				{
					axisLabel: {
						color: textColor
					}
				}
			]
		});
	}

	function calculateMA(dayCount: number, data: number[][]) {
		let result = [];
		for (let i = 0, len = data.length; i < len; i++) {
			if (i < dayCount) {
				result.push(NaN);
				continue;
			}
			let sum = 0;
			for (let j = 0; j < dayCount; j++) {
				sum += +data[i - j][1];
			}
			result.push(sum / dayCount);
		}
		return result;
	}

	function tooltipPosition(pos, params, el, elRect, size) {
		const obj: Record<string, number> = {
			top: 10
		};
		obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
		return obj;
	}

	function formatter(param: any) {
		if (!param) {
			return '';
		}
		return Math.round(param.value)
			.toLocaleString();
	}
</script>

<div class=" w-full min-w-[900px] min-h-[600px]"
		 bind:this={_eChartsElement}>
</div>