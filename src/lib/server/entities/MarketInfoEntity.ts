export interface MarketInfoEntity {
	id: number;
	market: string;
	korean_name: string;
	english_name: string;
	warning: boolean;
	price_fluctuations: boolean;
	trading_volumeSoaring: boolean;
	deposition_amountSoaring: boolean;
	global_price_difference: boolean;
	concentration_of_small_accounts: boolean;
	created_at: number;
	updated_at: number;
	deleted_at: number | null;
}