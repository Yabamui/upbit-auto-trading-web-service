<script lang="ts">

	import {
		Button,
		Card,
		DropdownDivider,
		Dropzone,
		Hr,
		Indicator,
		Input,
		Label,
		Select,
		Textarea
	} from 'flowbite-svelte';
	import moment from 'moment';
	import { CurrentStringUtils } from '$lib/common/utils/CurrentStringUtils';
	import ToastAlertComponent from '$lib/web/components/application/ToastAlertComponent.svelte';
	import { IndonesiaFinancialWebApi } from '$lib/web/request/IndonesiaFinancialWebApi';
	import type { ResponseObject } from '$lib/common/models/ResponseData';
	import { ResponseCode } from '$lib/common/enums/ResponseCode';
	import type {
		IndonesiaFinancialFileData,
		IndonesiaFinancialReportResultData
	} from '$lib/common/models/IndonesiaFinancialData';
	import { onMount } from 'svelte';
	import {
		DownloadIcon,
		RefreshCcwIcon,
		UploadIcon
	} from 'lucide-svelte';
	import { CurrentThreadUtils } from '$lib/common/utils/CurrentThreadUtils';
	import { LoggingUtils } from '$lib/common/utils/LoggingUtils';

	const ReportTypeEnum = {
		RDF: 'rdf',
		RDA: 'rda'
	};

	const EmitTypeEnum = {
		O: 'o',
		S: 's'
	};

	const PeriodEnum = {
		TW1: 'tw1',
		TW2: 'tw2',
		TW3: 'tw3',
		AUDIT: 'audit'
	};

	const SortColumnEnum = {
		KODE_EMIT: 'KodeEmiten',
		FILE_MODIFIED: 'FileModified',
		FILE_COUNT: 'FileCount'
	};

	const SortOrderEnum = {
		DESC: 'desc',
		ASC: 'asc'
	};

	const IndustryEnum = {
		GENERAL: 'GENERAL',
		PROPERTY: 'PROPERTY',
		INFRASTRUCTURE: 'INFRASTRUCTURE',
		FINANCIAL: 'FINANCIAL',
		SECURITIES: 'SECURITIES',
		INSURANCE: 'INSURANCE',
		FINANCING: 'FINANCING'
	}

	const baseUrl = 'https://www.idx.co.id';

	let alertMessage: string = $state('');
	let reportPage: Window | null = $state(null);
	let downloadPage: Window | null = $state(null);
	let searchReportFormData: {
		page: number;
		pageSize: number;
		year: number;
		reportType: string;
		emitType: string;
		period: string;
		sortColumn: string;
		sortOrder: string;
	} = $derived.by(() => initSearchReportFormData());
	let reportJson: string = $state('');
	let reportResultList: IndonesiaFinancialReportResultData[] = $state([]);
	let searchText: string = $state('');
	let downloadingYn: boolean = $state(false);
	let uploadingYn: boolean = $state(false);
	let fileNameList: string[] = $state([]);
	let fileList: File[] = $state([]);
	let excelMergeFormData: {
		year: number;
		period: string;
		industry: string;
	} = $derived.by(() => initExcelMergeFormData());

	let downloadFilePathList: IndonesiaFinancialFileData[] = $state([]);

	onMount(async () => {
		await getIndonesiaReportList();
	});

	$effect(() => {
		downloadAllExcel();
	});

	function initSearchReportFormData() {
		return {
			page: 1,
			pageSize: 36,
			year: moment()
				.year() - 1,
			reportType: ReportTypeEnum.RDF,
			emitType: EmitTypeEnum.S,
			period: PeriodEnum.AUDIT,
			sortColumn: SortColumnEnum.FILE_MODIFIED,
			sortOrder: SortOrderEnum.DESC
		};
	}

	function initExcelMergeFormData() {
		return {
			year: moment()
				.year() - 1,
			period: PeriodEnum.AUDIT,
			industry: ''
		};
	}

	async function getIndonesiaReportList() {
		reportResultList = [];

		const responseObject: ResponseObject<unknown> = await IndonesiaFinancialWebApi.getReportList(
			searchReportFormData.year,
			searchReportFormData.period,
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alertMessage = responseObject.message;
			return;
		}

		reportResultList = responseObject.data as IndonesiaFinancialReportResultData[];
	}

	async function onclickGetIndonesiaReport() {
		const params = await CurrentStringUtils.generateQueryParam({
			indexFrom: searchReportFormData.page,
			pageSize: searchReportFormData.pageSize,
			year: searchReportFormData.year,
			reportType: searchReportFormData.reportType,
			EmitenType: searchReportFormData.emitType,
			periode: searchReportFormData.period,
			kodeEmiten: '',
			SortColumn: searchReportFormData.sortColumn,
			SortOrder: searchReportFormData.sortOrder,
		});

		const url = `${ baseUrl }/primary/ListedCompany/GetFinancialReport?${ params }`;

		if (reportPage) {
			reportPage.close();
		}

		reportPage = window.open(url, '_blank');
	}

	async function onclickCreateReport() {
		if (!reportJson) {
			alertMessage = 'Report Json is empty';
			return;
		}

		try {
			JSON.parse(reportJson);
		} catch (error) {
			console.error(error);
			alertMessage = 'Report Json is invalid';
			return;
		}

		const responseObject: ResponseObject<unknown> = await IndonesiaFinancialWebApi.createReport(reportJson);

		if (ResponseCode.success.code !== responseObject.code) {
			alertMessage = responseObject.message;
			return;
		}

		const result = responseObject.data as string;

		if (!result) {
			alertMessage = 'Report is empty';
			return;
		}

		reportJson = '';

		await getIndonesiaReportList();
	}

	async function onclickDownloadFile(filePath: string) {
		if (downloadingYn) {
			alertMessage = 'Downloading is in progress';
			return;
		}

		downloadingYn = true;

		const url = `${ baseUrl }${ filePath }`;

		if (downloadPage) {
			downloadPage.close();
		}

		downloadPage = window.open(url, '_blank');

		if (downloadPage && downloadPage.document.readyState === 'complete') {
			downloadingYn = false;
		}
	}

	function searchReportList() {
		if (!searchText) {
			return reportResultList;
		}

		return reportResultList.filter((item) => {
			return item.report.code.includes(searchText) || item.report.name.includes(searchText);
		});
	}

	function onclickAllExcelDownload() {
		downloadFilePathList = [];
		if (downloadingYn) {
			alertMessage = 'Downloading is in progress';
			return;
		}

		downloadingYn = true;

		const excelDownloadList: IndonesiaFinancialFileData[] = reportResultList.map((item) => {
				return item.fileList.map((file) => {
						if (file.registrationYn) {
							return null;
						}

						if (file.fileType !== '.xlsx') {
							return null;
						}

						return file;
					})
					.filter((item) => item !== null);
			})
			.flat();

		if (!excelDownloadList.length) {
			downloadingYn = false;
		}

		downloadFilePathList = excelDownloadList;
	}

	async function downloadAllExcel() {
		if (downloadingYn && downloadFilePathList.length > 0) {
			for (const file of downloadFilePathList) {

				if (!downloadingYn) {
					break;
				}

				const url = `${ baseUrl }${ file.filePath }`;

				LoggingUtils.info('downloadAllExcel', file.code);

				window.open(url, '_blank');

				await CurrentThreadUtils.sleep(1000 * 3);
			}

			downloadingYn = false;
		}
	}

	function onclickAllExcelDownloadStop() {
		downloadingYn = false;
	}

	async function onclickUploadFile() {
		uploadingYn = true;

		if (!fileList) {
			uploadingYn = false;
			alertMessage = 'File is empty';
			return;
		}

		for (const file of fileList) {
			const responseObject: ResponseObject<unknown> = await IndonesiaFinancialWebApi.uploadReportExcel(file);

			if (ResponseCode.success.code !== responseObject.code) {
				alertMessage = responseObject.message;
				break;
			}
		}

		fileNameList = [];
		fileList = [];

		uploadingYn = false;

		await getIndonesiaReportList();
	}

	async function onclickRequestCreateExcelMerge() {
		if (!excelMergeFormData || !excelMergeFormData.year || !excelMergeFormData.period || !excelMergeFormData.industry) {
			alertMessage = 'Year, Period, Industry is empty';
			return;
		}

		const responseObject: ResponseObject<unknown> = await IndonesiaFinancialWebApi.requestCreateExcelMerge(
			excelMergeFormData.industry,
			excelMergeFormData.year,
			excelMergeFormData.period
		);

		if (ResponseCode.success.code !== responseObject.code) {
			alertMessage = responseObject.message;
			return;
		}

		alertMessage = '엑셀 취합 요청이 완료되었습니다.';
	}

	function dropHandle(event) {
		fileNameList = [];
		event.preventDefault();
		if (event.dataTransfer.items) {
			[...event.dataTransfer.items].forEach((item) => {
				if (item.kind === 'file') {
					const file = item.getAsFile();

					if (!fileNameList.includes(file.name)) {
						fileNameList.push(file.name);
						fileNameList = fileNameList;
						fileList = event.dataTransfer.files;
					}
				}
			});
		} else {
			[...event.dataTransfer.files].forEach((file) => {
				if (!fileNameList.includes(file.name)) {
					fileNameList = file.name;
					fileList = event.dataTransfer.files;
				}
			});
		}
	};

	function handleChange(event) {
		const files = event.target.files;
		if (files.length > 0 && !fileNameList.includes(files[0].name)) {
			fileNameList.push(files[0].name);
			fileNameList = fileNameList;
			fileList = files;
		}
	};

	function showFiles(fileNameList: string[]) {
		if (fileNameList.length === 1) {
			return fileNameList[0];
		}

		let concat = '';
		fileNameList.map((fileName) => {
			concat += fileName;
			concat += ',';
			concat += ' ';
		});

		if (concat.length > 120) {
			concat = concat.slice(0, 120);
		}

		concat += '...';
		return concat;
	};
</script>

<div class="flex w-full p-4 overflow-auto gap-4">
	<Card class="flex w-[480px] h-[500px] p-2 overflow-hidden"
				padding="none"
				size="none">
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Page
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Input
					type="number"
					class="py-0.5 text-[12px]"
					bind:value={searchReportFormData.page}
				/>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Page Size
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.pageSize}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each [12, 24, 36] as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Year
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Input
					type="number"
					class="py-0.5 text-[12px]"
					bind:value={searchReportFormData.year}
				/>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Report Type
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.reportType}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each Object.values(ReportTypeEnum) as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Emit Type
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.emitType}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each Object.values(EmitTypeEnum) as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Period
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.period}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each Object.values(PeriodEnum) as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Sort Column
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.sortColumn}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each Object.values(SortColumnEnum) as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<Label class="flex items-center justify-between gap-4 h-10">
			<div class="w-[100px]">
				Sort Order
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Select bind:value={searchReportFormData.sortOrder}
								placeholder=""
								class="py-0.5 text-[12px]"
								size="sm">
					{#each Object.values(SortOrderEnum) as item}
						<option class="text-[12px]"
										value={item}>
							{item}
						</option>
					{/each}
				</Select>
			</div>
		</Label>
		<div class="flex w-full items-center justify-end py-2">
			<Button
				color="primary"
				class="w-full p-2"
				onclick={onclickGetIndonesiaReport}
			>
				조회하기
			</Button>
		</div>

		<DropdownDivider class="mb-2" />

		<Label class="flex items-start justify-between gap-4">
			<div class="w-[100px]">
				Report Json
			</div>
			<div class="w-[300px] gap-2 items-center">
				<Textarea
					class="py-0.5 text-[12px]"
					bind:value={reportJson}
				/>
			</div>
		</Label>
		<div class="flex w-full items-center justify-end py-4">
			<Button
				color="primary"
				class="w-full p-2"
				onclick={onclickCreateReport}
			>
				등록하기
			</Button>
		</div>
	</Card>

	<div class="flex flex-col w-[500px] h-full p-2 gap-2 border rounded-lg scrollbar-hide overflow-auto">
		{#if reportResultList.length}
			{@const totalCount = reportResultList.length}
			{@const excelDownloadCount = reportResultList.filter((item) => {
				return item.fileList.some((file) => {
					return file.registrationYn === false && file.fileType === '.xlsx';
				});
			}).length}
			<div class="flex w-full items-center">
				Total Count: {totalCount} / Excel Download Count: {totalCount - excelDownloadCount}
			</div>
			<div class="flex w-full gap-2 sticky top-0 z-10 bg-white dark:bg-gray-800">
				<Input
					type="text"
					class="py-0.5 text-[12px]"
					bind:value={searchText}
					placeholder="Search..."
				/>
				{#if downloadingYn}
					<Button
						color="light"
						class="p-2"
						disabled={!downloadingYn}
						onclick={onclickAllExcelDownloadStop}
					>
						<RefreshCcwIcon class="w-4 h-4" />
					</Button>
				{:else}
					<Button
						color="primary"
						class="p-2"
						disabled={downloadingYn}
						onclick={onclickAllExcelDownload}
					>
						<DownloadIcon class="w-4 h-4" />
					</Button>
				{/if}
			</div>
			{#each searchReportList() as item}
				<Card class="flex-none w-[480px] h-[500px] p-2 overflow-hidden"
							padding="none"
							size="none">
					<header class="flex items-center justify-between gap-4 h-10">
						<div class="text-lg font-bold">
							{item.report.code}
						</div>
						<div class="text-[12px]">
							{item.report.fileModifiedAt}
						</div>
					</header>
					<div class="">
						<Label class="flex items-center justify-between gap-4 h-10">
							<div class="">
								Name
							</div>
							<div class="">
								{item.report.name}
							</div>
						</Label>
						<Label class="flex items-center justify-between gap-4 h-10">
							<div class="">
								Year
							</div>
							<div class="">
								{item.report.reportYear}
							</div>
						</Label>
						<Label class="flex items-center justify-between gap-4 h-10">
							<div class="">
								Period
							</div>
							<div class="">
								{item.report.reportPeriod}
							</div>
						</Label>
						<Hr classHr="my-2" />
						{#each item.fileList as file}
							<Label class="flex items-center justify-between gap-4 h-10">
								<div class="inline-flex items-center gap-2">
									{file.fileName}
									{#if file.registrationYn}
										<Indicator color="green" />
									{:else}
										<Indicator color="red" />
									{/if}
								</div>
								<Button
									color="light"
									class=" p-2"
									disabled={downloadingYn}
									onclick={() => onclickDownloadFile(file.filePath)}
								>
									<DownloadIcon class="w-4 h-4" />
								</Button>
							</Label>
						{/each}
					</div>
				</Card>
			{/each}
		{/if}
	</div>

	<div class="flex flex-col gap-2 rounded-lg overflow-auto">
		<Card class="flex w-[480px] h-[300px] p-2 overflow-hidden"
					padding="none"
					size="none">
			<Dropzone
				id="dropzone"
				ondrop={dropHandle}
				on:dragover={(event) => {event.preventDefault();}}
				on:change={handleChange}>
				<UploadIcon class="w-6 h-6" />
				{#if fileNameList.length === 0}
					<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
						<span class="font-semibold">Click to upload</span>
						or drag and drop
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">xlsx</p>
				{:else}
					<p>{showFiles(fileNameList)}</p>
				{/if}
			</Dropzone>
			<div class="flex w-full items-center justify-end py-4">
				<Button
					color="primary"
					class="w-full p-2"
					disabled={uploadingYn}
					onclick={onclickUploadFile}
				>
					등록하기
				</Button>
			</div>
		</Card>
		{#if reportResultList.length}
			<Card class="flex w-[480px] h-[200px] p-2 overflow-hidden"
						padding="none"
						size="none">
				<Label class="flex items-center justify-between gap-4 h-10">
					<div class="w-[100px]">
						Industry
					</div>
					<div class="w-[300px] gap-2 items-center">
						<Select bind:value={excelMergeFormData.industry}
										placeholder=""
										class="py-0.5 text-[12px]"
										size="sm">
							<option class="text-[12px]"
											value="">
								선택
							</option>
							{#each Object.values(IndustryEnum) as item}
								<option class="text-[12px]"
												value={item}>
									{item}
								</option>
							{/each}
						</Select>
					</div>
				</Label>
				<Label class="flex items-center justify-between gap-4 h-10">
					<div class="w-[100px]">
						Year
					</div>
					<div class="w-[300px] gap-2 items-center">
						<Input
							type="number"
							class="py-0.5 text-[12px]"
							bind:value={excelMergeFormData.year}
						/>
					</div>
				</Label>
				<Label class="flex items-center justify-between gap-4 h-10">
					<div class="w-[100px]">
						Period
					</div>
					<div class="w-[300px] gap-2 items-center">
						<Select bind:value={excelMergeFormData.period}
										placeholder=""
										class="py-0.5 text-[12px]"
										size="sm">
							{#each Object.values(PeriodEnum) as item}
								<option class="text-[12px]"
												value={item}>
									{item}
								</option>
							{/each}
						</Select>
					</div>
				</Label>
				<div class="flex w-full items-center justify-end py-4">
					<Button
						color="primary"
						class="w-full p-2"
						onclick={onclickRequestCreateExcelMerge}
					>
						엑셀 취합 요청
					</Button>
				</div>
			</Card>
		{/if}
	</div>
</div>

<ToastAlertComponent
	alertMessage={alertMessage} />