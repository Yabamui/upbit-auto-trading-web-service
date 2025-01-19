export interface AiAnalyticsCandleData {
	candleName: string;
	itemList: AiAnalyticsCandleItemData[];
	highColor: string | undefined;
	lowColor: string | undefined;
	highBorderColor: string | undefined;
	lowBorderColor: string | undefined;
}

export interface AiAnalyticsCandleItemData {
	openingPrice: number | undefined;
	tradePrice: number | undefined;
	lowPrice: number | undefined;
	highPrice: number | undefined;
	candleAccTradePrice: number | undefined;
	candleDateTimeKst: string
}
