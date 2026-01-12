import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, message } from "antd";
import { useRef } from "react";
import { BaseProTable, DeleteAction, FormModal } from "@/components/table";
import {
	$createAccount,
	$getAccounts,
	type AccountItem,
} from "@/services/account.ts";

export default () => {
	const actionRef = useRef<ActionType | null>(null);

	const handleCreate = async (params: AccountItem) => {
		await $createAccount(params);
		message.success("创建成功");
		actionRef.current?.reload();
	};
	const columns: ProColumns<AccountItem>[] = [
		{
			title: "ID",
			dataIndex: "id",
			hideInForm: true,
			width: 50,
			search: false,
			render: (text, record) => {
				return (
					<FormModal
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
			formItemProps: {
				rules: [
					{
						required: true,
					},
				],
			},
		},
		{
			title: "操作",
			valueType: "option",
			fixed: "right",
			width: 50,
			render: (_) => <DeleteAction tableRef={actionRef} />,
		},
	];

	return (
		<BaseProTable<AccountItem>
			actionRef={actionRef}
			toolBarRender={() => [
				<FormModal<AccountItem>
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
