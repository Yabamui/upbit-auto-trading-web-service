import { expect, test } from 'vitest';
import fs from 'fs';
import { join } from 'path';

test(
	'fileUtils',
	async () => {
		const rootDir = '/Volumes/Seagate/av';
		// const rootDir = '/Volumes/Ultra Touch/dev-av'

		const dirList: string[] = fs.readdirSync(rootDir);

		expect(dirList.length).toBeGreaterThan(0);

		for (const dir of dirList) {
			if (dir.startsWith('.') || dir.startsWith('*') || dir.startsWith('#')) {
				continue;
			}

			const fullPath = join(rootDir, dir);

			const fileList = fs.readdirSync(fullPath);

			if (fileList.length === 0) {
				console.log('### fileList is empty: ' + fullPath);
				continue;
			}

			const listRecode: Record<string, string[]> = fileList.reduce(
				(acc, item) => {
					const filenameSplit = item.split('-');

					const target = filenameSplit[0];

					if (!acc[target]) {
						acc[target] = [];
					}

					acc[target].push(item);

					return acc;
				},
				{} as Record<string, string[]>
			);
			
			const duplicateFileName = Object.entries(listRecode).map(([key, value]) => {
				if (value.length > 1) {
					return key;
				}
				
				return null;
			}).filter((item) => item !== null)
			
			if (duplicateFileName.length > 0) {
				console.log('### ' + fullPath + ' : ' + duplicateFileName);
			}
		}
	},
	{ timeout: 1000 * 60 }
);
