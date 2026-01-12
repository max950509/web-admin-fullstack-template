import request from "@/utils/request";

export interface AccountItem {
	id: number;
	username: string;
	roles: {
		id: number;
		name: string;
	}[];
	isOtpEnabled: boolean;
}

export interface CreateAccountParams {
	username: string;
	password: string;
	roleIds?: number[];
}

export interface UpdateAccountParams {
	username?: string;
	password?: string;
	roleIds?: number[];
}

export const $getAccounts = async () => request.get<AccountItem[]>("/users");

export const $getAccount = async (id: number) =>
	request.get<AccountItem>(`/users/${id}`);

export const $createAccount = async (params: CreateAccountParams) =>
	request.post<AccountItem>("/users", params);

export const $updateAccount = async (id: number, params: UpdateAccountParams) =>
	request.patch<AccountItem>(`/users/${id}`, params);

export const $deleteAccount = async (id: number) =>
	request.delete<void>(`/users/${id}`);
