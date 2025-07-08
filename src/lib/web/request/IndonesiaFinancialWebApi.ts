import { WebApiRequestUtils } from '$lib/web/request/WebApiRequestUtils';
import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';

export const IndonesiaFinancialWebApi = {
	createReport: createReport,
	getReportList: getReportList,
	uploadReportExcel: uploadReportExcel,
	requestCreateExcelMerge: requestCreateExcelMerge,
}

async function createReport(reportJson: string) {
	const path = '/api/indonesia/financial-statements';
	
	const body = {
		"reportJson": reportJson
	};
	
	return await WebApiRequestUtils.post(
		path,
		body
	);
}

async function getReportList(year: number, period: string) {
	const path = '/api/indonesia/financial-statements';
	
	const params = await CurrentStringUtils.generateQueryParam({
		year,
		period
	});
	
	const url = `${path}?${params}`;
	
	return await WebApiRequestUtils.get(url);
}

async function uploadReportExcel(file: File) {
	const path = '/api/indonesia/financial-statements-upload';
	
	const formData = new FormData();
	formData.append('file', file);
	
	return await WebApiRequestUtils.post(
		path,
		formData
	);
}

async function requestCreateExcelMerge(industry: string, year: number, period: string) {
	const path = '/api/indonesia/financial-statements-excel-summary';
	
	const body = {
		industry,
		year,
		period
	}
	
	return await WebApiRequestUtils.post(path, body);
}