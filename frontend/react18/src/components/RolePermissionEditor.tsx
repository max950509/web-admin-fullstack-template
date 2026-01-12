import { Button, Card, message, Select, Space, Tree, Typography } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import { useEffect, useMemo, useState } from "react";
import { $getPermissions, type PermissionItem } from "@/services/permission";
import { $getRoles, $updateRole, type RoleItem } from "@/services/role";

type PermissionNode = DataNode & {
	key: number;
	permission: PermissionItem;
	children?: PermissionNode[];
};

const renderPermissionTitle = (permission: PermissionItem) => {
	const code = `${permission.action}:${permission.resource}`;
	if (!permission.name || permission.name === code) {
		return code;
	}
	return (
		<span>
			<span>{permission.name}</span>
			<Typography.Text type="secondary" style={{ marginLeft: 8 }}>
				{code}
			</Typography.Text>
		</span>
	);
};

const buildPermissionTree = (permissions: PermissionItem[]) => {
	const sorted = [...permissions].sort((a, b) => {
		if (a.sort !== b.sort) {
			return a.sort - b.sort;
		}
		return a.name.localeCompare(b.name);
	});

	const nodeMap = new Map<number, PermissionNode>();
	for (const permission of sorted) {
		nodeMap.set(permission.id, {
			key: permission.id,
			title: renderPermissionTitle(permission),
			children: [],
			permission,
		});
	}

	const roots: PermissionNode[] = [];
	for (const permission of sorted) {
		const node = nodeMap.get(permission.id);
		if (!node) {
			continue;
		}
		const parentId = permission.parentId;
		if (parentId !== null && nodeMap.has(parentId)) {
			nodeMap.get(parentId)?.children?.push(node);
		} else {
			roots.push(node);
		}
	}

	const prune = (node: PermissionNode): PermissionNode => {
		if (node.children && node.children.length > 0) {
			node.children = node.children.map(prune);
		} else {
			delete node.children;
		}
		return node;
	};

	const treeData = roots.map(prune);
	return treeData;
};

const computeTreeCheckState = (
	nodes: PermissionNode[],
	selectedIds: Set<number>,
) => {
	const checked = new Set<number>();
	const halfChecked = new Set<number>();

	const dfs = (node: PermissionNode): { total: number; selected: number } => {
		const isSelectable = node.permission.type !== "menu";
		let total = isSelectable ? 1 : 0;
		let selected = isSelectable && selectedIds.has(node.key) ? 1 : 0;

		if (node.children) {
			for (const child of node.children) {
				const childState = dfs(child);
				total += childState.total;
				selected += childState.selected;
			}
		}

		if (node.permission.type === "menu") {
			if (total > 0) {
				if (selected === total) {
					checked.add(node.key);
				} else if (selected > 0) {
					halfChecked.add(node.key);
				}
			}
		} else if (selectedIds.has(node.key)) {
			checked.add(node.key);
		} else if (node.children && selected > 0) {
			halfChecked.add(node.key);
		}

		return { total, selected };
	};

	for (const node of nodes) {
		dfs(node);
	}

	return {
		checked: Array.from(checked),
		halfChecked: Array.from(halfChecked),
	};
};

const getDescendantSelectableIds = (node: PermissionNode) => {
	const ids: number[] = [];
	const stack = [...(node.children ?? [])];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) {
			continue;
		}
		if (current.permission.type !== "menu") {
			ids.push(current.permission.id);
		}
		if (current.children) {
			stack.push(...current.children);
		}
	}
	return ids;
};

export function RolePermissionEditor() {
	const [roles, setRoles] = useState<RoleItem[]>([]);
	const [permissions, setPermissions] = useState<PermissionItem[]>([]);
	const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
	const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
		[],
	);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const [rolesResponse, permissionsResponse] = await Promise.all([
					$getRoles(),
					$getPermissions(),
				]);
				const nextRoles = rolesResponse.data || [];
				const nextPermissions = permissionsResponse.data || [];
				setRoles(nextRoles);
				setPermissions(nextPermissions);
				if (nextRoles.length > 0) {
					const firstRole = nextRoles[0];
					setSelectedRoleId(firstRole.id);
					const initialIds = firstRole.permissions
						.filter((permission) => permission.type !== "menu")
						.map((permission) => permission.id);
					setSelectedPermissionIds(initialIds);
				}
			} finally {
				setLoading(false);
			}
		};

		void loadData();
	}, []);

	const treeData = useMemo(
		() => buildPermissionTree(permissions),
		[permissions],
	);

	const selectedIdSet = useMemo(
		() => new Set(selectedPermissionIds),
		[selectedPermissionIds],
	);

	const treeCheckedState = useMemo(
		() => computeTreeCheckState(treeData, selectedIdSet),
		[treeData, selectedIdSet],
	);

	const roleOptions = useMemo(
		() =>
			roles.map((role) => ({
				label: role.name,
				value: role.id,
			})),
		[roles],
	);

	const handleRoleChange = (roleId: number) => {
		setSelectedRoleId(roleId);
		const role = roles.find((item) => item.id === roleId);
		if (!role) {
			setSelectedPermissionIds([]);
			return;
		}
		const nextIds = role.permissions
			.filter((permission) => permission.type !== "menu")
			.map((permission) => permission.id);
		setSelectedPermissionIds(nextIds);
	};

	const handleCheck: TreeProps["onCheck"] = (_, info) => {
		const node = info.node as PermissionNode;
		const permission = node.permission;
		setSelectedPermissionIds((prev) => {
			const nextIds = new Set(prev);

			if (permission.type === "menu") {
				const descendantIds = getDescendantSelectableIds(node);
				if (info.checked) {
					descendantIds.forEach((id) => {
						nextIds.add(id);
					});
				} else {
					descendantIds.forEach((id) => {
						nextIds.delete(id);
					});
				}
			} else if (info.checked) {
				nextIds.add(permission.id);
			} else {
				nextIds.delete(permission.id);
			}

			return Array.from(nextIds);
		});
	};

	const handleSave = async () => {
		if (!selectedRoleId) {
			message.warning("请选择角色");
			return;
		}
		setSaving(true);
		try {
			const permissionIds = selectedPermissionIds;
			const response = await $updateRole(selectedRoleId, { permissionIds });
			const updatedRole = response.data;
			setRoles((prev) =>
				prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)),
			);
			const nextIds = updatedRole.permissions
				.filter((permission) => permission.type !== "menu")
				.map((permission) => permission.id);
			setSelectedPermissionIds(nextIds);
			message.success("权限已更新");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card title="角色权限配置" loading={loading}>
			<Space direction="vertical" size="large" style={{ width: "100%" }}>
				<Space>
					<span>选择角色</span>
					<Select
						style={{ minWidth: 200 }}
						options={roleOptions}
						value={selectedRoleId ?? undefined}
						onChange={handleRoleChange}
						placeholder="请选择角色"
					/>
					<Button type="primary" onClick={handleSave} loading={saving}>
						保存权限
					</Button>
				</Space>
				<Tree
					checkable
					checkStrictly
					defaultExpandAll
					treeData={treeData}
					checkedKeys={treeCheckedState}
					onCheck={handleCheck}
				/>
			</Space>
		</Card>
	);
}
