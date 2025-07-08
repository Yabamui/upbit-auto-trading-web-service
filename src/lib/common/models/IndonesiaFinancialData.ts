export interface IndonesiaFinancialReportResultData {
	report: IndonesiaFinancialReportData;
	fileList: IndonesiaFinancialFileData[];
}

export interface IndonesiaFinancialReportData {
	id: number;
	code: string;
	name: string;
	industry: string;
	reportYear: string;
	reportPeriod: string;
	fileModifiedAt: string;
}

export interface IndonesiaFinancialFileData {
	id: number;
	reportId: number;
	code: string;
	reportYear: string;
	reportPeriod: string;
	reportType: string;
	fileId: string;
	filePath: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	fileModifiedAt: string;
	registrationYn: boolean;
	downloadUrl: string;
}