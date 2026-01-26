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
import { $getDepartmentOptions } from "@/services/department";
import {
	$createPosition,
	$deletePosition,
	$getPositions,
	$updatePosition,
	type PositionFormParams,
	type PositionItem,
	type PositionQuery,
} from "@/services/position";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

type PositionRow = PositionItem;

type SelectOption = { label: string; value: number };

const BASE_COLUMNS: ProColumns<PositionRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<PositionRow>
				trigger={<a>{text}</a>}
				title="岗位详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "岗位名称",
		dataIndex: "name",
		formItemProps: { rules: [{ required: true, message: "请输入岗位名称" }] },
	},
	{
		title: "所属部门",
		dataIndex: "departmentId",
		valueType: "select",
		hideInSearch: true,
		fieldProps: {
			placeholder: "请选择部门",
		},
		render: (_: unknown, record: PositionRow) => record.department?.name ?? "-",
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

const BASE_FORM_COLS = BASE_COLUMNS as ProFormColumnsType<PositionFormParams>[];

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (text) => text },
}) as ProDescriptionsItemProps<PositionRow>[];

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
	updateFormCols: ProFormColumnsType<PositionFormParams>[],
): ProColumns<PositionRow> => {
	return {
		title: "操作",
		valueType: "option",
		fixed: "right",
		width: 160,
		render: (_, record) => (
			<Space>
				<BetaSchemaForm<PositionFormParams>
					layoutType="ModalForm"
					title="编辑岗位"
					trigger={<a>编辑</a>}
					columns={updateFormCols}
					initialValues={record}
					onFinish={async (values) => {
						await $updatePosition(record.id, values);
						message.success("更新成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>
				<Popconfirm
					title="确认删除吗"
					onConfirm={async () => {
						await $deletePosition(record.id);
						message.success("删除成功");
						actionRef.current?.reload();
					}}
				>
					<a>删除</a>
				</Popconfirm>
			</Space>
		),
	};
};

export default function PositionPage() {
	const actionRef = useRef<ActionType | null>(null);
	const requestDepartmentOptions = async (): Promise<SelectOption[]> => {
		const { data } = await $getDepartmentOptions();
		return data.map((item) => ({ label: item.name, value: item.id }));
	};

	const createFormCols = patchSchema(BASE_FORM_COLS, {
		departmentId: { request: requestDepartmentOptions },
	});
	const updateFormCols = patchSchema(BASE_FORM_COLS, {
		id: { hideInForm: false, fieldProps: { disabled: true } },
		departmentId: { request: requestDepartmentOptions },
	});

	const tableColumns = [
		...BASE_COLUMNS.map((column) =>
			column.dataIndex === "departmentId"
				? { ...column, request: requestDepartmentOptions }
				: column,
		),
		buildOptionColumn(actionRef, updateFormCols),
	];

	return (
		<BaseProTable<PositionRow, PositionQuery>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<PositionFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增岗位"
					trigger={<Button type="primary">新建</Button>}
					columns={createFormCols}
					onFinish={async (values) => {
						await $createPosition(values);
						message.success("创建成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>,
			]}
			requestApi={$getPositions}
			columns={tableColumns}
			scroll={{ x: "100%" }}
		/>
	);
}
