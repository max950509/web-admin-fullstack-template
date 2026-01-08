import request from "@/utils/request";

export interface LoginParams {
  username: string;
  password: string;
  captcha: string;
  captchaId: string;
}

export interface LoginResponse  {
  accessToken: string;
  isTemporary: boolean;
}
export const $postLogin = async (params: LoginParams) =>
  request.post<LoginResponse>("/auth/login", params);

export const $postLoginWith2fa = async (params: {
  code: string;
  loginAccessToken: string;
}) => request.post<LoginResponse>("/auth/login/2fa", params);

export interface CaptchaResponse {
  id: string;
  svg: string;
}

export const $getCaptcha = async () =>
  request.get<CaptchaResponse>("/auth/captcha");

export interface GenerateOtpResponse {
  qrCodeDataUrl: string;
}
export const $generateOpt = async () =>
  request.post<GenerateOtpResponse>("/auth/otp/generate");

export interface EnableOtpResponse {
  accessToken: string;
}
export const $enableOpt = async (params: { code: string }) =>
  request.post<EnableOtpResponse>("/auth/otp/enable", params);

export interface ProfileResponse {
    id: number;
  username: string;
  roles: {
    id: number;
    name: string;
    permissions: {
      id: number;
      action: string;
      resource: string;
    }[];
  }[];
  isOtpEnabled: boolean;
}
export const $getProfile = async () => request.get<ProfileResponse>("/auth/profile");
