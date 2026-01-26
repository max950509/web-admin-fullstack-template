import type {
	ActionType,
	ProColumns,
	ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import {
	BetaSchemaForm,
	type ProFormColumnsType,
} from "@ant-design/pro-components";
import { Button, message, Popconfirm, Space } from "antd";
import { type MutableRefObject, useRef } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import {
	$createDepartment,
	$deleteDepartment,
	$getDepartments,
	$updateDepartment,
	type DepartmentFormParams,
	type DepartmentItem,
} from "@/services/department";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

type DepartmentRow = DepartmentItem;

type DepartmentQuery = {
	name?: string;
};

type SelectOption = { label: string; value: number };

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() ?? "";

const filterWithAncestors = (
	items: DepartmentItem[],
	query: DepartmentQuery,
) => {
	const nameKeyword = normalizeKeyword(query.name);
	if (!nameKeyword) {
		return items;
	}

	const nodeMap = new Map<number, DepartmentItem>();
	items.forEach((item) => {
		nodeMap.set(item.id, item);
	});

	const matchedIds = new Set<number>();
	items.forEach((item) => {
		if (!item.name.toLowerCase().includes(nameKeyword)) {
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

const buildTree = (items: DepartmentItem[]) => {
	const nodeMap = new Map<
		number,
		DepartmentItem & { children?: DepartmentItem[] }
	>();
	items.forEach((item) => {
		nodeMap.set(item.id, { ...item, children: [] });
	});

	const roots: (DepartmentItem & { children?: DepartmentItem[] })[] = [];
	items.forEach((item) => {
		const node = nodeMap.get(item.id);
		if (!node) return;
		const parentId = item.parentId;
		if (parentId !== null && parentId !== undefined && nodeMap.has(parentId)) {
			nodeMap.get(parentId)?.children?.push(node);
		} else {
			roots.push(node);
		}
	});

	const sortNodes = (
		nodes: (DepartmentItem & { children?: DepartmentItem[] })[],
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

const mapParentOptions = (items: DepartmentItem[]): SelectOption[] => {
	return items.map((item) => ({ label: item.name, value: item.id }));
};

const BASE_COLUMNS: ProColumns<DepartmentRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<DepartmentRow>
				trigger={<a>{text}</a>}
				title="部门详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "部门名称",
		dataIndex: "name",
		formItemProps: { rules: [{ required: true, message: "请输入部门名称" }] },
	},
	{
		title: "父级部门",
		dataIndex: "parentId",
		valueType: "select",
		hideInSearch: true,
		fieldProps: {
			showSearch: true,
			optionFilterProp: "label",
			placeholder: "请选择父级部门",
		},
		render: (_, record) => record.parentId ?? "-",
	},
	{
		title: "排序",
		dataIndex: "sort",
		valueType: "digit",
		hideInSearch: true,
		initialValue: 0,
	},
	{
		title: "创建时间",
		dataIndex: "createdAt",
		valueType: "dateTime",
		hideInSearch: true,
		hideInForm: true,
	},
	{
		title: "更新时间",
		dataIndex: "updatedAt",
		valueType: "dateTime",
		hideInSearch: true,
		hideInForm: true,
	},
];

const BASE_FORM_COLS =
	BASE_COLUMNS as ProFormColumnsType<DepartmentFormParams>[];

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (text) => text },
}) as ProDescriptionsItemProps<DepartmentRow>[];

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
	updateFormCols: ProFormColumnsType<DepartmentFormParams>[],
	onUpdate: (
		record: DepartmentRow,
		values: DepartmentFormParams,
	) => Promise<void>,
	onDelete: (record: DepartmentRow) => Promise<void>,
): ProColumns<DepartmentRow> => ({
	title: "操作",
	valueType: "option",
	fixed: "right",
	width: 140,
	render: (_, record) => (
		<Space>
			<BetaSchemaForm<DepartmentFormParams>
				layoutType="ModalForm"
				title="编辑部门"
				trigger={<a>编辑</a>}
				columns={updateFormCols}
				initialValues={record}
				onFinish={async (values) => {
					await onUpdate(record, values);
					return true;
				}}
				modalProps={COMMON_MODAL_PROPS}
			/>
			<Popconfirm
				title="确认删除吗"
				onConfirm={async () => {
					await onDelete(record);
				}}
			>
				<a>删除</a>
			</Popconfirm>
		</Space>
	),
});

export default function DepartmentPage() {
	const actionRef = useRef<ActionType | null>(null);
	const departmentMapRef = useRef<Map<number, DepartmentItem>>(new Map());

	const syncDepartments = (items: DepartmentItem[]) => {
		departmentMapRef.current = new Map(items.map((item) => [item.id, item]));
	};

	const fetchDepartments = async () => {
		const { data } = await $getDepartments();
		const items = data ?? [];
		syncDepartments(items);
		return items;
	};

	const requestParentOptions = async () => {
		const items = await fetchDepartments();
		return mapParentOptions(items);
	};

	const parentName = (parentId?: number | null) => {
		if (!parentId) {
			return "-";
		}
		return departmentMapRef.current.get(parentId)?.name ?? parentId;
	};

	const createFormCols = patchSchema(BASE_FORM_COLS, {
		parentId: { request: requestParentOptions },
	});
	const updateFormCols = patchSchema(BASE_FORM_COLS, {
		id: { hideInForm: false, fieldProps: { disabled: true } },
		parentId: { request: requestParentOptions },
	});

	const tableColumns = [
		...BASE_COLUMNS.map((column) => {
			if (column.dataIndex === "parentId") {
				return {
					...column,
					render: (_: unknown, record: DepartmentRow) =>
						parentName(record.parentId),
					request: requestParentOptions,
				};
			}
			return column;
		}),
		buildOptionColumn(
			actionRef,
			updateFormCols,
			async (record, values) => {
				await $updateDepartment(record.id, values);
				message.success("更新成功");
				actionRef.current?.reload();
			},
			async (record) => {
				await $deleteDepartment(record.id);
				message.success("删除成功");
				actionRef.current?.reload();
			},
		),
	];

	return (
		<BaseProTable<DepartmentRow, DepartmentQuery>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<DepartmentFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增部门"
					trigger={<Button type="primary">新建</Button>}
					columns={createFormCols}
					onFinish={async (values) => {
						await $createDepartment(values);
						message.success("创建成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>,
			]}
			request={async (params) => {
				const items = await fetchDepartments();
				const filtered = filterWithAncestors(items, params);
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
