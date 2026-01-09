import { message } from "antd";
import axios from "axios";
import { emitter, KEY_AUTH_EXPIRED } from "@/utils/mitt";
import { clearToken, getToken } from "./auth";

const HOST = import.meta.env.VITE_APP_API_BASE;

// 全局 AbortController，用于取消登录过期时的其他请求
let globalAbortController: AbortController | undefined;

const request = axios.create({
	baseURL: HOST,
	timeout: 3 * 1000,
});

request.interceptors.request.use(
	(config) => {
		// token可以通过参数：loginAccessToken 单独传递
		console.log(config);
		const accessToken = config?.data?.loginAccessToken || getToken();
		if (accessToken) {
			config.headers.Authorization = `${accessToken}`;
		}
		// 原来的可能是直接使用 config.signal 或没用
		if (!globalAbortController) {
			globalAbortController = new AbortController();
		}

		// 已经添加了 signal 的请求不再覆盖
		if (!config.signal) {
			config.signal = globalAbortController.signal;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

request.interceptors.response.use(null, (error) => {
	console.log(error);
	const data = error?.response?.data;
	const status = data?.statusCode ?? error?.response?.status;
	if (data?.message) {
		message.error(data.message);
	} else if (!error?.response) {
		message.error("网络异常，请稍后重试");
	}
	if (status === 401) {
		//  && data.error === "Expired"
		clearToken();
		// 将当前地址作为参数传递给登录页面
		if (globalAbortController) {
			globalAbortController.abort(); // 取消所有正在进行的请求
			globalAbortController = undefined; // 清空，下次请求会创建新的 controller
		}
		// 这里无法精确获取当前路由地址，所以抛出事件在App.tsx中处理
		emitter.emit(KEY_AUTH_EXPIRED);
	}
	return Promise.reject(error);
});

export default request;
