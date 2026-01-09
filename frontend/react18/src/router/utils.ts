import type { AppRouteObject } from "./routes";

/**
 * 根据用户权限过滤路由
 * @param routes - 全量路由表
 * @param permissions - 用户拥有的权限code列表
 * @returns 可访问的路由表
 */
export function filterAccessibleRoutes(
	routes: AppRouteObject[],
	permissions: string[],
): AppRouteObject[] {
	const accessibleRoutes: AppRouteObject[] = [];

	routes.forEach((route) => {
		// 复制一份路由对象，避免直接修改原始配置
		const newRoute = { ...route };
		const requiredPermission = newRoute.handle?.code;

		// 判断当前路由是否可访问
		// 1. 如果路由不需要权限 (没有 handle.code)，则可访问
		// 2. 如果路由需要权限，检查用户权限列表是否包含该code
		const hasPermission =
			!requiredPermission || permissions.includes(requiredPermission);

		if (hasPermission) {
			// 如果当前路由有子路由，递归过滤子路由
			if (newRoute.children && newRoute.children.length > 0) {
				newRoute.children = filterAccessibleRoutes(
					newRoute.children,
					permissions,
				);
				// 如果过滤后，父路由的子路由变为空，且该父路由自身没有作为独立页面(没有element)，则不添加该父路由
				// 如果父路由本身是个页面（例如有Outlet），即使子路由为空也应该保留
				if (newRoute.children.length === 0 && !newRoute.element) {
					return;
				}
			}
			accessibleRoutes.push(newRoute);
		}
	});

	return accessibleRoutes;
}
