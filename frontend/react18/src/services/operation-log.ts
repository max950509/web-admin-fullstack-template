import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface OperationLogItem {
	id: number;
	userId?: number | null;
	username?: string | null;
	action?: string | null;
	resource?: string | null;
	method: string;
	path: string;
	statusCode: number;
	ip?: string | null;
	userAgent?: string | null;
	payload?: unknown | null;
	createdAt: string;
}

export interface OperationLogQuery extends PageQuery {
	username?: string;
	action?: string;
	resource?: string;
	method?: string;
	statusCode?: number;
	from?: string;
	to?: string;
}

export const $getOperationLogs = async (params?: OperationLogQuery) =>
	request.get<PageResponse<OperationLogItem>>("/operation-logs", { params });

export const $getMyOperationLogs = async (params?: OperationLogQuery) =>
	request.get<PageResponse<OperationLogItem>>("/operation-logs/me", {
		params,
	});
