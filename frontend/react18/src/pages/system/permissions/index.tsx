import type {
	ActionType,
	ProColumns,
	ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import {
	BetaSchemaForm,
	type ProFormColumnsType,
} from "@ant-design/pro-components";
import { Button, message, Popconfirm, Space, Tag } from "antd";
import type { MutableRefObject } from "react";
import { useRef } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import {
	$createPermission,
	$deletePermission,
	$getPermissions,
	$updatePermission,
	type PermissionFormParams,
	type PermissionItem,
	type PermissionType,
} from "@/services/permission";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

type PermissionRow = PermissionItem;
type PermissionQuery = {
	name?: string;
	type?: PermissionType;
	action?: string;
	resource?: string;
	current?: number;
	pageSize?: number;
};

const PERMISSION_TYPE_LABELS: Record<PermissionType, string> = {
	menu: "菜单",
	page: "页面",
	action: "操作",
};

const PERMISSION_TYPE_COLORS: Record<PermissionType, string> = {
	menu: "blue",
	page: "geekblue",
	action: "gold",
};

const PERMISSION_TYPE_ENUM = {
	menu: { text: PERMISSION_TYPE_LABELS.menu },
	page: { text: PERMISSION_TYPE_LABELS.page },
	action: { text: PERMISSION_TYPE_LABELS.action },
} as const;

const renderTypeTag = (type: PermissionType) => (
	<Tag color={PERMISSION_TYPE_COLORS[type]}>{PERMISSION_TYPE_LABELS[type]}</Tag>
);

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() ?? "";

const filterWithAncestors = (
	items: PermissionItem[],
	query: PermissionQuery,
) => {
	const nameKeyword = normalizeKeyword(query.name);
	const actionKeyword = normalizeKeyword(query.action);
	const resourceKeyword = normalizeKeyword(query.resource);
	const typeFilter = query.type;
	const hasFilter =
		Boolean(nameKeyword) ||
		Boolean(actionKeyword) ||
		Boolean(resourceKeyword) ||
		Boolean(typeFilter);

	if (!hasFilter) {
		return items;
	}

	const nodeMap = new Map<number, PermissionItem>();
	items.forEach((item) => {
		nodeMap.set(item.id, item);
	});

	const matchedIds = new Set<number>();
	items.forEach((item) => {
		if (typeFilter && item.type !== typeFilter) {
			return;
		}
		if (nameKeyword && !item.name.toLowerCase().includes(nameKeyword)) {
			return;
		}
		if (actionKeyword && !item.action.toLowerCase().includes(actionKeyword)) {
			return;
		}
		if (
			resourceKeyword &&
			!item.resource.toLowerCase().includes(resourceKeyword)
		) {
			return;
		}
		matchedIds.add(item.id);
	});

	if (matchedIds.size === 0) {
		return [];
	}

	const includedIds = new Set<number>(matchedIds);
	matchedIds.forEach((id) => {
		let current = nodeMap.get(id);
		while (current?.parentId !== null && current?.parentId !== undefined) {
			includedIds.add(current.parentId);
			current = nodeMap.get(current.parentId);
		}
	});

	return items.filter((item) => includedIds.has(item.id));
};

const buildTree = (items: PermissionItem[]) => {
	const nodeMap = new Map<
		number,
		PermissionItem & { children?: PermissionItem[] }
	>();
	items.forEach((item) => {
		nodeMap.set(item.id, { ...item, children: [] });
	});

	const roots: (PermissionItem & { children?: PermissionItem[] })[] = [];
	items.forEach((item) => {
		const node = nodeMap.get(item.id);
		if (!node) return;
		const parentId = item.parentId;
		if (parentId !== null && nodeMap.has(parentId)) {
			nodeMap.get(parentId)?.children?.push(node);
		} else {
			roots.push(node);
		}
	});

	const sortNodes = (
		nodes: (PermissionItem & { children?: PermissionItem[] })[],
	) => {
		nodes.sort((a, b) => {
			if (a.sort !== b.sort) {
				return a.sort - b.sort;
			}
			return a.name.localeCompare(b.name);
		});
		nodes.forEach((node) => {
			if (node.children && node.children.length > 0) {
				sortNodes(node.children);
			} else {
				delete node.children;
			}
		});
	};

	sortNodes(roots);
	return roots;
};

const requestParentOptions = async () => {
	const { data } = await $getPermissions();
	return (data ?? []).map((item) => {
		const code = `${item.action}:${item.resource}`;
		const label =
			item.name && item.name !== code ? `${item.name} (${code})` : code;
		return { label, value: item.id };
	});
};

const BASE_COLUMNS: ProColumns<PermissionRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		width: 160,
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<PermissionRow>
				trigger={<a>{text}</a>}
				title="权限详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "权限名",
		dataIndex: "name",
		width: 100,
		formItemProps: { rules: [{ required: true, message: "请输入权限名" }] },
	},
	{
		title: "类型",
		dataIndex: "type",
		width: 100,
		valueType: "select",
		valueEnum: PERMISSION_TYPE_ENUM,
		formItemProps: { rules: [{ required: true, message: "请选择类型" }] },
		render: (_, record) => renderTypeTag(record.type),
	},
	{
		title: "动作",
		dataIndex: "action",
		width: 80,
		formItemProps: { rules: [{ required: true, message: "请输入动作" }] },
	},
	{
		title: "资源",
		dataIndex: "resource",
		width: 80,
		formItemProps: { rules: [{ required: true, message: "请输入资源" }] },
	},
	{
		title: "父级",
		dataIndex: "parentId",
		valueType: "select",
		hideInSearch: true,
		fieldProps: {
			showSearch: true,
			placeholder: "请选择父级权限",
		},
		debounceTime: 500,
		width: 100,
		request: requestParentOptions,
		render: (_, record) => record.parentId ?? "-",
	},
	{
		title: "排序",
		dataIndex: "sort",
		valueType: "digit",
		hideInSearch: true,
		initialValue: 0,
		width: 50,
	},
	{
		title: "创建时间",
		dataIndex: "createdAt",
		valueType: "dateTime",
		hideInSearch: true,
		hideInForm: true,
		width: 170,
	},
	{
		title: "更新时间",
		dataIndex: "updatedAt",
		valueType: "dateTime",
		hideInSearch: true,
		hideInForm: true,
		width: 170,
	},
];

const BASE_FORM_COLS =
	BASE_COLUMNS as ProFormColumnsType<PermissionFormParams>[];

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (text) => text },
}) as ProDescriptionsItemProps<PermissionRow>[];

const CREATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {});

const UPDATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {
	id: { hideInForm: false, fieldProps: { disabled: true } },
});

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
): ProColumns<PermissionRow> => ({
	title: "操作",
	valueType: "option",
	fixed: "right",
	width: 140,
	render: (_, record) => (
		<Space>
			<BetaSchemaForm<PermissionFormParams>
				layoutType="ModalForm"
				title="编辑权限"
				trigger={<a>编辑</a>}
				columns={UPDATE_FORM_COLS}
				initialValues={record}
				onFinish={async (values) => {
					await $updatePermission(record.id, values);
					message.success("更新成功");
					actionRef.current?.reload();
					return true;
				}}
				modalProps={COMMON_MODAL_PROPS}
			/>
			<Popconfirm
				title="确认删除吗"
				onConfirm={async () => {
					await $deletePermission(record.id);
					message.success("删除成功");
					actionRef.current?.reload();
				}}
			>
				<a>删除</a>
			</Popconfirm>
		</Space>
	),
});

export default function PermissionPage() {
	const actionRef = useRef<ActionType | null>(null);
	const tableColumns = [...BASE_COLUMNS, buildOptionColumn(actionRef)];

	return (
		<BaseProTable<PermissionRow, PermissionQuery>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<PermissionFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增权限"
					trigger={<Button type="primary">新建</Button>}
					columns={CREATE_FORM_COLS}
					onFinish={async (values) => {
						await $createPermission(values);
						message.success("创建成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>,
			]}
			request={async (params) => {
				const { data } = await $getPermissions();
				const filtered = filterWithAncestors(data ?? [], params);
				const tree = buildTree(filtered);
				return {
					data: tree,
					total: tree.length,
					success: true,
				};
			}}
			columns={tableColumns}
			pagination={false}
			scroll={{ x: "100%" }}
			indentSize={24}
			expandable={{ childrenColumnName: "children" }}
		/>
	);
}
