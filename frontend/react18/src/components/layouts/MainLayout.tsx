import { ProLayout } from "@ant-design/pro-components";
import { Dropdown } from "antd";
import type React from "react";
import { useEffect } from "react";
import {
	Link,
	useLoaderData,
	useLocation,
	useNavigate,
} from "react-router-dom";
import logo from "@/assets/logo.svg";
import { clearToken } from "@/utils/auth.ts";
import { emitter, KEY_AUTH_EXPIRED } from "@/utils/mitt.ts";
import type {ProfileResponse} from "@/services/auth.ts";
import Settings from "@/components/Settings.tsx";
import {generateMenus} from "@/utils/permission.ts";
import {allRoutes} from "@/router/routes.tsx";

export function MainLayout({ children }: { children: React.ReactNode }) {
	console.log("AppLayout render"); // This will now re-render
	const location = useLocation();
	const navigate = useNavigate();
	const userInfo = useLoaderData() as ProfileResponse;

	const handleLogout = () => {
		clearToken();
		navigate("/login");
	};

	// This effect depends on location and should be in the re-rendering component
	useEffect(() => {
		const handler = () => {
			const currentPath = location.pathname + location.search;
			navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, {
				replace: true,
			});
		};

		emitter.on(KEY_AUTH_EXPIRED, handler);
		return () => emitter.off(KEY_AUTH_EXPIRED, handler);
	}, [navigate, location]);

	if (!userInfo) {
		return null;
	}

	return (
		<ProLayout
			logo={<img src={logo} alt="logo" />}
			title="自动化发布"
			location={location}
			menuDataRender={() => generateMenus(allRoutes, userInfo.roles)}
			menuItemRender={(item, dom) => <Link to={item.path || "/"}>{dom}</Link>}
			avatarProps={{
				size: "small",
				title: userInfo.username,
				render: (_, dom) => (
					<Dropdown
						menu={{
							items: [
								{
									key: "update-pwd",
									label: (
										<Settings
                                            userInfo={userInfo}
											trigger={<div>设置</div>}
										/>
									),
								},
								{
									key: "logout",
									label: <div onClick={handleLogout}>退出登录</div>,
								},
							],
						}}
					>
						{dom}
					</Dropdown>
				),
			}}
			style={{ height: "100vh" }}
			contentStyle={{ padding: 0 }}
		>
			{children}
		</ProLayout>
	);
}
