export interface OrderBookData {
	market: string
	timestamp: number
	totalAskSize: number
	totalBidSize: number
	orderBookUnitList: OrderBookUnitData[]
	level: number
}

export interface OrderBookUnitData {
	askPrice: number
	bidPrice: number
	askSize: number
	bidSize: number
}

export interface OrderBookSupportedLevelData {
	market: string
	supportedLevelList: number[]
}