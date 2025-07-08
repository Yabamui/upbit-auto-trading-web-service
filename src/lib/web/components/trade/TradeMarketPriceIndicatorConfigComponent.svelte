<script lang="ts">

	import type { TradeMarketPriceIndicatorData } from '$lib/common/models/TradeViewData';
	import {
		Button,
		Input,
		Label,
		Modal
	} from 'flowbite-svelte';

	let {
		openModalYn = $bindable(),
		indicatorValue,
		updateIndicatorValueCallback
	}: {
		openModalYn: boolean,
		indicatorValue: TradeMarketPriceIndicatorData,
		updateIndicatorValueCallback: (value: TradeMarketPriceIndicatorData) => void
	} = $props();

	let _indicatorValue: TradeMarketPriceIndicatorData = $state(indicatorValue);

	function closeModal() {
		openModalYn = false;
	}

	function onclickUpdateIndicatorValue() {
		console.log(_indicatorValue)
		openModalYn = false;
		updateIndicatorValueCallback(_indicatorValue);
	}
</script>

<Modal
	bind:open={openModalYn}
	size="sm"
	title="마켓 목록 시세 지표 설정"
	autoclose={false}
	class="w-full">
	<div class="flex flex-col space-y-2">
		<div class="grid grid-cols-3 gap-2">
			<Label class="space-y-2">
				<div class="text-[11px]">
					MACD Fast
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.macd.fastPeriod}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					MACD Slow
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.macd.slowPeriod}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					MACD Signal
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.macd.signalPeriod}
				/>
			</Label>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<Label class="space-y-2">
				<div class="text-[11px]">
					RSI Period
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.rsi.period}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					RSI Smooth
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.rsi.signalPeriod}
				/>
			</Label>
		</div>
		<div class="grid grid-cols-3 gap-2">
			<Label class="space-y-2">
				<div class="text-[11px]">
					Stoch K Period
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochastic.period}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					Stoch K Smooth
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochastic.signalPeriod}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					Stoch D Smooth
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochastic.maPeriod}
				/>
			</Label>
		</div>
		<div class="grid grid-cols-4 gap-2">
			<Label class="space-y-2">
				<div class="text-[11px]">
					StochRSI period
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochasticRSI.rsiPeriod}
				/>
			</Label>
			<Label class="space-y-2">

				<div class="text-[11px]">
					StochRSI period
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochasticRSI.stochasticPeriod}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					StochRSI K Smooth
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochasticRSI.signalPeriod}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					StochRSI D Smooth
				</div>
				<Input
					type="number"
					bind:value={_indicatorValue.stochasticRSI.maPeriod}
				/>
			</Label>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<Label class="space-y-2">
				<div class="text-[11px]">
					Prophet Date
				</div>
				<Input
					type="date"
					bind:value={_indicatorValue.prophetDate}
				/>
			</Label>
			<Label class="space-y-2">
				<div class="text-[11px]">
					Ai Date
				</div>
				<Input
					type="date"
					bind:value={_indicatorValue.aiDate}
				/>
			</Label>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<div class="flex flex-row w-full items-center justify-end">
			<Button type="button"
							onclick={onclickUpdateIndicatorValue}>
				완료
			</Button>
			<Button type="button"
							color="light"
							onclick={closeModal}>
				취소
			</Button>
		</div>
	</svelte:fragment>
</Modal>

