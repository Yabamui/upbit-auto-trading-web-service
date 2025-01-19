import type { UCandleData } from '$lib/server/models/UPbitApiData';
import type { MarketCandleDaysEntity } from '$lib/server/entities/MarketCandleDaysEntity';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { connectToDB } from '$lib/server/config/PGConfig';

export const MarketCandleDaysRepository = {
	findAllByMarket: findAllByMarket,
	findAllByMarketAndCount: findAllByMarketAndCount,
	findAllByMarketAndTimestampIn: findAllByMarketAndTimestampIn,
	findTopByMarketAndCandleDateTimeUtc: findTopByMarketAndCandleDateTimeUtc,
	findAllByMarketAndCandleDateTimeUtcIn: findAllByMarketAndCandleDateTimeUtcIn,

	countAllByMarket: countAllByMarket,
	countAllByMarketAndCandleDateTimeUtc: countAllByMarketAndCandleDateTimeUtc,

	saveOrUpdate: saveOrUpdate
};

async function findAllByMarket(
	market: string,
	to: string | null,
	count: number
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	const query =
		'SELECT * FROM market_candle_days WHERE true AND market = $1 order by timestamp desc limit $2';

	try {
		const result = await dbConn.query(query, [market, count]);

		return result.rows;
	} catch (error) {
		console.error('### MarketCandleDaysRepository.findAllByMarket Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketAndCount(
	market: string,
	count: number
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	const query =
		'SELECT * FROM market_candle_days WHERE true AND market = $1 order by timestamp desc limit $2';

	try {
		const result = await dbConn.query(query, [market, count]);
		return result.rows;
	} catch (error) {
		console.error('### MarketCandleDaysRepository.findAllByMarket Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketAndTimestampIn(
	market: string,
	timestamp: number[]
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	const query =
		'SELECT * FROM market_candle_days WHERE true AND market = $1 AND timestamp = ANY ($2)';

	try {
		const result = await dbConn.query(query, [market, timestamp]);
		return result.rows;
	} catch (error) {
		console.error('### MarketCandleDaysRepository.findAllByMarketAndTimestamp Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByMarket(market: string): Promise<number> {
	const dbConn = await connectToDB();

	const query = 'SELECT COUNT(*) FROM market_candle_days WHERE true AND market = $1';

	try {
		const result = await dbConn.query(query, [market]);

		return parseInt(result.rows[0].count);
	} catch (error) {
		console.error('### MarketCandleDaysRepository.countAllByMarket Error: ' + error);
		return 0;
	} finally {
		dbConn.release();
	}
}

async function findTopByMarketAndCandleDateTimeUtc(market: string, to: string) {
	const dbConn = await connectToDB();

	const query = `select *
                 from market_candle_days
                 where market = $1
                   and candle_date_time_utc = $2
                 limit 1`;

	try {
		const result = await dbConn.query(query, [market, to]);
		return result.rows[0];
	} catch (error) {
		console.error(
			'### MarketCandleDaysRepository.findTopByMarketAndCandleDateTimeUtc Error: ' + error
		);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketAndCandleDateTimeUtcIn(
	market: string,
	candleDateTimeUtc: string[]
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	const query = `SELECT *
                 FROM market_candle_days
                 WHERE true
                   AND market = $1
                   AND candle_date_time_utc = ANY ($2)`;

	try {
		const result = await dbConn.query(query, [market, candleDateTimeUtc]);
		return result.rows;
	} catch (error) {
		console.error(
			'### MarketCandleDaysRepository.findAllByMarketAndCandleDateTimeUtcIn Error: ' + error
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function countAllByMarketAndCandleDateTimeUtc(
	market: string,
	candleDateTimeUtc: string
): Promise<number> {
	const dbConn = await connectToDB();

	const query = `SELECT COUNT(*)
                 FROM market_candle_days
                 WHERE true
                   AND market = $1
                   AND candle_date_time_utc = $2`;

	try {
		const result = await dbConn.query(query, [market, candleDateTimeUtc]);
		return parseInt(result.rows[0].count);
	} catch (error) {
		console.error(
			'### MarketCandleDaysRepository.countAllByMarketAndCandleDateTimeUtc Error: ' + error
		);
		return 0;
	} finally {
		dbConn.release();
	}
}

async function saveOrUpdate(market: string, uCandleDataList: UCandleData[]): Promise<number> {
	const marketCandleDaysEntities: MarketCandleDaysEntity[] =
		await MarketCandleDaysRepository.findAllByMarketAndCandleDateTimeUtcIn(
			market,
			uCandleDataList.map((item) => item.candle_date_time_utc)
		);

	const candleDateTimeUtcSet = new Set<number>(
		marketCandleDaysEntities.map((item) =>
			CurrentDateUtils.toUnixTimestampByDate(item.candle_date_time_utc)
		)
	);

	const updateRecord: Record<string, UCandleData> = {};
	const insertList = [];

	for (const item of uCandleDataList) {
		const unixTimestamp = CurrentDateUtils.toUnixTimestampByString(item.candle_date_time_utc);

		if (candleDateTimeUtcSet.has(unixTimestamp)) {
			updateRecord[item.candle_date_time_utc] = item;
			continue;
		}

		insertList.push([
			item.timestamp,
			item.market,
			item.candle_date_time_utc,
			item.candle_date_time_kst,
			item.opening_price,
			item.high_price,
			item.low_price,
			item.trade_price,
			item.candle_acc_trade_price,
			item.candle_acc_trade_volume,
			item.prev_closing_price || 0,
			item.change_price || 0,
			item.change_rate || 0,
			item.converted_trade_price || 0
		]);
	}

	const insertResult = await insertBulkMarketCandleDays(insertList);
	const updateResult = await updateMarketCandleDays(updateRecord);

	if (insertResult && updateResult) {
		return await countAllByMarket(market);
	} else {
		return 0;
	}
}

async function insertBulkMarketCandleDays(list: unknown[][]): Promise<boolean> {
	if (list.length === 0) {
		return true;
	}

	const values = list
		.map((_, i) => {
			const v = _.map((__, j) => `$${i * 14 + j + 1}`).join(', ');

			return `(${v})`;
		})
		.join(',');

	const query = `INSERT INTO market_candle_days
                 (timestamp,
                  market,
                  candle_date_time_utc,
                  candle_date_time_kst,
                  opening_price,
                  high_price,
                  low_price,
                  trade_price,
                  candle_acc_trade_price,
                  candle_acc_trade_volume,
                  prev_closing_price,
                  change_price,
                  change_rate,
                  converted_trade_price)
                 VALUES ${ values }`;

	const dbConn = await connectToDB();

	try {
		await dbConn.query(query, list.flat());
		return true;
	} catch (error) {
		console.error('### CandleInfoInsertTest Error: ' + error);
		return false;
	} finally {
		dbConn.release();
	}
}

async function updateMarketCandleDays(
	uCandleDataRecord: Record<string, UCandleData>
): Promise<boolean> {
	const updateQuery = `
      UPDATE market_candle_days
      SET timestamp               = $1,
          market                  = $2,
          candle_date_time_utc    = $3,
          candle_date_time_kst    = $4,
          opening_price           = $5,
          high_price              = $6,
          low_price               = $7,
          trade_price             = $8,
          candle_acc_trade_price  = $9,
          candle_acc_trade_volume = $10,
          prev_closing_price      = $11,
          change_price            = $12,
          change_rate             = $13,
          converted_trade_price   = $14
      WHERE market = $2
        AND candle_date_time_utc = $3`;

	const dbConn = await connectToDB();

	for (const key of Object.keys(uCandleDataRecord)) {
		const item = uCandleDataRecord[key];

		const values = [
			item.timestamp,
			item.market,
			item.candle_date_time_utc,
			item.candle_date_time_kst,
			item.opening_price,
			item.high_price,
			item.low_price,
			item.trade_price,
			item.candle_acc_trade_price,
			item.candle_acc_trade_volume,
			item.prev_closing_price || 0,
			item.change_price || 0,
			item.change_rate || 0,
			item.converted_trade_price || 0
		];

		try {
			await dbConn.query(updateQuery, values);
		} catch (error) {
			console.error('### MarketCandleDaysRepository.updateMarketCandleDays Error: ' + error);
			break;
		}
	}

	dbConn.release();
	return true;
}
