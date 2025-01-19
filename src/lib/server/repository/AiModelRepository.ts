import type { AiModelEntity } from '$lib/server/entities/AiModelEntity';
import { connectToDB } from '$lib/server/config/PGConfig';

export const AiModelRepository = {
	findAll: findAll,
	findTopById: findTopById,
	findAllByIdIn: findAllByIdIn,
	createTable: createTable,
	insertInitData: insertInitData
};

async function findAll() {
	const dbConn = await connectToDB();

	const query = `
      select *
      from ai_model
      where true;`;

	try {
		const result = await dbConn.query(query);
		return result.rows as AiModelEntity[];
	} catch (error) {
		console.error('### AiModelRepository.findAll Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function findTopById(id: number) {
	const dbConn = await connectToDB();

	const query = `
      select *
      from ai_model
      where id = $1;`;

	try {
		const result = await dbConn.query(query, [id]);
		return result.rows[0] as AiModelEntity;
	} catch (error) {
		console.error('### AiModelRepository.findTopById Error: ' + error);
		return null;
	} finally {
		dbConn.release();
	}
}

async function findAllByIdIn(idList: string[]) {
	const dbConn = await connectToDB();

	const query = `
      select *
      from ai_model
      where id = any ($1);`;

	try {
		const queryResult = await dbConn.query(query, [idList]);
		return queryResult.rows as AiModelEntity[];
	} catch (error) {
		console.error('### AiModelRepository.findAllByIdIn Error: ' + error);
		return [];
	} finally {
		dbConn.release();
	}
}

async function createTable() {
	const dbConn = await connectToDB();

	const tableExistQuery = `
      select exists (select
                     from information_schema.tables
                     where table_name = 'ai_model'
                       and table_schema = 'public');`;

	try {
		const tableExistResult = await dbConn.query(tableExistQuery);

		if (tableExistResult.rows[0].exists) {
			return;
		}

		const createTableQueryList = [
			`
          create table ai_model
          (
              id                serial primary key not null,

              ai_code           varchar(40)        not null,
              ai_name           varchar(255)       not null,
              model_code        varchar(255)       not null,
              model_name        varchar(255)       not null,
              model_description varchar(512)       null     default '',

              created_at        timestamp          not null default now(),
              updated_at        timestamp          not null default now(),
              deleted_at        timestamp
          );`,
			`comment on table ai_model is 'AI 모델 정보';`,
			`comment on column ai_model.id is 'PK';`,
			`comment on column ai_model.ai_code is 'AI 코드';`,
			`comment on column ai_model.ai_name is 'AI 이름';`,
			`comment on column ai_model.model_code is '모델 코드';`,
			`comment on column ai_model.model_name is '모델명';`,
			`comment on column ai_model.model_description is '모델 설명';`,
			`comment on column ai_model.created_at is '생성일';`,
			`comment on column ai_model.updated_at is '수정일';`,
			`comment on column ai_model.deleted_at is '삭제일';`
		];

		for (const item of createTableQueryList) {
			await dbConn.query(item);
		}
	} catch (error) {
		console.error('### AiModelRepository.createTable Error: ' + error);
	} finally {
		dbConn.release();
	}
}

async function insertInitData() {
	const aiModelCodeList: AiModelEntity[] = await findAll();

	const dbConn = await connectToDB();

	try {
		const modelCodeList = aiModelCodeList.map((item) => item.model_code);

		const defaultDataList = [
			[
				'GEMINI',
				'Gemini AI',
				'gemini-1.5-pro',
				'Gemini 1.5 Pro',
				'Gemini 1.5 Pro는 다양한 추론 작업에 최적화된 중간 규모 멀티모달 모델입니다. 1.5 Pro는 2시간 분량의 동영상, 19시간 분량의 오디오, 6만 줄의 코드가 포함된 코드베이스, 2,000페이지 분량의 텍스트 등 대량의 데이터를 한 번에 처리할 수 있습니다.'
			],
			[
				'GEMINI',
				'Gemini AI',
				'gemini-1.5-flash',
				'Gemini 1.5 Flash',
				'Gemini 1.5 Flash는 다양한 작업을 확장할 수 있는 빠르고 다목적의 멀티모달 모델입니다.'
			],
			[
				'GEMINI',
				'Gemini AI',
				'gemini-2.0-flash-exp',
				'Gemini 2.0 Flash EXP',
				'Gemini 2.0 Flash는 우수한 속도, 네이티브 도구 사용, 멀티모달 생성, 100만 개 토큰 컨텍스트 윈도우를 비롯한 차세대 기능과 향상된 기능을 제공합니다.'
			]
		];

		const defaultDataInsertQuery = `
        insert into ai_model (ai_code, ai_name, model_code, model_name, model_description)
        values ($1, $2, $3, $4, $5);`;

		for (const defaultData of defaultDataList) {
			if (modelCodeList.includes(defaultData[2])) {
				continue;
			}

			await dbConn.query(defaultDataInsertQuery, defaultData);
		}
	} catch (error) {
		console.error('### AiModelRepository.insertInitData Error: ' + error);
	} finally {
		dbConn.release();
	}
}
