import request from "@/utils/request";

export interface DepartmentItem {
	id: number;
	name: string;
	parentId?: number | null;
	sort: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface DepartmentFormParams {
	name: string;
	parentId?: number | null;
	sort?: number;
}

export const $getDepartments = async () =>
	request.get<DepartmentItem[]>("/departments");

export const $getDepartmentOptions = async () =>
	request.get<{ id: number; name: string; parentId: number | null }[]>(
		"/departments/options",
	);

export const $createDepartment = async (params: DepartmentFormParams) =>
	request.post<DepartmentItem>("/departments", params);

export const $updateDepartment = async (
	id: number,
	params: DepartmentFormParams,
) => request.patch<DepartmentItem>(`/departments/${id}`, params);

export const $deleteDepartment = async (id: number) =>
	request.delete<void>(`/departments/${id}`);
