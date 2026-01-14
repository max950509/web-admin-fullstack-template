import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export interface Account {
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

export interface CreateAccountParams {
	username: string;
	password: string;
	roleIds?: number[];
}

export interface UpdateAccountParams {
	id: number;
	username?: string;
	roleIds?: number[];
}

export const $getAccounts = async (params?: AccountQuery) =>
	request.get<PageResponse<Account>>("/users", { params });

export const $getAccount = async (id: number) =>
	request.get<Account>(`/users/${id}`);

export const $createAccount = async (params: CreateAccountParams) =>
	request.post<Account>("/users", params);

export const $updateAccount = async (id: number, params: UpdateAccountParams) =>
	request.patch<Account>(`/users/${id}`, params);

export const $deleteAccount = async (id: number) =>
	request.delete<void>(`/users/${id}`);
