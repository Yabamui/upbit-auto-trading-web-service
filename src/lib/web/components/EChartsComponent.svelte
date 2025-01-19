<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import * as echarts from 'echarts';
	import {
		onDestroy,
		onMount,
		tick
	} from 'svelte';

	let { seriesData = $bindable(), seriesBarData = $bindable(), xAxisData = $bindable() } = $props();

	const upColor = '#00da3c';
	const downColor = '#ec0000';

	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _eChartsOption: EChartsOption = $state({
		legend: {
			bottom: 10,
			data: ['Minute', 'MA5', 'MA10', 'MA20', 'MA30'],
			inactiveColor: '#777',
			textStyle: {
				color: 'rgba(135, 135, 135, 1)'
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
				color: '#000'
			},
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
				left: '10%',
				right: '8%',
				height: '50%'
			},
			{
				left: '10%',
				right: '8%',
				top: '63%',
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
				start: 50,
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
				name: 'Volume',
				type: 'bar',
				xAxisIndex: 1,
				yAxisIndex: 1,
				data: [[]] as number[][]
			}
		]
	});

	onMount(async () => {
		await mount();

		window.addEventListener('resize', () => {
			_eCharts?.resize();
		});
	});

	onDestroy(() => {
		if (_eCharts) {
			_eCharts.dispose();

			window.removeEventListener('resize', () => {
				_eCharts?.resize();
			});
		}
	})

	$inspect(seriesData, seriesBarData, xAxisData)
		.with(() => mount());

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
			series: [
				{ data: seriesData },
				{ data: calculateMA(5, seriesData) },
				{ data: calculateMA(10, seriesData) },
				{ data: calculateMA(20, seriesData) },
				{ data: calculateMA(30, seriesData) },
				{ data: seriesBarData }
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
</script>

<div class=" w-full min-h-[500px]"
		 bind:this={_eChartsElement}>
</div>