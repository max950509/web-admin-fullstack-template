import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface AccountRow {
	id: number;
	username: string;
	departmentId?: number | null;
	positionId?: number | null;
	department?: {
		id: number;
		name: string;
	} | null;
	position?: {
		id: number;
		name: string;
		departmentId?: number | null;
		departmentName?: string | null;
	} | null;
	roles: {
		id: number;
		name: string;
	}[];
	isOtpEnabled: boolean;
}

export interface AccountQuery extends PageQuery {
	username?: string;
}

export interface AccountFormParams {
	username: string;
	password: string;
	roleIds: number[];
	departmentId?: number | null;
	positionId?: number | null;
}

export type ImportMode = "insert" | "upsert";

export interface AccountImportResult {
	successCount: number;
	failCount: number;
	errors: { row: number; message: string }[];
}

export const $getAccounts = async (params?: AccountQuery) =>
	request.get<PageResponse<AccountRow>>("/users", { params });

export const $getAccount = async (id: number) =>
	request.get<AccountRow>(`/users/${id}`);

export const $createAccount = async (params: AccountFormParams) =>
	request.post<AccountRow>("/users", params);

export const $updateAccount = async (id: number, params: AccountFormParams) =>
	request.patch<AccountRow>(`/users/${id}`, params);

export const $deleteAccount = async (id: number) =>
	request.delete<void>(`/users/${id}`);

export const $batchDeleteAccounts = async (ids: number[]) =>
	request.post<{ count: number }>("/users/batch-delete", { ids });

export const $importAccounts = async (
	file: File,
	mode: ImportMode = "insert",
) => {
	const formData = new FormData();
	formData.append("file", file);
	return request.post<AccountImportResult>("/users/import", formData, {
		params: { mode },
		headers: { "Content-Type": "multipart/form-data" },
	});
};

export const $downloadAccountTemplate = async (format: "csv" | "xlsx") =>
	request.get<Blob>("/users/template", {
		params: { format },
		responseType: "blob",
	});
