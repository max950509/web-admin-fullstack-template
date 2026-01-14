export interface PageResponse<T> {
	list: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface PageQuery {
	page?: number;
	pageSize?: number;
}
