import type { RouteObject } from "react-router-dom";
import { Navigate, Outlet } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/system/accounts";
import Departments from "@/pages/system/departments";
import OperationLogs from "@/pages/system/operation-logs";
import Permissions from "@/pages/system/permissions";
import Positions from "@/pages/system/positions";
import Roles from "@/pages/system/roles";

// 定义你的 handle 类型
export interface AppRouteHandle {
	title?: string | ((params: unknown) => string);
	code?: string;
	fixed?: boolean;
	noKeepAlive?: boolean; // 不缓存，不设置默认缓存
}

export type AppRouteObject = RouteObject & {
	handle?: AppRouteHandle;
	children?: AppRouteObject[];
};

export const allRoutes: AppRouteObject[] = [
	{
		path: "/dashboard",
		element: <Dashboard />,
		handle: {
			title: "主页",
			fixed: true,
		},
	},
	{
		path: "/system",
		element: <Outlet />,
		handle: {
			title: "系统管理",
		},
		children: [
			{ index: true, element: <Navigate to="accounts" replace /> },
			{
				path: "accounts",
				element: <Accounts />,
				handle: {
					title: "账号管理",
					code: "read:account",
				},
			},
			{
				path: "departments",
				element: <Departments />,
				handle: {
					title: "部门管理",
					code: "read:department",
				},
			},
			{
				path: "positions",
				element: <Positions />,
				handle: {
					title: "岗位管理",
					code: "read:position",
				},
			},
			{
				path: "roles",
				element: <Roles />,
				handle: {
					title: "角色管理",
					code: "read:role",
				},
			},
			{
				path: "permissions",
				element: <Permissions />,
				handle: {
					title: "权限管理",
					code: "read:permission",
				},
			},
			{
				path: "operation-logs",
				element: <OperationLogs />,
				handle: {
					title: "操作日志",
					code: "read:operation-log",
				},
			},
		],
	},
];
