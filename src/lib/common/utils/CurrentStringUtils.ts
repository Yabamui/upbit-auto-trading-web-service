export const CurrentStringUtils = {
	generateQueryParam: async (queryObject: unknown): Promise<string> => {
		if (!(queryObject instanceof Object)) {
			return '';
		}

		const paramList = [];

		for (const [key, value] of Object.entries(queryObject)) {
			const valueType = typeof value;

			switch (valueType) {
				case 'string':
				case 'number':
				case 'bigint':
				case 'boolean':
					paramList.push(`${key}=${value}`);
					break;
				case 'object':
					if (value instanceof Array) {
						paramList.push(value.map((v) => `${key}=${v}`).join('&'));
					}
					break;
				case 'function':
				case 'undefined':
				default:
					break;
			}
		}

		return paramList.join('&');
	},

	toHex: (value: string): string => {
		const delimiter = '';

		return value
			.split(delimiter)
			.map((c) => c.charCodeAt(0).toString(16))
			.join(delimiter);
	}
} as const;
