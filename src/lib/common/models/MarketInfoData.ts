import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';

export interface MarketInfoData {
	id: number;
	market: string;
	koreanName: string;
	englishName: string;
	warning: boolean;
	priceFluctuations: boolean;
	tradingVolumeSoaring: boolean;
	depositionAmountSoaring: boolean;
	globalPriceDifference: boolean;
	concentrationOfSmallAccounts: boolean;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export const MarketInfoDataUtils = {
	toMarketInfoData: (entity: MarketInfoEntity): MarketInfoData => {
		return {
			id: entity.id,
			market: entity.market,
			koreanName: entity.korean_name,
			englishName: entity.english_name,
			warning: entity.warning,
			priceFluctuations: entity.price_fluctuations,
			tradingVolumeSoaring: entity.trading_volumeSoaring,
			depositionAmountSoaring: entity.deposition_amountSoaring,
			globalPriceDifference: entity.global_price_difference,
			concentrationOfSmallAccounts: entity.concentration_of_small_accounts,
			createdAt: entity.created_at,
			updatedAt: entity.updated_at,
			deletedAt: entity.deleted_at
		};
	},
};


