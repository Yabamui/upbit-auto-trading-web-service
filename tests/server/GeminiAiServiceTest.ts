import { test } from 'vitest';
import { GEMINI_API_KEY } from '$env/static/private';
import { GoogleGenerativeAI, type ResponseSchema, SchemaType } from '@google/generative-ai';
import {
	type AiRequestModelCase1Data,
	type AiRequestModelCase1DataItem,
	AiRequestModelDataUtils
} from '$lib/common/models/AiRequestModelData';
import { UPBitCandleTimeZones, UPBitCandleUnitEnum } from '$lib/common/enums/UPBitCandleEnum';
import { MarketInfoRepository } from '$lib/server/repository/MarketInfoRepository';
import type { MarketInfoEntity } from '$lib/server/entities/MarketInfoEntity';
import type { CandleData } from '$lib/common/models/CandleData';
import { CandleService } from '$lib/server/service/CandleService';
import { CurrentDateUtils } from '$lib/common/utils/CurrentDateUtils';
import { CandleTypeZoneCode } from '$lib/common/enums/CandleTypeZoneCode';

test(
	'gemini content generation test',
	async () => {
		const responseSchema = {
			type: SchemaType.OBJECT,
			description: 'Object of Results',
			required: ['totalJudgement', 'totalJudgementKr', 'timeZone', 'items'],
			properties: {
				totalJudgement: {
					type: SchemaType.STRING,
					description: 'Total Logic and Data basis supporting the judgment of the coin',
					nullable: false
				},
				totalJudgementKr: {
					type: SchemaType.STRING,
					description: 'Korean translation of totalJudgement',
					nullable: false
				},
				timeZone: {
					type: SchemaType.STRING,
					description: 'Timezone information based on inference data output',
					enum: ['KST', 'UTC'],
					nullable: false
				},
				items: {
					type: SchemaType.ARRAY,
					description: 'List of inference data items',
					items: {
						type: SchemaType.OBJECT,
						description: 'Daily Inference Data',
						properties: {
							date: {
								type: SchemaType.STRING,
								description: 'Inference Data Date in YYYY-MM-DD format',
								nullable: false
							},
							time: {
								type: SchemaType.STRING,
								description: 'Inference Data Time in HH:MM:SS format',
								nullable: false
							},
							openPrice: {
								type: SchemaType.NUMBER,
								description: "Inference Data open price. Previous day's close price.",
								nullable: false
							},
							highPrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data high price',
								nullable: false
							},
							lowPrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data low price',
								nullable: false
							},
							closePrice: {
								type: SchemaType.NUMBER,
								description: 'Inference Data close price',
								nullable: false
							},
							judgementBasis: {
								type: SchemaType.STRING,
								description: 'Logic and Data basis supporting the judgment',
								nullable: false
							},
							judgementBasisKr: {
								type: SchemaType.STRING,
								description: 'Korean translation of judgementBasis',
								nullable: false
							},
							evaluation: {
								type: SchemaType.STRING,
								description: 'Inference Data evaluation',
								enum: ['hold', 'buy', 'sell'],
								nullable: false
							}
						},
						required: [
							'date',
							'time',
							'openPrice',
							'highPrice',
							'lowPrice',
							'closePrice',
							'judgementBasis',
							'judgementBasisKr',
							'evaluation'
						]
					}
				}
			}
		} as ResponseSchema;

		const temperature = 1.0;

		const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
			generationConfig: {
				temperature: temperature,
				responseMimeType: 'application/json',
				responseSchema: responseSchema
			}
		});

		const requestModelData: AiRequestModelCase1Data | null = await getAiRequestModelCase1Data();

		if (requestModelData === null) {
			console.error('### requestModelData is null');
			return;
		}
		
		const systemInstruction = {
			role: 'system',
			parts: [
				{
					text: 'You are a cryptocurrency market data analysis expert. You are proficient in time series analysis and chart analysis, and you can accurately predict future market lows, highs, and investment opinions (buy, sell, hold) based on past market data.'
				},
				{
					text: 'You provide an objective market outlook by comprehensively analyzing various factors such as price fluctuations, market sentiment, and investor behavior.'
				},
				{
					text: 'You perform comprehensive market analysis using a variety of data, including cryptocurrency trading volume, market capitalization, on-chain data, and macroeconomic indicators (such as inflation, interest rates, and geopolitical events).'
				},
				{
					text: 'Your predictions are always based on evidence and uncertainties are clearly stated.'
				},
				{
					text: 'You do not provide investment advice, and you focus solely on providing information.'
				},
				{
					text: 'All information provided should be used for educational purposes only and should not be used as a basis for investment decisions.'
				}
			]
		};

		const result = await model.generateContent({
			systemInstruction: systemInstruction,
			contents: [
				{
					role: 'user',
					parts: [
						{
							text: 'The most important requirement is that it should contain information for the next 7 days from now.'
						}
					]
				},
				{
					role: 'user',
					parts: [{ text: 'Input Data : \n' + JSON.stringify(requestModelData) }]
				}
			],
		});

		console.log(result);

		console.log(result.response.text());
	},
	{ timeout: 1000 * 60 * 60 }
);

async function getAiRequestModelCase1Data() {
	const market = 'KRW-ETH';
	const candleType = UPBitCandleUnitEnum.days.key;
	const candleCount = 200;
	const candleTimeZone = UPBitCandleTimeZones.utc;

	const marketEntity: MarketInfoEntity | null = await MarketInfoRepository.findTopByMarket(market);

	if (marketEntity === null) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### getAiRequestModelCase1Data marketEntity is null`
		);
		return null;
	}

	const candleDataList: CandleData[] = await CandleService.getCandleDataList(
		marketEntity.market,
		candleType,
		candleCount,
		''
	);

	if (candleDataList.length === 0) {
		console.error(
			`${CurrentDateUtils.getNowDateTimeString()} :: ### getAiRequestModelCase1Data candleDataList is empty`
		);
		return null;
	}

	const currency = marketEntity.market.split('-')[0];

	let beginDate: Date | undefined = undefined;
	let endDate: Date | undefined = undefined;

	const itemList: AiRequestModelCase1DataItem[] = candleDataList.map((item) => {
		const date =
			CandleTypeZoneCode.UTC === candleTimeZone
				? CurrentDateUtils.toDateTimeByDate(item.candleDateTimeUtc)
				: CurrentDateUtils.toDateTimeByDate(item.candleDateTimeKst);

		if (!beginDate || beginDate > date) {
			beginDate = date;
		}

		if (!endDate || endDate < date) {
			endDate = date;
		}

		return AiRequestModelDataUtils.toAiRequestModelCase1DataItem(item, candleTimeZone);
	});

	return AiRequestModelDataUtils.toAiRequestModelCase1Data(
		marketEntity.market,
		marketEntity.korean_name,
		marketEntity.english_name,
		currency,
		beginDate,
		endDate,
		candleTimeZone,
		itemList
	);
}
