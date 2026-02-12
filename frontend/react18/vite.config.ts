import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	console.log("env", env);
	return {
		base: env.VITE_APP_BASE,
		plugins: [react()],
		// 别名设置
		resolve: {
			alias: {
				"@": "/src", // 把 @ 指向到 src 目录去
			},
		},
		server: {
			proxy: {
				"/api": {
					target: env.VITE_APP_API_BASE,
					changeOrigin: true,
				},
			},
		},
		// build: {
		// 	rolldownOptions: {
		// 		output: {
		// 			advancedChunks: {
		// 				groups: [
		// 					{ name: '"react-vendor"', test: /\/react(?:-dom)?/ },
		// 					{ name: '"antd-vendor"', test: /\/antd/ },
		// 				],
		// 			},
		// 		},
		// 	},
		// },
	};
});
