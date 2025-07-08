import { ResponseUtils } from '$lib/common/utils/ResponseUtils';
import { ResponseCode } from '$lib/common/enums/ResponseCode';
import { IndonesiaFinancialService } from '$lib/server/service/IndonesiaFinancialService';

/**
 * GET Request
 * @param params
 * @param url
 * @constructor
 */
export const GET = async ({ params, url }): Promise<Response> => {
	const path = params.path;

	if (path === 'financial-statements') {
		return await getReportList(url);
	}

	return ResponseUtils.error(ResponseCode.internalServerError);
};

async function getReportList(url: URL) {
	const year = url.searchParams.get('year');
	const period = url.searchParams.get('period');

	if (!year || !period) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result = await IndonesiaFinancialService.getReportList(Number(year), period);

	return ResponseUtils.ok(result);
}

/**
 * POST Request
 * @param request
 * @constructor
 */
export const POST = async ({ params, request }): Promise<Response> => {
	const path = params.path;

	console.log(path);

	if (path === 'financial-statements') {
		return await createReport(request);
	}
	
	if (path === 'financial-statements-upload') {
		return await uploadReportExcel(request);
	}
	
	if (path === 'financial-statements-excel-summary') {
		return await requestCreateExcelMerge(request);
	}

	return ResponseUtils.error(ResponseCode.wrongParameter);
};

async function createReport(request: Request): Promise<Response> {
	const body = await request.json();

	const reportJson = body.reportJson as string | undefined;

	if (!reportJson) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result: string | undefined = await IndonesiaFinancialService.createReport(reportJson);

	return ResponseUtils.ok(result);
}

async function uploadReportExcel(request: Request): Promise<Response> {
	
	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result: string | undefined = await IndonesiaFinancialService.uploadReportExcel(file);

	return ResponseUtils.ok(result);
}

async function requestCreateExcelMerge(request: Request): Promise<Response> {
	const body = await request.json();

	const industry = body.industry as string | undefined;
	const year = body.year as number | undefined;
	const period = body.period as string | undefined;

	if (!industry || !year || !period) {
		return ResponseUtils.error(ResponseCode.wrongParameter);
	}

	const result: string | undefined = await IndonesiaFinancialService.requestCreateExcelMerge(industry, year, period);

	return ResponseUtils.ok(result);
}