import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface RoleRow {
	id: number;
	name: string;
	permissions: {
		id: number;
		name: string;
		action: string;
		resource: string;
	}[];
}

export interface RoleQuery extends PageQuery {
	name?: string;
}

export interface RoleFormParams {
	name: string;
	permissionIds: number[];
}

export const $getRoles = async (params?: RoleQuery) =>
	request.get<PageResponse<RoleRow>>("/roles", { params });

export const $getRolesOptions = async () =>
	request.get<{ id: number; name: string }[]>("roles/options");

export const $getRole = async (id: number) =>
	request.get<RoleRow>(`/roles/${id}`);

export const $createRole = async (params: RoleFormParams) =>
	request.post<RoleRow>("/roles", params);

export const $updateRole = async (id: number, params: RoleFormParams) =>
	request.patch<RoleRow>(`/roles/${id}`, params);

export const $deleteRole = async (id: number) =>
	request.delete<void>(`/roles/${id}`);
