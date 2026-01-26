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
		request: async () => {
			const { data } = await $getDepartmentOptions();
			return data.map((item) => ({ label: item.name, value: item.id }));
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
		dependencies: ["departmentId"],
		request: async ({ departmentId }: { departmentId?: number }) => {
			if (!departmentId) return [];
			const { data } = await $getPositionOptions(departmentId);
			return data.map((item) => ({
				label: item.departmentName
					? `${item.departmentName} / ${item.name}`
					: item.name,
				value: item.id,
			}));
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
		formItemProps: { rules: [{ required: true, message: "请选择角色" }] },
		fieldProps: {
			mode: "multiple",
			placeholder: "请选择角色",
		},
		request: async () => {
			const { data } = await $getRolesOptions();
			return data.map((item) => ({ label: item.name, value: item.id }));
		},
		render: (_: unknown, record: AccountRow) => {
			return record.roles.map((role) => <Tag key={role.id}>{role.name}</Tag>);
		},
	},
];

const BASE_FORM_COLS = BASE_COLS as ProFormColumnsType<AccountFormParams>[];

const CREATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {
	// 新增需要密码
	password: {
		hideInForm: false,
		formItemProps: { rules: [{ required: true, message: "请输入密码" }] },
	},
});

const UPDATE_FORM_COLS = patchSchema(BASE_FORM_COLS, {
	id: { hideInForm: false, fieldProps: { disabled: true } },
	// 修改不需要密码
	password: { hideInForm: true },
});

const DESC_COLUMNS = patchSchema(BASE_FORM_COLS, {
	id: { render: (_) => _ },
	password: { hideInDescriptions: true },
}) as ProDescriptionsItemProps<AccountRow>[];

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
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
					columns={UPDATE_FORM_COLS}
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

	const tableColumns = [...BASE_COLS, buildOptionColumn(actionRef)];
	return (
		<BaseProTable<AccountRow, Record<string, any>>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<AccountFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增账号"
					trigger={<Button type="primary">新建</Button>}
					columns={CREATE_FORM_COLS}
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
