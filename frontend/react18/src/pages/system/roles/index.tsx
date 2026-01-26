import type {
	ActionType,
	ProColumns,
	ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import {
	BetaSchemaForm,
	type ProFormColumnsType,
} from "@ant-design/pro-components";
import {
	Button,
	Modal,
	message,
	Popconfirm,
	Space,
	Tree,
	Typography,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import { $getPermissions, type PermissionItem } from "@/services/permission";
import {
	$createRole,
	$deleteRole,
	$getRole,
	$getRoles,
	$updateRole,
	type RoleFormParams,
	type RoleRow,
} from "@/services/role";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

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

	return roots.map(prune);
};

const BASE_COLS: ProColumns<RoleRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<RoleRow>
				trigger={<a>{text}</a>}
				title="角色详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "角色名",
		dataIndex: "name",
		formItemProps: { rules: [{ required: true, message: "请输入角色名" }] },
	},
];

const BASE_FORM_COLS = BASE_COLS as ProFormColumnsType<RoleFormParams>[];

const CREATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {});

const UPDATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {
	id: { hideInForm: false, fieldProps: { disabled: true } },
});

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (text) => text },
}) as ProDescriptionsItemProps<RoleRow>[];

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
	onOpenPermission: (role: RoleRow) => void,
): ProColumns<RoleRow> => ({
	title: "操作",
	valueType: "option",
	fixed: "right",
	width: 200,
	render: (_, record) => (
		<Space>
			<BetaSchemaForm<RoleFormParams>
				layoutType="ModalForm"
				title="编辑角色"
				trigger={<a>编辑</a>}
				columns={UPDATE_FORM_COLS}
				initialValues={record}
				onFinish={async (values) => {
					await $updateRole(record.id, values);
					message.success("更新成功");
					actionRef.current?.reload();
					return true;
				}}
				modalProps={COMMON_MODAL_PROPS}
			/>
			{record.name !== "admin" ? (
				<a onClick={() => onOpenPermission(record)}>权限</a>
			) : null}
			<Popconfirm
				title="确认删除吗"
				onConfirm={async () => {
					await $deleteRole(record.id);
					message.success("删除成功");
					actionRef.current?.reload();
				}}
			>
				<a>删除</a>
			</Popconfirm>
		</Space>
	),
});

export default function RolePage() {
	const actionRef = useRef<ActionType | null>(null);
	const [permissions, setPermissions] = useState<PermissionItem[]>([]);
	const [permissionModalOpen, setPermissionModalOpen] = useState(false);
	const [activeRole, setActiveRole] = useState<RoleRow | null>(null);
	const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
		[],
	);
	const [savingPermissions, setSavingPermissions] = useState(false);

	useEffect(() => {
		$getPermissions().then((res) => {
			setPermissions(res.data ?? []);
		});
	}, []);

	const treeData = buildPermissionTree(permissions);
	const permissionMap = new Map(
		permissions.map((permission) => [permission.id, permission]),
	);

	const openPermissionModal = async (role: RoleRow) => {
		setSelectedPermissionIds([]);
		setActiveRole(role);
		setPermissionModalOpen(true);
		const { data } = await $getRole(role.id);
		const nextIds = (data.permissions ?? [])
			.filter((permission) => permission.type !== "menu")
			.map((permission) => permission.id);
		setSelectedPermissionIds(nextIds);
	};

	const handlePermissionCheck = (
		checked:
			| React.Key[]
			| {
					checked: React.Key[];
					halfChecked: React.Key[];
			  },
	) => {
		const checkedKeys = Array.isArray(checked) ? checked : checked.checked;
		const nextIds = checkedKeys.filter((id) => {
			const permission = permissionMap.get(id as number);
			return permission && permission.type !== "menu";
		});
		setSelectedPermissionIds(nextIds as number[]);
	};

	const handlePermissionSave = async () => {
		if (!activeRole) {
			return;
		}
		setSavingPermissions(true);
		try {
			await $updateRole(activeRole.id, {
				permissionIds: selectedPermissionIds,
			});
			message.success("权限已更新");
			setPermissionModalOpen(false);
			setActiveRole(null);
			actionRef.current?.reload();
		} finally {
			setSavingPermissions(false);
		}
	};

	const tableColumns = [
		...BASE_COLS,
		buildOptionColumn(actionRef, openPermissionModal),
	];

	return (
		<>
			<BaseProTable<RoleRow, Record<string, any>>
				actionRef={actionRef}
				toolBarRender={() => [
					<BetaSchemaForm<RoleFormParams>
						key="create"
						layoutType="ModalForm"
						title="新增角色"
						trigger={<Button type="primary">新建</Button>}
						columns={CREATE_FORM_COLS}
						onFinish={async (values) => {
							await $createRole({ ...values, permissionIds: [] });
							message.success("创建成功");
							actionRef.current?.reload();
							return true;
						}}
						modalProps={COMMON_MODAL_PROPS}
					/>,
				]}
				requestApi={$getRoles}
				columns={tableColumns}
				scroll={{ x: "100%" }}
			/>
			<Modal
				title={activeRole ? `分配权限：${activeRole.name}` : "分配权限"}
				open={permissionModalOpen}
				onCancel={() => {
					setPermissionModalOpen(false);
					setActiveRole(null);
				}}
				onOk={handlePermissionSave}
				okButtonProps={{ loading: savingPermissions }}
				{...COMMON_MODAL_PROPS}
			>
				<Tree
					checkable
					defaultExpandAll
					treeData={treeData}
					checkedKeys={selectedPermissionIds}
					onCheck={handlePermissionCheck}
				/>
			</Modal>
		</>
	);
}
