import type { UMarketData } from '$lib/server/models/UPbitApiData';
import moment from 'moment';
import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';
import { connectToDB } from '$lib/server/config/PGConfig';

export const MarketInfoRepository = {
	saveAll: saveAll,
	findTopByMarket: findTopByMarket,
	findAllBy: findAllBy,
	findAllByMarketLike: findAllByMarketLike,
	findAllByMarketIn: findAllByMarketIn
};

async function findTopByMarket(code: string) {
	const dbConn = await connectToDB();

	const query = 'SELECT * FROM market_info WHERE market = $1';

	try {
		const result = await dbConn.query(query, [code]);

		if (!result || result.rowCount === 0) {
			return null;
		}

		return result.rows[0] as MarketInfoEntity;
	} catch (error) {
		console.error('### MarketInfoRepository.findTopByMarket Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllBy() {
	const dbConn = await connectToDB();

	const query = 'SELECT * FROM market_info WHERE true ORDER BY id';

	try {
		const result = await dbConn.query(query);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as MarketInfoEntity[];
	} catch (error) {
		console.error('### MarketInfoRepository.findAllBy Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketLike(market: string) {
	const dbConn = await connectToDB();

	const query = 'SELECT * FROM market_info WHERE market LIKE $1';

	try {
		const result = await dbConn.query(query, [market]);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as MarketInfoEntity[];
	} catch (error) {
		console.error('### MarketInfoRepository.findAllByMarketLike Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketIn(marketList: string[]) {
	const dbConn = await connectToDB();

	const query = 'SELECT * FROM market_info WHERE market = any($1)';

	try {
		const queryResult = await dbConn.query(query, [marketList]);

		if (!queryResult || queryResult.rowCount === 0) {
			return [];
		}

		return queryResult.rows as MarketInfoEntity[];
	} catch (error) {
		console.error('### MarketInfoRepository.findAllByMarketIn Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function saveAll(marketData: UMarketData[]) {
	const marketInfoEntityList: MarketInfoEntity[] = await MarketInfoRepository.findAllBy();

	const groupResult = marketInfoEntityList.reduce(
		(acc, item) => {
			if (!acc[item.market]) {
				acc[item.market] = item;
			}

			return acc;
		},
		{} as Record<string, MarketInfoEntity>
	);

	const insertQuery =
		'INSERT INTO market_info (market, ' +
		'korean_name, ' +
		'english_name, ' +
		'warning, ' +
		'price_fluctuations, ' +
		'trading_volume_soaring, ' +
		'deposition_amount_soaring, ' +
		'global_price_difference, ' +
		'concentration_of_small_accounts) VALUES ' +
		'($1, $2, $3, $4, $5, $6, $7, $8, $9)';

	const updateQuery =
		'UPDATE market_info SET ' +
		'warning = $2, ' +
		'price_fluctuations = $3, ' +
		'trading_volume_soaring = $4, ' +
		'deposition_amount_soaring = $5, ' +
		'global_price_difference = $6, ' +
		'concentration_of_small_accounts = $7 ' +
		'updated_at = $8' +
		'WHERE market = $1';

	const dbConn = await connectToDB();

	try {
		for (const data of marketData) {
			const marketInfoData = groupResult[data.market];

			if (marketInfoData) {
				await dbConn.query(updateQuery, [
					data.market,
					data.market_event.warning,
					data.market_event.caution.PRICE_FLUCTUATIONS,
					data.market_event.caution.TRADING_VOLUME_SOARING,
					data.market_event.caution.DEPOSIT_AMOUNT_SOARING,
					data.market_event.caution.GLOBAL_PRICE_DIFFERENCES,
					data.market_event.caution.CONCENTRATION_OF_SMALL_ACCOUNTS,
					moment().unix()
				]);
			}

			await dbConn.query(insertQuery, [
				data.market,
				data.korean_name,
				data.english_name,
				data.market_event.warning,
				data.market_event.caution.PRICE_FLUCTUATIONS,
				data.market_event.caution.TRADING_VOLUME_SOARING,
				data.market_event.caution.DEPOSIT_AMOUNT_SOARING,
				data.market_event.caution.GLOBAL_PRICE_DIFFERENCES,
				data.market_event.caution.CONCENTRATION_OF_SMALL_ACCOUNTS
			]);
		}
	} catch (error) {
		console.error('### MarketInfoRepository.saveAll Error: ' + error);
	} finally {
		dbConn.release();
	}

	return MarketInfoRepository.findAllBy();
}
