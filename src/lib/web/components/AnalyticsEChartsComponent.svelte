<script lang="ts">
	import type { EChartsOption } from 'echarts';
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

	let {
		candleData = $bindable(),
		candleAccTradePriceData = $bindable(),
		xAxisData = $bindable(),
		inferenceCandleData = $bindable(),
		showMarkPoint = $bindable(),
		showMarkLine = $bindable(),
		dataZoomStart
	} = $props();

	const upColor = '#00da3c';
	const downColor = '#ec0000';
	const _legend = {
		bottom: 10,
		data: ['Minute', 'MA5', 'MA10', 'MA20', 'MA30'],
		inactiveColor: '#777',
		textStyle: {
			color: '#ccc'
		}
	};
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
	const _eChartsOption: EChartsOption = $state({
		legend: {
			bottom: 10,
			data: ['Minute', 'MA5', 'MA10', 'MA20', 'MA30'],
			inactiveColor: '#777',
			textStyle: {
				color: '#ccc'
			}
		},
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
			// fixed position
			position: function(pos, params, el, elRect, size) {
				const obj: Record<string, number> = {
					top: 10
				};
				obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
				return obj;
			}
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
					color: downColor
				},
				{
					value: -1,
					color: upColor
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
		xAxis: [
			{
				type: 'category',
				data: []
			},
			{
				type: 'category',
				gridIndex: 1,
				data: [],
				boundaryGap: false,
				axisLine: { onZero: false },
				axisTick: { show: false },
				splitLine: { show: false },
				axisLabel: { show: false },
				min: 'dataMin',
				max: 'dataMax'
			}
		],
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
				start: 50,
				end: 100
			}
		],
		series: [
			{
				type: 'candlestick',
				name: 'Minute',
				data: [[]] as number[][],
				itemStyle: {
					color: '#0CF49B',
					color0: '#FD1050',
					borderColor: '#0CF49B',
					borderColor0: '#FD1050'
				}
			},
			{
				name: 'MA5',
				type: 'line',
				data: [[]] as number[][],
				smooth: true,
				showSymbol: false,
				lineStyle: {
					width: 1
				}
			},
			{
				name: 'MA10',
				type: 'line',
				data: [[]] as number[][],
				smooth: true,
				showSymbol: false,
				lineStyle: {
					width: 1
				}
			},
			{
				name: 'MA20',
				type: 'line',
				data: [[]] as number[][],
				smooth: true,
				showSymbol: false,
				lineStyle: {
					width: 1
				}
			},
			{
				name: 'MA30',
				type: 'line',
				data: [[]] as number[][],
				smooth: true,
				showSymbol: false,
				lineStyle: {
					width: 1
				}
			},
			{
				name: '누적거래금액',
				type: 'bar',
				xAxisIndex: 1,
				yAxisIndex: 1,
				data: [[]] as number[][]
			},
		]
	});

	let _textColor = $derived($colorThemeStore === 'light' ? '#000' : '#ccc');
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);

	onMount(() => {
		console.log('ai analytics onMount');
		tick().then(() => {
			if (_eCharts) {
				window.addEventListener('resize', () => {
					_eCharts?.resize();
				});
			}
		});
	});

	$effect(() => {
		if (candleData.length > 0 || candleAccTradePriceData.length >0 || xAxisData.length > 0 || candleAccTradePriceData.length > 0) {
			mount();
		}
	});
	let d = ""
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
		}

		_eCharts.setOption(_eChartsOption);

		_eCharts.setOption({
			xAxis: [
				{
					data: xAxisData
				},
				{
					data: xAxisData
				}
			],
		});

		const scatterSeriesList = inferenceCandleData.map((candleData) => {
			return {
				type: 'candlestick',
				name: candleData.name,
				data: candleData.data,
				itemStyle: {
					color: undefined,
					color0: undefined,
					borderColor: '#0CF49B',
					borderColor0: '#FD1050'
				}
			};
		}) || [];

		_eCharts.setOption({
			series: [
				{ data: candleData },
				{ data: calculateMA(5, candleData) },
				{ data: calculateMA(10, candleData) },
				{ data: calculateMA(20, candleData) },
				{ data: calculateMA(30, candleData) },
				{ data: candleAccTradePriceData },
				...scatterSeriesList
			]
		});

		_legend.data.push(...inferenceCandleData.map((candleData) => candleData.name));

		_eCharts.setOption({
			legend: _legend
		});

		reflectColorTheme(_textColor);
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
				result.push('-');
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