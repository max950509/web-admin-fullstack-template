import request from "@/utils/request";

export interface UpdatePasswordParams {
	newPassword: string;
	newPassword2: string;
	code?: string;
}

// Backend does not yet expose a dedicated update-password endpoint.
// This keeps the UI buildable; update the path when the API is added.
export const PostUpdatePwd = async (params: UpdatePasswordParams) =>
	request.post<void>("/users/password", params);
