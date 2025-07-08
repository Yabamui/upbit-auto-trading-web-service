import { test } from 'vitest';
import { connectToDB } from '$lib/server/config/PGConfig';
import { MarketCurrencyCode } from '$lib/common/enums/MarketCurrencyType';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import type { AiLatestInferenceEntity } from '$lib/server/entities/AiResponsesEntity';

test(
	'aiResponsesRepositoryTest',
	async () => {
		const dbConn = await connectToDB();

		const userId = 1;
		const marketCurrency = MarketCurrencyCode.KRW.code;
		const candleUnit = UPBitCandleUnitEnum.days.key;
		const candleTimeZone = UPBitCandleTimeZones.utc;
		const nowDateUtc = CurrentDateUtils.getNowDateString(candleTimeZone);

		const query = `
        with query_result as
                 (select ar.id,
                         ar.user_id,
                         ar.market,
                         ar.ai_model_id,
                         ar.ai_prompts_id,
                         ar.ai_response_models_id,
                         ar.candle_unit,
                         ar.candle_count,
                         ar.candle_time_zone,
                         ar.candle_date_time_begin,
                         ar.candle_date_time_end,
                         ar.created_at,
                         ar.updated_at,
                         ar.response -> 'totalJudgement'   as total_judgement,
                         ar.response -> 'totalJudgementKr' as total_judgement_kr,
                         jsonItems ->> 'date'              as date,
                         jsonItems ->> 'time'              as time,
                         jsonItems ->> 'lowPrice'          as low_price,
                         jsonItems ->> 'highPrice'         as high_price,
                         jsonItems ->> 'openPrice'         as open_price,
                         jsonItems ->> 'closePrice'        as close_price,
                         jsonItems ->> 'evaluation'        as evaluation,
                         jsonItems ->> 'judgementBasis'    as judgement_basis,
                         jsonItems ->> 'judgementBasisKr'  as judgement_basis_kr,
                         row_number() over (
                             partition by ar.market, jsonItems ->> 'date' order by ar.id desc
                             )                             as rn
                  from ai_responses ar,
                       jsonb_array_elements(ar.response -> 'items') as jsonItems
                  where true
                    and ar.deleted_at is null
                    and ar.user_id = $1
                    and ar.market like $2
                    and ar.candle_unit = $3
                    and ar.candle_time_zone = $4
                    and (jsonItems ->> 'date')::varchar >= $5)
        select *
        from query_result
        where rn = 1
        ;`;

		try {
			const result = await dbConn.query(query, [
				userId,
				`${marketCurrency}%`,
				candleUnit,
				candleTimeZone,
				nowDateUtc
			]);

			if (!result.rows.length) {
				LoggingUtils.info('aiResponsesRepositoryTest', `No data found.`);
				return;
			}

			const queryResultList: AiLatestInferenceEntity[] = result.rows;

			const queryResultByMarket = queryResultList.reduce(
				(acc, queryResult) => {
					if (!acc[queryResult.market]) {
						acc[queryResult.market] = [];
					}

					acc[queryResult.market].push(queryResult);
					return acc;
				},
				{} as Record<string, AiLatestInferenceEntity[]>
			);

			Object.entries(queryResultByMarket).forEach(([market, queryResultList]) => {
				console.log(`Market: ${market}`);
				queryResultList
					.sort((a, b) => a.date.localeCompare(b.date))
					.forEach((queryResult) => {
						console.log(
							'Created At: ',
							CurrentDateUtils.toFormatStringByDate(queryResult.created_at)
						);
						console.log(
							'Updated At: ',
							CurrentDateUtils.toFormatStringByDate(queryResult.updated_at)
						);
						console.log(`Date: ${queryResult.date}`);
						console.log(`Time: ${queryResult.time}`);
						console.log(`Low Price: ${queryResult.low_price}`);
						console.log(`High Price: ${queryResult.high_price}`);
						console.log(`Open Price: ${queryResult.open_price}`);
						console.log(`Close Price: ${queryResult.close_price}`);
					});
			});
		} catch (error) {
			LoggingUtils.error('aiResponsesRepositoryTest', `${error}`);
		} finally {
			dbConn.release();
		}
	},
	{ timeout: 1000 * 60 }
);
