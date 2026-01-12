import type { PermissionItem } from "@/services/permission";
import request from "@/utils/request";

export interface RoleItem {
	id: number;
	name: string;
	permissions: PermissionItem[];
}

export const $getRoles = async () => request.get<RoleItem[]>("/roles");

export const $updateRole = async (
	roleId: number,
	params: { name?: string; permissionIds?: number[] },
) => request.patch<RoleItem>(`/roles/${roleId}`, params);
