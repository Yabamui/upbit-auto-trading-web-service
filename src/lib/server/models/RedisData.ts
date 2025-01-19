export interface HashSetData {
	key: string;
	hashDataList: HashSetHashData[];
	expire: number;
}

export interface HashSetHashData {
	key: string;
	value: string;
}

export interface HashGetData {
	key: string;
	hKey: string;
}

export interface SetsSetData {
	key: string;
	valueList: string[];
	expire: number;
}

export interface SetsMembersData {
	key: string;
}