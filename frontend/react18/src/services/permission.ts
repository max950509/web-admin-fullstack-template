import request from "@/utils/request";

export type PermissionType = "menu" | "page" | "action";

export interface PermissionItem {
	id: number;
	name: string;
	type: PermissionType;
	action: string;
	resource: string;
	parentId: number | null;
	sort: number;
	createdAt?: string;
	updatedAt?: string;
	children?: PermissionItem[];
}

export interface PermissionFormParams {
	name: string;
	type: PermissionType;
	action: string;
	resource: string;
	parentId?: number | null;
	sort?: number;
}

export const $getPermissions = async () =>
	request.get<PermissionItem[]>("/permissions");

export const $createPermission = async (params: PermissionFormParams) =>
	request.post<PermissionItem>("/permissions", params);

export const $updatePermission = async (
	id: number,
	params: PermissionFormParams,
) => request.patch<PermissionItem>(`/permissions/${id}`, params);

export const $deletePermission = async (id: number) =>
	request.delete<void>(`/permissions/${id}`);
