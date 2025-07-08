import type { MarketCandleDaysEntity } from '$lib/server/entities/MarketCandleDaysEntity';
import { connectToDB } from '$lib/server/config/PGConfig';
import { UPBitCandleTimeZones } from '$lib/common/enums/UPBitCandleEnum';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

export const MarketCandleDaysRepository = {
	findAllByMarketAndBeginDateTimeAndCount: findAllByMarketAndBeginDateTimeAndCount,
	findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte:
		findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte,
	findAllByMarketLikeAndRowNumberLte: findAllByMarketLikeAndRowNumberLte
};

async function findAllByMarketAndBeginDateTimeAndCount(
	market: string,
	candleTimeZone: string,
	beginDateTime: string | null,
	count: number
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	let query = '';

	if (UPBitCandleTimeZones.utc === candleTimeZone) {
		query = `
        SELECT *
        FROM market_candle_days
        WHERE true
          and market = $1
          and ($2::timestamp is null or candle_date_time_utc <= $2::timestamp)
        ORDER BY candle_date_time_utc desc
		`;
	} else {
		query = `
        SELECT *
        FROM market_candle_days
        WHERE true
          and market = $1
          and ($2::timestamp is null or candle_date_time_kst <= $2::timestamp)
        ORDER BY candle_date_time_kst desc
		`;
	}

	if (count > 0) {
		query += `
				LIMIT $3
		`;
	}

	try {
		let result;

		if (count > 0) {
			result = await dbConn.query(query, [market, beginDateTime, count]);
		} else {
			result = await dbConn.query(query, [market, beginDateTime]);
		}

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows;
	} catch (error) {
		console.error(error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte(
	marketCurrency: string,
	candleTimeZone: string,
	beginDateTime: string | null,
	count: number
): Promise<MarketCandleDaysEntity[]> {
	const dbConn = await connectToDB();

	let query = '';

	if (UPBitCandleTimeZones.utc === candleTimeZone) {
		query = `
        with query_result as
                 (select *,
                         row_number() over (partition by market order by timestamp desc) as row_number
                  from market_candle_days
                  where true
                    and market like $1
                    and ($2::timestamp is null or candle_date_time_utc <= $2::timestamp))
        select *
        from query_result
        where true
		`;
	} else {
		query = `
        with query_result as
                 (select *,
                         row_number() over (partition by market order by timestamp desc) as row_number
                  from market_candle_days
                  where true
                    and market like $1
                    and ($2::timestamp is null or candle_date_time_kst <= $2::timestamp))
        select *
        from query_result
        where true
		`;
	}

	if (count > 0) {
		query += `
				and row_number <= $3
		`;
	}

	try {
		let result;

		if (count > 0) {
			result = await dbConn.query(query, [`${marketCurrency}%`, beginDateTime, count]);
		} else {
			result = await dbConn.query(query, [`${marketCurrency}%`, beginDateTime]);
		}

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows;
	} catch (error) {
		LoggingUtils.error(
			'MarketCandleDaysRepository.findAllByMarketCurrencyAndBeginDateTimeAndCountAndRowNumberLte',
			`${error}`
		);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findAllByMarketLikeAndRowNumberLte(marketCurrency: string, rowNumber: number) {
	const dbConn = await connectToDB();

	const query = `
      with query_result as
               (select *,
                       row_number() over (partition by market order by timestamp desc) as row_number
                from market_candle_days
                where true
                  and market like $1)
      select *
      from query_result
      where row_number <= $2
	`;

	try {
		const result = await dbConn.query(query, [`${marketCurrency}%`, rowNumber]);

		if (!result || result.rowCount === 0) {
			return [];
		}

		return result.rows as MarketCandleDaysEntity[];
	} catch (error) {
		LoggingUtils.error('MarketCandleDaysRepository.findAllByMarketLikeAndRowNumberLte', `${error}`);
		return [];
	} finally {
		dbConn.release();
	}
}
