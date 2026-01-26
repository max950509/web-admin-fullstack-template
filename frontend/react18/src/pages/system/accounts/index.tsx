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
import { type MutableRefObject, useRef } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import {
	$createAccount,
	$deleteAccount,
	$getAccounts,
	$updateAccount,
	type AccountFormParams,
	type AccountRow,
} from "@/services/account";
import { $getDepartmentOptions } from "@/services/department";
import { $getPositionOptions } from "@/services/position";
import { $getRolesOptions } from "@/services/role";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

type SelectOption = { label: string; value: number };

const BASE_COLS: ProColumns<AccountRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<AccountRow>
				trigger={<a>{text}</a>}
				title="账号详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "账号名",
		dataIndex: "username",
		formItemProps: { rules: [{ required: true, message: "请输入账号名" }] },
	},
	{
		title: "部门",
		dataIndex: "departmentId",
		valueType: "select",
		hideInSearch: true,
		fieldProps: {
			placeholder: "请选择部门",
		},
		render: (_: unknown, record: AccountRow) => record.department?.name ?? "-",
	},
	{
		title: "岗位",
		dataIndex: "positionId",
		valueType: "select",
		hideInSearch: true,
		fieldProps: {
			placeholder: "请选择岗位",
		},
		render: (_: unknown, record: AccountRow) => record.position?.name ?? "-",
	},
	{
		title: "密码",
		dataIndex: "password",
		valueType: "password",
		hideInTable: true,
		hideInSearch: true,
	},
	{
		title: "角色",
		dataIndex: "roleIds",
		valueType: "select",
		fieldProps: {
			mode: "multiple",
			placeholder: "请选择角色",
		},
		formItemProps: { rules: [{ required: true, message: "请选择角色" }] },
		render: (_: unknown, record: AccountRow) => {
			return record.roles.map((role) => <Tag key={role.id}>{role.name}</Tag>);
		},
	},
];

const BASE_FORM_COLS = BASE_COLS as ProFormColumnsType<AccountFormParams>[];

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (_) => _ },
	password: { hideInDescriptions: true },
}) as ProDescriptionsItemProps<AccountRow>[];

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
	updateFormCols: ProFormColumnsType<AccountFormParams>[],
): ProColumns<AccountRow> => {
	return {
		title: "操作",
		valueType: "option",
		fixed: "right",
		width: 160,
		render: (_, record) => (
			<Space>
				<BetaSchemaForm<AccountFormParams>
					layoutType="ModalForm"
					title="编辑账号"
					trigger={<a>编辑</a>}
					columns={updateFormCols}
					initialValues={{
						...record,
						roleIds: record.roles.map((r) => r.id),
					}}
					onFinish={async (values) => {
						await $updateAccount(record.id, values);
						message.success("更新成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>
				<Popconfirm
					title="确认删除吗"
					onConfirm={async () => {
						await $deleteAccount(record.id);
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

export default function Account() {
	const actionRef = useRef<ActionType | null>(null);
	const requestRoleOptions = async (): Promise<SelectOption[]> => {
		const { data } = await $getRolesOptions();
		return data.map((item) => ({ label: item.name, value: item.id }));
	};
	const requestDepartmentOptions = async (): Promise<SelectOption[]> => {
		const { data } = await $getDepartmentOptions();
		return data.map((item) => ({ label: item.name, value: item.id }));
	};
	const requestPositionOptions = async (): Promise<SelectOption[]> => {
		const { data } = await $getPositionOptions();
		return data.map((item) => ({
			label: item.departmentName
				? `${item.departmentName} / ${item.name}`
				: item.name,
			value: item.id,
		}));
	};

	const createFormCols = patchSchema(BASE_FORM_COLS, {
		roleIds: { request: requestRoleOptions },
		departmentId: { request: requestDepartmentOptions },
		positionId: { request: requestPositionOptions },
		password: {
			hideInForm: false,
			formItemProps: { rules: [{ required: true, message: "请输入密码" }] },
		},
	});
	const updateFormCols = patchSchema(BASE_FORM_COLS, {
		roleIds: { request: requestRoleOptions },
		departmentId: { request: requestDepartmentOptions },
		positionId: { request: requestPositionOptions },
		id: { hideInForm: false, fieldProps: { disabled: true } },
		password: { hideInForm: true },
	});

	const tableColumns = [
		...BASE_COLS.map((column) => {
			if (column.dataIndex === "roleIds") {
				return { ...column, request: requestRoleOptions };
			}
			if (column.dataIndex === "departmentId") {
				return { ...column, request: requestDepartmentOptions };
			}
			if (column.dataIndex === "positionId") {
				return { ...column, request: requestPositionOptions };
			}
			return column;
		}),
		buildOptionColumn(actionRef, updateFormCols),
	];

	return (
		<BaseProTable<AccountRow, Record<string, any>>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<AccountFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增账号"
					trigger={<Button type="primary">新建</Button>}
					columns={createFormCols}
					onFinish={async (values) => {
						await $createAccount(values);
						message.success("创建成功");
						actionRef.current?.reload();
						return true;
					}}
					modalProps={COMMON_MODAL_PROPS}
				/>,
			]}
			requestApi={$getAccounts}
			columns={tableColumns}
			scroll={{ x: "100%" }}
		/>
	);
}
