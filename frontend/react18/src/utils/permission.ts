import type { MenuDataItem } from "@ant-design/pro-components";
import type { AppRouteObject } from "@/router/routes.tsx";
import type { ProfileResponse } from "@/services/auth.ts";

/**
 * 检查用户是否拥有指定 code 的权限
 * @param code 需要检查的权限 code
 * @param roles 用户的角色列表
 * @returns 是否有权限
 */
export function checkPermissionByCode(
	code: string | undefined,
	roles: ProfileResponse["roles"],
): boolean {
	// 如果路由本身没有定义 code，则默认允许访问
	if (!code) {
		return true;
	}
	const codes = new Set<string>();
	// 遍历所有角色，递归提取权限 code
	roles.forEach((role) => {
		role.permissions.forEach((permission) => {
			codes.add(`${permission.action}:${permission.resource}`);
		});
	});
	return codes.has(code);
}

/**
 * 根据路由列表和权限生成菜单
 * @param allRoutes - 全量路由表
 * @param roles - 用户的角色列表
 * @returns 可访问的菜单项列表
 */
export function generateMenus(
	allRoutes: AppRouteObject[],
	roles: ProfileResponse["roles"],
): MenuDataItem[] {
	const permissionCodes = new Set<string>();
	roles.forEach((role) => {
		role.permissions.forEach((permission) => {
			permissionCodes.add(`${permission.action}:${permission.resource}`);
		});
	});

	const transform = (routes: AppRouteObject[]): MenuDataItem[] => {
		const menuItems: MenuDataItem[] = [];

		for (const route of routes) {
			if (!route?.handle?.title) {
				continue;
			}
			// 1. 优先递归处理子路由
			let visibleChildren: MenuDataItem[] | undefined;
			if (route.children && route.children.length > 0) {
				const childMenus = transform(route.children);
				// 只有当子菜单列表不为空时，才认为它有可见的子菜单
				if (childMenus.length > 0) {
					visibleChildren = childMenus;
				}
			}

			// 2. 检查路由本身的权限
			const hasPermission =
				!route.handle?.code || permissionCodes.has(route.handle.code);
			// 3. 根据最新的规则生成菜单项
			// 规则A: 如果一个路由有可见的子菜单，则它作为一个父菜单展示
			if (visibleChildren) {
				const menuItem: MenuDataItem = {
					key: route.path || route.id || Math.random().toString(),
					path: route.path,
					name: route.handle.title,
					children: visibleChildren,
				};
				menuItems.push(menuItem);
			}
			// 规则B: 如果一个路由是叶子节点 (没有子路由) 并且它自身有权限，则展示
			else if (!route.children && hasPermission) {
				const menuItem: MenuDataItem = {
					key: route.path || route.id || Math.random().toString(),
					path: route.path,
					name: route.handle.title,
				};
				menuItems.push(menuItem);
			}
		}
		return menuItems;
	};

	return transform(allRoutes);
}
