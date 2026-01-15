import type { PermissionItem } from "@/services/permission";
import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface RoleRow {
	id: number;
	name: string;
}

export interface RoleDetail extends RoleRow {
	permissions: PermissionItem[];
}

export interface RoleQuery extends PageQuery {
	name?: string;
}

export interface RoleFormParams {
	name: string;
}

export interface CreateRoleParams {
	name: string;
	permissionIds: number[];
}

export interface UpdateRoleParams {
	name?: string;
	permissionIds?: number[];
}

export const $getRoles = async (params?: RoleQuery) =>
	request.get<PageResponse<RoleRow>>("/roles", { params });

export const $getRolesOptions = async () =>
	request.get<{ id: number; name: string }[]>("roles/options");

export const $getRole = async (id: number) =>
	request.get<RoleDetail>(`/roles/${id}`);

export const $createRole = async (params: CreateRoleParams) =>
	request.post<RoleDetail>("/roles", params);

export const $updateRole = async (id: number, params: UpdateRoleParams) =>
	request.patch<RoleDetail>(`/roles/${id}`, params);

export const $deleteRole = async (id: number) =>
	request.delete<void>(`/roles/${id}`);
