<script lang="ts">

	import {
		Button,
		Card
	} from 'flowbite-svelte';
	import {
		onMount,
		tick
	} from 'svelte';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { AiAnalyticsWebApi } from '$lib/web/api/AiAnalyticsWebApi';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type { AiResponsesTodayInferenceData } from '$lib/common/models/AiResponsesData';
	import * as echarts from 'echarts';
	import {
		ChevronDownOutline,
		ChevronUpOutline
	} from 'flowbite-svelte-icons';
	import { slide } from 'svelte/transition';
	import type { CallbackDataParams } from 'echarts/types/dist/shared';

	let {candleType = $bindable()} = $props();

	interface ChartData {
		market: string;
		koreanName: string;
		createdAt: string;
		avgChartItemData: ChartItemData;
		latestChartItemData: ChartItemData;
	}

	interface ChartItemData {
		openPrice: number;
		closePrice: number;
		highPrice: number;
		lowPrice: number;
	}

	let _openYn: boolean = $state(false);
	let _eChartsElement: HTMLDivElement | undefined = $state(undefined);
	let _eCharts: echarts.ECharts | undefined = $state(undefined);
	let _chartDataList: ChartData[] = $state([]);

	onMount(async () => {
		await mountData();

		if (_openYn) {
			await setChartData();

			if (_eCharts) {
				_eCharts.hideLoading();
				console.log('showLoading');
			}
		}
	});

	$effect(() => {
		if (_openYn) {
			setChartData()
				.then(() => {
					hideLoading();
				});
		}
	});

	function hideLoading() {
		if (_eCharts) {
			_eCharts.hideLoading();
		}
	}

	async function mountData() {
		await getAiResponsesTodayInferenceData();
	}

	async function getAiResponsesTodayInferenceData() {
		const responseObject: ResponseObject<unknown> = await AiAnalyticsWebApi.getAiResponsesTodayInference(candleType);

		if (ResponseCode.success.code !== responseObject.code || !responseObject.data) {
			alert(responseObject.message);
			return;
		}

		const todayInferenceDataList = responseObject.data as AiResponsesTodayInferenceData[];

		const marketAndTodayInferenceDataRecord = todayInferenceDataList.reduce((acc, item) => {
			if (!acc[item.market]) {
				acc[item.market] = [];
			}

			acc[item.market].push(item);

			return acc;
		}, {} as Record<string, AiResponsesTodayInferenceData[]>);

		_chartDataList = Object.keys(marketAndTodayInferenceDataRecord)
			.reduce((acc, item) => {
				const dataList = marketAndTodayInferenceDataRecord[item];

				const latestData = dataList.reduce((acc, item) => {
					if (!acc.createdAt || acc.createdAt < item.createdAt) {
						acc = item;
					}

					return acc;
				}, {} as AiResponsesTodayInferenceData);

				const avgData = dataList.reduce((acc, item) => {
					acc.openPrice += item.openPrice;
					acc.closePrice += item.closePrice;
					acc.highPrice += item.highPrice;
					acc.lowPrice += item.lowPrice;

					return acc;
				}, {
					openPrice: 0,
					closePrice: 0,
					highPrice: 0,
					lowPrice: 0
				});

				if (!acc.some((chartData) => chartData.market === item)) {
					acc.push({
						market: item,
						koreanName: latestData.koreanName,
						createdAt: latestData.createdAt,
						avgChartItemData: {
							openPrice: avgData.openPrice / dataList.length,
							closePrice: avgData.closePrice / dataList.length,
							highPrice: avgData.highPrice / dataList.length,
							lowPrice: avgData.lowPrice / dataList.length
						},
						latestChartItemData: {
							openPrice: latestData.openPrice,
							closePrice: latestData.closePrice,
							highPrice: latestData.highPrice,
							lowPrice: latestData.lowPrice
						}
					});
				}

				return acc;
			}, [] as ChartData[]);
	}

	async function setChartData() {

		await tick();

		if (_eCharts) {
			_eCharts.dispose();
			_eCharts = undefined;
		}

		if (!_eCharts) {
			_eCharts = echarts.init(_eChartsElement, '', {
				renderer: 'canvas',
				width: 'auto',
				height: 'auto'
			});
		}

		_eCharts.showLoading();

		let modes = ['AVG-OH', 'AVG-HL', 'AVG-OC', 'LTS-OH', 'LTS-HL', 'LTS-OC'];

		_eCharts.setOption({
			title: {
				top: 5,
				left: 'center',
				text: 'Today Ai Analytics',
				subtext: 'Daily Ai Analytics Result Data Statistics'
			},

			legend: {
				data: modes,
				selectedMode: 'single',
				top: 55,
				itemGap: 5,
				borderRadius: 5
			},

			visualMap: {
				type: 'continuous',
				min: 0,
				max: 50,
				dimension: 0,
				calculable: true,
				inRange: {
					color: [
						'#313695',
						// '#4575b4',
						// '#74add1',
						// '#abd9e9',
						// '#e0f3f8',
						// '#ffffbf',
						'#fee090',
						// '#fdae61',
						// '#f46d43',
						// '#d73027',
						'#a50026'
					],
					colorAlpha: [0.9, 1]
				}
			},

			tooltip: {},

			series: getSeries(modes, _chartDataList)
		});
	}

	function getSeries(modes: string[], chartDataList: ChartData[]): echarts.TreemapSeriesOption[] {
		return modes.map(function(mode, idx) {
			let seriesOpt = createSeriesCommon2(idx);
			seriesOpt.name = mode;
			seriesOpt.top = 80;
			seriesOpt.visualDimension = idx === 2 ? 2 : undefined;
			seriesOpt.data = buildData2(idx, chartDataList);
			seriesOpt.levels = getLevelOption2(idx);
			return seriesOpt;
		});
	}

	function createSeriesCommon2(modeIndex: number): echarts.TreemapSeriesOption {
		return {
			type: 'treemap',
			tooltip: {
				formatter: getTooltipFormatter(modeIndex)
			},
			roam: 'move',
			label: {
				position: 'insideTopLeft',
				formatter: function(params: CallbackDataParams) {

					if (!params || !params.value) {
						return '';
					}

					const paramsValue = params.value as number[];

					const result = [
						'{name|' + params.name + '}'
					];

					let rate: number | undefined = paramsValue[0];

					if (rate) {
						result.push(
							echarts.format.addCommas(rate) + '%'
						);
					}

					return result.join('\n');
				},
				rich: {
					budget: {
						fontSize: 22,
						lineHeight: 30,
						color: 'yellow'
					},
					household: {
						fontSize: 14,
						color: '#fff'
					},
					label: {
						fontSize: 9,
						backgroundColor: 'rgba(0,0,0,0.3)',
						color: '#fff',
						borderRadius: 2,
						padding: [2, 4],
						lineHeight: 25,
						align: 'right'
					},
					name: {
						fontSize: 12,
						color: '#fff'
					},
					hr: {
						width: '100%',
						borderColor: 'rgba(255,255,255,0.2)',
						borderWidth: 0.5,
						height: 0,
						lineHeight: 10
					}
				}
			},
			itemStyle: {
				borderColor: 'black'
			},
			levels: getLevelOption()
		};
	}

	function getRate(nodeIndex: number, openPrice: number, closePrice: number, highPrice: number, lowPrice: number) {
		let rate: number | undefined = undefined;

		// highPrice - openPrice rate
		if (nodeIndex === 0 || nodeIndex === 3) {
			rate = ((highPrice - openPrice) / openPrice) * 100;
		}

		// highPrice - lowPrice rate
		if (nodeIndex === 1 || nodeIndex === 4) {
			rate = (((highPrice - lowPrice) / lowPrice) * 100);
		}

		// openPrice - closePrice rate
		if (nodeIndex === 2 || nodeIndex === 5) {
			rate = ((closePrice - openPrice) / openPrice) * 100;
		}

		if (rate) {
			return +rate.toFixed(2);
		}

		return rate;
	}

	function buildData2(modeIndex: number, chartDataList: ChartData[]) {

		if (modeIndex > 2) {
			return chartDataList.map((chartData) => {
				const rate = getRate(
					modeIndex,
					chartData.avgChartItemData.openPrice,
					chartData.avgChartItemData.closePrice,
					chartData.avgChartItemData.highPrice,
					chartData.avgChartItemData.lowPrice
				);

				return {
					id: chartData.market,
					name: chartData.koreanName + '|' + chartData.market,
					value: [
						rate ? rate : 0,
						chartData.avgChartItemData.openPrice,
						chartData.avgChartItemData.closePrice,
						chartData.avgChartItemData.highPrice,
						chartData.avgChartItemData.lowPrice,
						-1
					]
				};
			});
		}

		return chartDataList.map((chartData) => {
			const rate = getRate(
				modeIndex,
				chartData.avgChartItemData.openPrice,
				chartData.avgChartItemData.closePrice,
				chartData.avgChartItemData.highPrice,
				chartData.avgChartItemData.lowPrice
			);

			return {
				id: chartData.market,
				name: chartData.koreanName + ' : ' + chartData.market,
				value: [
					rate ? rate : 0,
					chartData.latestChartItemData.openPrice,
					chartData.latestChartItemData.closePrice,
					chartData.latestChartItemData.highPrice,
					chartData.latestChartItemData.lowPrice,
					-1
				]
			};
		});
	}

	function getLevelOption2(modeIndex: number): echarts.TreemapSeriesOption['levels'] {
		return [
			{
				colorAlpha: [0, 1],
				itemStyle: {
					gapWidth: 1,
					borderWidth: 1
				}
			}
		];
	}

	function getTooltipFormatter(modeIndex: number) {

		return function(params: CallbackDataParams) {
			if (!params || !params.value) {
				return '';
			}

			const paramsValue = params.value as number[];

			if (paramsValue[0] < 0) {
				console.log(paramsValue);
			}

			const rate = `Rate : ${ paramsValue[0] }% <br>`;
			const openPrice = `Open Price : ${ paramsValue[1] } <br>`;
			const closePrice = `Close Price : ${ paramsValue[2] } <br>`;
			const highPrice = `High Price : ${ paramsValue[3] } <br>`;
			const lowPrice = `Low Price : ${ paramsValue[4] } <br>`;
			const tData = `Data : ${ paramsValue[5] } <br>`;

			return [
				'<div class="tooltip-title">' +
				echarts.format.encodeHTML(params.name) +
				'</div>',
				rate,
				openPrice,
				closePrice,
				highPrice,
				lowPrice,
				tData
			].join('');
		};
	}

	function getLevelOption(): echarts.TreemapSeriesOption['levels'] {
		return [
			// {
			// 	color:
			// 		[
			// 			'#c23531',
			// 			'#314656',
			// 			'#61a0a8',
			// 			'#dd8668',
			// 			'#91c7ae',
			// 			'#6e7074',
			// 			'#61a0a8',
			// 			'#bda29a',
			// 			'#44525d',
			// 			'#c4ccd3'
			// 		],
			// 	itemStyle: {
			// 		borderWidth: 3,
			// 		gapWidth: 3
			// 	}
			// },
			{
				color:
					[
						'#313695',
						'#4575b4',
						'#74add1',
						'#abd9e9',
						'#e0f3f8',
						'#ffffbf',
						'#fee090',
						'#fdae61',
						'#f46d43',
						'#d73027',
						'#a50026'
					],
				colorAlpha: [0.5, 1],
				itemStyle: {
					gapWidth: 1
				}
			}
		];
	}

	function onClickOpen() {
		console.log('onChange');
		_openYn = !_openYn;
	}
</script>


<Card class="flex w-full"
			padding="none"
			size="none"
			aria-expanded={_openYn}>
	<Button class="w-full items-center justify-between"
					onclick={onClickOpen}
					pill>
		Today AI Response
		{#if _openYn}
			<ChevronDownOutline />
		{:else}
			<ChevronUpOutline />
		{/if}
	</Button>
	{#if _openYn}
		<div class=" w-full min-w-[900px] min-h-[600px]"
				 transition:slide={{delay: 0, duration: 500}}
				 bind:this={_eChartsElement}>
		</div>
	{/if}
</Card>