import { test } from 'vitest';
import { AiAnalyticsService } from '$lib/server/service/AiAnalyticsService';

test('create ai analytics request test', async () => {
	/**
	 * insert into public.market_info (market, korean_name)
	 * values  ('KRW-BTC', '비트코인'),
	 *         ('KRW-ETH', '이더리움'),
	 *         ('BTC-ETH', '이더리움'),
	 *         ('BTC-XRP', '리플'),
	 *         ('BTC-ETC', '이더리움클래식'),
	 *         ('BTC-CVC', '시빅'),
	 *         ('BTC-DGB', '디지바이트'),
	 *         ('BTC-SC', '시아코인');
	 */
	const userId = 1;
	const marketCurrency = 'KRW-%';
	const aiModelId = 2;
	const candleType = 'DAYS';
	const candleCount = 200;
	const candleTimeZone = 'UTC';
	
	await AiAnalyticsService.createAiAnalyticsRequest(
		userId,
		marketCurrency,
		aiModelId,
		candleType,
		candleCount,
		candleTimeZone
	);
},{ timeout: 1000 * 60 * 5 });