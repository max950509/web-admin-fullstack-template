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
}

export const $getPermissions = async () =>
	request.get<PermissionItem[]>("/permissions");
