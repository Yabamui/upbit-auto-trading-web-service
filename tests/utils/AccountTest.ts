import { test } from 'vitest';
import { v4 as uuidV4 } from 'uuid';
import jwt from 'jsonwebtoken';
import type {
	UAccountData,
	UErrorData,
	UOrderChanceData,
	UOrderData
} from '$lib/server/models/UPbitApiData';
import crypto from 'crypto';
import axios from 'axios';
import moment from 'moment/moment';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import { UPBitOrderSideEnum } from '$lib/common/enums/UPBitOrderSideEnum';
import { UPBitOrderTypeEnum } from '$lib/common/enums/UPBitOrderTypeEnum';
import { UPBitOrderBestTypeEnum } from '$lib/common/enums/UPBitOrderBestTypeEnum';
import { UserPrivateKeyService } from '$lib/server/service/UserPrivateKeyService';

const userId = 1;

// 전체 계좌 조회
test(
	'getAccountListTest',
	async () => {
		const url = `https://api.upbit.com/v1/accounts`;

		const token = await generateToken();

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data as UAccountData[];
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### OrderCloseTest Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Account list:', response);
	},
	{ timeout: 1000 * 60 }
);

async function generateToken(params: string | undefined = undefined) {
	const userPrivateKey = await UserPrivateKeyService.getUserPrivateKey(userId);
	
	if (!userPrivateKey) {
		console.error('### User private key not found.');
		return;
	}
	
	let payload: {
		access_key: string;
		nonce: string;
		query_hash?: string;
		query_hash_alg?: string;
	} = {
		access_key: userPrivateKey.upbitAccessKey,
		nonce: uuidV4()
	};

	if (params) {
		const hash = crypto.createHash('sha512');
		const queryHash = hash.update(params, 'utf-8').digest('hex');

		payload = {
			...payload,
			query_hash: queryHash,
			query_hash_alg: 'SHA512'
		};
	}

	return jwt.sign(payload, userPrivateKey.upbitSecretKey);
}

// 주문 가능 정보
test(
	'getOrderChanceTest',
	async () => {
		const market = 'KRW-XRP';

		const params = await CurrentStringUtils.generateQueryParam({
			market: market
		});

		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/orders/chance?${params}`;

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### OrderCloseTest Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order chance:', response as UOrderChanceData);
	},
	{ timeout: 1000 * 60 }
);

// 체결 대기 주문
test(
	'getOrderOpenTest',
	async () => {
		const market = '';
		const states = ['wait', 'watch'];

		const params = await CurrentStringUtils.generateQueryParam({
			market: market,
			states: states
		});

		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/orders/open?${params}`;

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### OrderCloseTest Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order open:', response as UOrderData[]);
	},
	{ timeout: 1000 * 60 }
);

// 종료된 주문 (Closed Order) 조회
test(
	'getOrderClosedTest',
	async () => {
		const market = '';
		// const start_time = '2025-04-07T08:29:11+09:00';
		const endTime = moment().valueOf();
		// const endTime = moment('2024-11-11T00:00:00+09:00').valueOf();
		const limit = 1000;
		const states = ['done', 'cancel'];

		const params = await CurrentStringUtils.generateQueryParam({
			market: market,
			end_time: endTime,
			limit: limit,
			'states[]': states
		});

		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/orders/closed?${params}`;

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### OrderCloseTest Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order closed:', response);
	},
	{ timeout: 1000 * 60 }
);

// id로 주문리스트 조회
test(
	'getOrderByUUIDsTest',
	async () => {
		const market = '';
		const uuids = ['937cebfd-1ed8-4a03-abf8-ea9002477a92'];

		const params = await CurrentStringUtils.generateQueryParam({
			market: market,
			'uuids[]': uuids
		});

		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/orders/uuids?${params}`;

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### Order By UUIDs Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order by UUIDs:', response);
	},
	{ timeout: 1000 * 60 }
);

// 개별 주문 조회
test(
	'getOrderDetail',
	async () => {
		const uuid = '937cebfd-1ed8-4a03-abf8-ea9002477a92';

		const params = await CurrentStringUtils.generateQueryParam({
			uuid: uuid
		});

		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/order?${params}`;

		const response = await axios
			.get(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### Order Detail Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order detail:', response as UOrderData);
	},
	{ timeout: 1000 * 60 }
);

// 주문하기
test(
	'postOrderTest',
	async () => {
		const market = 'KRW-XRP';
		const side = UPBitOrderSideEnum.BID.key;
		const price = 2700;
		const volume = 3.0;
		const orderType = UPBitOrderTypeEnum.LIMIT.key;
		const timeInForce = '';

		const availableTimeInForceKey = Object.values(UPBitOrderBestTypeEnum).map((item) => item.key);

		if (UPBitOrderTypeEnum.BEST.key === orderType) {
			if (!timeInForce) {
				console.error('### Order Type is BEST, but timeInForce is not set.');
				return;
			}
		}

		if (timeInForce && !availableTimeInForceKey.includes(timeInForce)) {
			console.error('### Invalid timeInForce value.');
			return;
		}

		if (UPBitOrderTypeEnum.LIMIT.key === orderType) {
			if (!price) {
				console.error('### Order Type is LIMIT, but price is not set.');
				return;
			}

			if (!volume) {
				console.error('### Order Type is LIMIT, but volume is not set.');
				return;
			}
		}

		const params = await CurrentStringUtils.generateQueryParam({
			market: market,
			side: side,
			price: price,
			volume: volume,
			order_type: orderType,
			time_in_force: timeInForce
		});
		
		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/orders`;

		const response = await axios
			.post(url, params, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### Order Test Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order response:', response);
	},
	{ timeout: 1000 * 60 }
);

// 주문 취소 접수
test(
	'deleteOrderTest',
	async () => {
		const uuid = '6f1ab828-d6eb-4124-aae2-eb0d6ce79819';

		const params = await CurrentStringUtils.generateQueryParam({
			uuid: uuid
		});
		
		const token = await generateToken(params);

		const options = {
			headers: {
				Authorization: `Bearer ${token}`
			}
		};

		const url = `https://api.upbit.com/v1/order?${params}`;

		const response = await axios
			.delete(url, options)
			.then((response) => {
				return response.data;
			})
			.catch((error) => {
				const errorData = error.response.data as UErrorData;

				console.error(
					'### Order Cancel Error: ' + errorData.error.name + ' - ' + errorData.error.message
				);

				return undefined;
			});

		console.log('Order cancel response:', response);
	},
	{ timeout: 1000 * 60 }
);
