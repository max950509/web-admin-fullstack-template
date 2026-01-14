import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, message, Popconfirm, Space } from "antd";
import { useRef } from "react";
import { BaseProTable, FormModal } from "@/components/table";
import {
	$createAccount,
	$deleteAccount,
	$getAccounts,
	type Account,
	type CreateAccountParams,
	type UpdateAccountParams,
} from "@/services/account";

type AccountSchema = Account & CreateAccountParams & UpdateAccountParams;

export default () => {
	const actionRef = useRef<ActionType | null>(null);

	const handleCreate = async (params: AccountSchema) => {
		await $createAccount(params);
		message.success("创建成功");
		actionRef.current?.reload();
	};

	const handleDelete = async (record: AccountSchema) => {
		await $deleteAccount(record.id);
		message.success("删除成功");
		actionRef.current?.reload();
	};

	const columns: ProColumns<AccountSchema>[] = [
		{
			title: "ID",
			dataIndex: "id",
			hideInForm: true,
			width: 50,
			search: false,
			render: (text, record) => {
				return (
					<FormModal
						title="账号详情"
						trigger={<a>{text}</a>}
						record={record}
						columns={columns}
						disabled={true}
					/>
				);
			},
		},
		{
			title: "账号名",
			dataIndex: "username",
			width: 80,
			formItemProps: {
				rules: [
					{
						required: true,
					},
				],
			},
		},
		{
			title: "密码",
			dataIndex: "password",
			hideInSearch: true,
			hideInTable: true,
			width: 120,
			formItemProps: (form) => {
				// 如果是编辑模式（存在记录），则不显示密码字段
				if (form.getFieldValue("id")) {
					// 编辑模式下隐藏密码字段
					return {
						hidden: true,
						rules: [],
					};
				}
				// 新增模式下显示密码字段并要求输入
				return {
					rules: [
						{
							required: true,
						},
					],
				};
			},
		},
		{
			title: "操作",
			valueType: "option",
			fixed: "right",
			width: 50,
			render: (_, record) => (
				<Space>
					<FormModal
						title="编辑账号"
						trigger={<a>编辑</a>}
						record={record}
						columns={columns}
					/>
					<Popconfirm title="确认删除吗" onConfirm={() => handleDelete(record)}>
						<a>删除</a>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<BaseProTable<AccountSchema>
			actionRef={actionRef}
			toolBarRender={() => [
				<FormModal<AccountSchema>
					key="1"
					title="新增账号"
					tableRef={actionRef}
					trigger={<Button type="primary">新建</Button>}
					service={handleCreate}
					columns={columns}
				/>,
			]}
			requestApi={$getAccounts}
			columns={columns}
			scroll={{ x: "100%" }}
		/>
	);
};
