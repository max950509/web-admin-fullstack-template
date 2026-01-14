import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface AccountRow {
	id: number;
	username: string;
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
