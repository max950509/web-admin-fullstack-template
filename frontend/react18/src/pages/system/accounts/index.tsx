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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { $getRolesOptions } from "@/services/role";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

export default function AccountPage() {
	const actionRef = useRef<ActionType | null>(null);
	const [roleOptions, setRoleOptions] = useState<
		{ label: string; value: number }[]
	>([]);

	useEffect(() => {
		$getRolesOptions().then((res) => {
			setRoleOptions(
				res.data.map((item: { name: string; id: number }) => ({
					label: item.name,
					value: item.id,
				})),
			);
		});
	}, []);

	// CRUD baseColumns
	const baseColumns = useMemo<ProColumns<AccountRow>[]>(() => {
		return [
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
						columns={descColumns}
					/>
				),
			},
			{
				title: "账号名",
				dataIndex: "username",
				formItemProps: { rules: [{ required: true, message: "请输入账号名" }] },
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
					options: roleOptions,
				},
				formItemProps: { rules: [{ required: true, message: "请选择角色" }] },
				render: (_, record) => {
					return record.roles.map((role) => (
						<Tag key={role.id}>{role.name}</Tag>
					));
				},
			},
		];
	}, [roleOptions]);

	// SchemaForm 基础列：从 baseColumns 派生（可作数据处理，这里暂无需要）
	const baseFormCols = useMemo(() => {
		return baseColumns as ProFormColumnsType<AccountFormParams>[];
	}, [baseColumns]);

	const createFormCols = useMemo(
		() =>
			patchSchema(baseFormCols, {
				// 新增需要密码
				password: {
					hideInForm: false,
					formItemProps: { rules: [{ required: true, message: "请输入密码" }] },
				},
			}),
		[baseFormCols],
	);

	const updateFormCols = useMemo(
		() =>
			patchSchema(baseFormCols, {
				id: { hideInForm: false, fieldProps: { disabled: true } },
				// 修改不需要密码
				password: { hideInForm: true },
			}),
		[baseFormCols],
	);

	const descColumns = useMemo(() => {
		return patchSchema(baseFormCols, {
			id: { render: (_) => _ },
			// 编辑不需要密码
			password: { hideInDescriptions: true },
		}) as ProDescriptionsItemProps<AccountRow>[];
	}, [baseColumns]);

	// Table 列：直接复用 baseColumns，再 append 操作列
	const tableColumns = useMemo<ProColumns<AccountRow>[]>(() => {
		const optionCol: ProColumns<AccountRow> = {
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

		return [...baseColumns, optionCol];
	}, [baseColumns, updateFormCols]);

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
					{...COMMON_MODAL_PROPS}
				/>,
			]}
			requestApi={$getAccounts}
			columns={tableColumns}
			scroll={{ x: "100%" }}
		/>
	);
}
