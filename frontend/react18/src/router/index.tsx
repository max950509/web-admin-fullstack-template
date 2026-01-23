import React from "react";
import { KeepAlive } from "react-activation";
import {
	createBrowserRouter,
	matchRoutes,
	Navigate,
	Outlet,
	redirect,
	useRouteError,
} from "react-router-dom";
import Login from "@/pages/login";
import { $getProfile } from "@/services/auth.ts";
import { getToken } from "@/utils/auth";
import { checkPermissionByCode } from "@/utils/permission";
import App from "../App.tsx";
import { type AppRouteHandle, type AppRouteObject, allRoutes } from "./routes";

const wrapKeepAlive = (
	routes: AppRouteObject[],
	parentPath = "",
): AppRouteObject[] => {
	return routes.map((route) => {
		const newRoute = { ...route };
		// Create the full path for the route
		const fullPath = `${parentPath}/${newRoute.path}`.replace(/\/+/g, "/");
		const { element } = newRoute;
		// Only wrap routes that have a component element and are not explicitly excluded
		if (
			React.isValidElement(element) &&
			element.type !== Outlet &&
			element.type !== Navigate &&
			!newRoute.handle?.noKeepAlive
		) {
			newRoute.element = (
				<KeepAlive name={fullPath} key={fullPath}>
					{element}
				</KeepAlive>
			);
		}

		if (newRoute.children) {
			newRoute.children = wrapKeepAlive(newRoute.children, fullPath);
		}

		return newRoute;
	});
};

// New Error Element to display permission errors
function ErrorElement() {
	// biome-ignore lint/suspicious/noExplicitAny: temporary ignore
	const error = useRouteError() as any;
	if (error.status === 403) {
		return (
			<div style={{ padding: 24 }}>
				<h2>No Permission</h2>
				<p>Sorry, you don't have permission to access this page.</p>
			</div>
		);
	}
	return (
		<div style={{ padding: 24 }}>
			<h2>Something went wrong</h2>
			<p>{error.statusText || error.message}</p>
		</div>
	);
}

// New Root Loader to handle auth and permissions
const rootLoader = async ({ request }: { request: Request }) => {
	const token = getToken();
	const { pathname, search } = new URL(request.url);

	// 登录成功后，需要重定向回之前的页面。
	// 但是，从 request.url 中获取的 pathname 包含了 basename。
	// 为了防止登录后跳转时，`navigate` 函数重复添加 basename (例如 /ops/ops/dashboard),
	// 我们需要在这里手动移除 pathname 中包含的 basename。
	const basename = (import.meta.env.VITE_APP_BASE || "").replace(/\/$/g, "");
	let relativePath = pathname;
	if (basename && relativePath.startsWith(basename)) {
		relativePath = relativePath.slice(basename.length);
	}
	// 如果移除 basename 后路径为空，则应为根路径 "/"
	const redirectUrl = (relativePath || "/") + search;

	if (!token) {
		throw redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
	}

	try {
		const { data: userInfo } = await $getProfile();
		// --- Code-based Permission Check ---
		// Find all matching routes for the current pathname
		const matches = matchRoutes(
			allRoutes,
			{ pathname },
			import.meta.env.VITE_APP_BASE,
		);
		console.log("matches", matches);
		if (matches) {
			let codeToCheck: string | undefined;

			// Iterate backwards through the matches to find the most specific code
			for (let i = matches.length - 1; i >= 0; i--) {
				const handle = matches[i].route.handle as AppRouteHandle | undefined;
				if (handle?.code) {
					codeToCheck = handle.code;
					break; // Found the code, stop searching
				}
			}

			// If a code is found, check permission. Otherwise, allow access.
			if (codeToCheck && !checkPermissionByCode(codeToCheck, userInfo.roles)) {
				throw new Response("Forbidden", { status: 403 });
			}
		}
		// --- End of New Permission Check ---

		return userInfo;
	} catch (error) {
		// 登录过期，无需抛出异常，否则会跳转至错误页
		// @ts-expect-error
		if (error?.data?.statusCode === 401) {
			throw redirect(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
		}
		if (error instanceof Response) {
			throw error;
		}
		throw new Response("Error loading user data or permissions", {
			status: 500,
		});
	}
};

const router = createBrowserRouter(
	[
		{
			path: "/",
			id: "root",
			element: <App />,
			loader: rootLoader,
			// 不依赖路由params，只是单纯验证登录态，只需执行一次即可，所以设置shouldRevalidate为false
			shouldRevalidate: () => false,
			errorElement: <ErrorElement />,
			children: [
				{ index: true, element: <Navigate to="/dashboard" replace /> },
				...wrapKeepAlive(allRoutes),
			],
		},
		{
			path: "/login",
			element: <Login />,
		},
	],
	{ basename: import.meta.env.VITE_APP_BASE },
);

export default router;
