import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface PositionItem {
	id: number;
	name: string;
	departmentId?: number | null;
	department?: {
		id: number;
		name: string;
	} | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface PositionFormParams {
	name: string;
	departmentId?: number | null;
}

export interface PositionQuery extends PageQuery {
	name?: string;
	departmentId?: number;
}

export const $getPositions = async (params?: PositionQuery) =>
	request.get<PageResponse<PositionItem>>("/positions", { params });

export const $getPositionOptions = async (departmentId?: number) =>
	request.get<
		{
			id: number;
			name: string;
			departmentId?: number | null;
			departmentName?: string | null;
		}[]
	>("/positions/options", { params: { departmentId } });

export const $createPosition = async (params: PositionFormParams) =>
	request.post<PositionItem>("/positions", params);

export const $updatePosition = async (id: number, params: PositionFormParams) =>
	request.patch<PositionItem>(`/positions/${id}`, params);

export const $deletePosition = async (id: number) =>
	request.delete<void>(`/positions/${id}`);
