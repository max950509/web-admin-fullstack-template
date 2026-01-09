import { Dropdown, type MenuProps, Tabs } from "antd";
import React, { useEffect } from "react";
import { useAliveController } from "react-activation";
import {
	matchRoutes,
	Navigate,
	Outlet,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { useTabs } from "@/contexts/TabsContext.tsx";
import type { AppRouteHandle } from "@/router/routes.tsx";
import { allRoutes } from "@/router/routes.tsx";

export const RouteTabs: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { tabs, activeKey, addTab, removeTab, removeMultipleTabs } = useTabs();
	const { drop, refresh } = useAliveController();

	// Effect to sync router changes with the tabs state
	useEffect(() => {
		const matches = matchRoutes(allRoutes, location);
		if (!matches) return;

		const { pathname, search } = location;
		const curRouteMatch = matches[matches.length - 1];
		const element = curRouteMatch.route.element;

		// Do not create tabs for container or redirect routes
		if (
			!React.isValidElement(element) ||
			element.type === Outlet ||
			element.type === Navigate
		) {
			return;
		}

		const { title, fixed } =
			(curRouteMatch.route.handle as AppRouteHandle) || {};
		const tabLabel =
			(typeof title === "function" ? title(curRouteMatch) : title) || pathname;

		addTab({
			key: pathname,
			url: pathname + search,
			label: tabLabel,
			fixed,
		});
	}, [location, addTab]);

	const handleChange = (key: string) => {
		const tab = tabs.find((t) => t.key === key);
		if (tab) {
			navigate(tab.url);
		}
	};

	const handleEdit = (
		targetKey: React.MouseEvent | React.KeyboardEvent | string,
		action: "add" | "remove",
	) => {
		if (action === "remove") {
			const keyToRemove = targetKey as string;

			// Find the new path to navigate to *before* removing the tab
			if (keyToRemove === activeKey) {
				const currentIndex = tabs.findIndex((t) => t.key === keyToRemove);
				// Navigate to the tab to the left, or the right if it's the first tab
				const newActiveTab = tabs[currentIndex - 1] || tabs[currentIndex + 1];
				if (newActiveTab) {
					navigate(newActiveTab.url);
				} else {
					navigate("/");
				}
			}

			// Now, remove the tab from state and cache
			removeTab(keyToRemove);
			drop(keyToRemove);
		}
	};

	const handleMenuClick = (key: string, tabKey: string) => {
		if (key === "refresh") {
			refresh(tabKey);
		} else if (key === "closeOthers") {
			const keysToRemove = tabs
				.filter((tab) => tab.key !== tabKey && !tab.fixed)
				.map((tab) => tab.key);

			if (keysToRemove.length > 0) {
				removeMultipleTabs(keysToRemove);
				// @ts-expect-error
				keysToRemove.forEach(drop);
			}

			// If the active tab was closed, navigate to the tab that was right-clicked
			if (keysToRemove.includes(activeKey)) {
				navigate(tabKey);
			}
		} else if (key === "closeAll") {
			const keysToRemove = tabs
				.filter((tab) => !tab.fixed)
				.map((tab) => tab.key);

			if (keysToRemove.length > 0) {
				removeMultipleTabs(keysToRemove);
				// @ts-expect-error
				keysToRemove.forEach(drop);
			}

			// Navigate to the home tab if it exists
			const homeTab = tabs.find((t) => t.fixed);
			const homeKey = homeTab ? homeTab.key : "/";
			console.log(
				tabs.find((t) => t.key === activeKey && !t.fixed),
				123,
			);
			if (tabs.find((t) => t.key === activeKey && !t.fixed)) {
				navigate(homeKey);
			}
		}
	};

	const menuItems: MenuProps["items"] = [
		{ key: "refresh", label: "刷新" },
		{ key: "closeOthers", label: "关闭其他" },
		{ key: "closeAll", label: "关闭全部" },
	];

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<Tabs
				type="editable-card"
				hideAdd
				activeKey={activeKey}
				onChange={handleChange}
				onEdit={handleEdit}
				items={tabs.map((t) => ({
					key: t.key,
					label: (
						<Dropdown
							menu={{
								items: menuItems,
								onClick: ({ key }) => handleMenuClick(key, t.key),
							}}
							trigger={["contextMenu"]}
						>
							<span>{t.label}</span>
						</Dropdown>
					),
					closable: !t.fixed,
				}))}
				tabBarStyle={{ marginBottom: 0 }}
			/>
			<div style={{ flex: 1, overflow: "auto", padding: 16 }}>
				<Outlet />
			</div>
		</div>
	);
};
