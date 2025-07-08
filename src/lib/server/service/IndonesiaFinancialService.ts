import { FinanceService } from '$lib/server/service/FinanceService';
import { FINANCE_API_HOST } from '$env/static/private';
import axios from 'axios';
import type { ResponseObject } from '$lib/common/models/ResponseData';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { LoggingUtils } from '$lib/common/utils/LoggingUtils';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
import type { IndonesiaFinancialReportResultData } from '$lib/common/models/IndonesiaFinancialData';

const defaultOption = {
	headers: {
		'Content-Type': 'application/json'
	},
	timeout: 1000 * 30 // 30 seconds
};

export const IndonesiaFinancialService = {
	createReport: createReport,
	getReportList: getReportList,
	uploadReportExcel: uploadReportExcel,
	requestCreateExcelMerge: requestCreateExcelMerge,
};

async function createReport(reportJson: string) {
	const path = '/global/indonesia/financial-statements/v1/all';
	
	const token = await FinanceService.createAuth();
	
	if (!token) {
		LoggingUtils.error('createReport', 'token is null');
		return undefined;
	}
	
	const url = `${FINANCE_API_HOST}${path}`;
	
	const body = JSON.parse(reportJson);
	
	const options = {
		...defaultOption,
		headers: {
			...defaultOption.headers,
			Authorization: `Bearer ${token}`
		}
	}
	
	return axios
		.post(url, body, options)
		.then((response) => {
			const responseObject: ResponseObject<unknown> = response.data;
			
			if (ResponseCode.success.code === responseObject.code) {
				return response.data as string
			} else {
				LoggingUtils.error('createReport fail', responseObject.message);
				return undefined;
			}
		})
		.catch((error) => {
			LoggingUtils.error('createReport error', error);
			return undefined;
		});
}

async function getReportList(year: number, period: string): Promise<IndonesiaFinancialReportResultData[]> {
	const path = '/global/indonesia/financial-statements/v1/report-list';
	
	const token = await FinanceService.createAuth();
	
	if (!token) {
		LoggingUtils.error('getReportList', 'token is null');
		return [];
	}
	
	const params = await CurrentStringUtils.generateQueryParam({
		reportYear: year,
		reportPeriod: period
	});
	
	const url = `${FINANCE_API_HOST}${path}?${params}`;
	
	const options = {
		...defaultOption,
		headers: {
			...defaultOption.headers,
			Authorization: `Bearer ${token}`
		}
	}
	
	return axios
		.get(url, options)
		.then((response) => {
			const responseObject: ResponseObject<unknown> = response.data;
			
			if (ResponseCode.success.code === responseObject.code) {
				const data = responseObject.data as {
					list: IndonesiaFinancialReportResultData[]
				};
				
				return data.list;
			} else {
				LoggingUtils.error('getReportList fail', responseObject.message);
				return [];
			}
		})
		.catch((error) => {
			LoggingUtils.error('getReportList error', error);
			return [];
		});
}

async function uploadReportExcel(file: File) {
	const path = '/global/indonesia/financial-statements/v1/excel';
	
	const token = await FinanceService.createAuth();
	
	if (!token) {
		LoggingUtils.error('uploadReportExcel', 'token is null');
		return undefined;
	}
	
	const url = `${FINANCE_API_HOST}${path}`;
	
	const formData = new FormData();
	formData.append('excelFile', file);
	
	const options = {
		timeout: 1000 * 30,
		headers: {
			'Content-Type': 'multipart/form-data',
			Authorization: `Bearer ${token}`
		}
	}
	
	return axios
		.post(url, formData, options)
		.then((response) => {
			const responseObject: ResponseObject<unknown> = response.data;
			
			if (ResponseCode.success.code === responseObject.code) {
				return response.data as string
			} else {
				LoggingUtils.error('uploadReportExcel fail', responseObject.message);
				return undefined;
			}
		})
		.catch((error) => {
			LoggingUtils.error('uploadReportExcel error', error);
			return undefined;
		});
}

async function requestCreateExcelMerge(
	industry: string,
	year: number,
	period: string
): Promise<string | undefined> {
	const path = '/global/indonesia/financial-statements/v1/excel-creation';
	
	const token = await FinanceService.createAuth();
	
	if (!token) {
		LoggingUtils.error('requestCreateExcelMerge', 'token is null');
		return undefined;
	}
	
	const url = `${FINANCE_API_HOST}${path}`;
	
	const body = {
		mainIndustry: industry,
		reportYear: year,
		reportPeriod: period,
		contentsTypeList: [],
	};
	
	const options = {
		...defaultOption,
		headers: {
			...defaultOption.headers,
			Authorization: `Bearer ${token}`
		}
	}
	
	return axios
		.post(url, body, options)
		.then((response) => {
			const responseObject: ResponseObject<unknown> = response.data;
			
			if (ResponseCode.success.code === responseObject.code) {
				return response.data as string
			} else {
				LoggingUtils.error('requestCreateExcelMerge fail', responseObject.message);
				return undefined;
			}
		})
		.catch((error) => {
			LoggingUtils.error('requestCreateExcelMerge error', error);
			return undefined;
		});
}