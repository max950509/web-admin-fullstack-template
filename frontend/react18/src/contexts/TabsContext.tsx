import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
	type AppRouteHandle,
	type AppRouteObject,
	allRoutes,
} from "@/router/routes";

export interface Tab {
	key: string; // A unique key, usually the path
	url: string; // Full URL with search params
	label: React.ReactNode;
	fixed?: boolean; // For tabs that cannot be closed
}

interface TabsContextType {
	tabs: Tab[];
	activeKey: string;
	addTab: (
		tab: Omit<Tab, "url" | "label"> & { label: React.ReactNode; url?: string },
	) => void;
	removeTab: (targetKey: string) => void;
	removeMultipleTabs: (targetKeys: string[]) => void; // <-- 新增批量删除函数类型
}

const TabsContext = createContext<TabsContextType | null>(null);

export const TabsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const initialTabs = useMemo(() => {
		const tabs: Tab[] = [];
		const findFixedRoutes = (routes: AppRouteObject[]) => {
			for (const route of routes) {
				const { title, fixed } = (route.handle as AppRouteHandle) || {};
				if (fixed) {
					const path = route.path as string;
					tabs.push({
						key: path,
						url: path,
						label: (typeof title === "function" ? title(route) : title) || path,
						fixed: true,
					});
				}
				if (route.children) {
					findFixedRoutes(route.children);
				}
			}
		};
		findFixedRoutes(allRoutes);
		return tabs;
	}, []);

	const [tabs, setTabs] = useState<Tab[]>(initialTabs);
	const [activeKey, setActiveKey] = useState<string>("");
	const location = useLocation();

	const addTab = useCallback(
		(
			tabInfo: Omit<Tab, "url" | "label"> & {
				label: React.ReactNode;
				url?: string;
			},
		) => {
			setTabs((prevTabs) => {
				const existingTab = prevTabs.find((t) => t.key === tabInfo.key);
				const newUrl = tabInfo.url || tabInfo.key;

				if (existingTab) {
					if (
						existingTab.label !== tabInfo.label ||
						existingTab.url !== newUrl
					) {
						return prevTabs.map((t) =>
							t.key === tabInfo.key
								? { ...t, label: tabInfo.label, url: newUrl }
								: t,
						);
					}
					return prevTabs;
				}
				const newTab: Tab = {
					key: tabInfo.key,
					url: newUrl,
					label: tabInfo.label as string,
					fixed: tabInfo.fixed,
				};
				return [...prevTabs, newTab];
			});
		},
		[],
	);

	// 只负责移除状态，不处理副作用
	const removeTab = useCallback((targetKey: string) => {
		setTabs((prevTabs) => {
			const tabToRemove = prevTabs.find((t) => t.key === targetKey);
			if (tabToRemove?.fixed) {
				return prevTabs;
			}
			return prevTabs.filter((t) => t.key !== targetKey);
		});
	}, []);

	// 只负责移除状态，不处理副作用
	const removeMultipleTabs = useCallback((targetKeys: string[]) => {
		setTabs((prevTabs) =>
			prevTabs.filter((t) => t.fixed || !targetKeys.includes(t.key)),
		);
	}, []);

	useEffect(() => {
		setActiveKey(location.pathname);
	}, [location.pathname]);

	return (
		<TabsContext.Provider
			value={{ tabs, activeKey, addTab, removeTab, removeMultipleTabs }}
		>
			{children}
		</TabsContext.Provider>
	);
};

export const useTabs = () => {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error("useTabs must be used within a TabsProvider");
	}
	return context;
};
