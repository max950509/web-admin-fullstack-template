import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
	BetaSchemaForm,
	type ProFormColumnsType,
} from "@ant-design/pro-components";
import { Button, message, Popconfirm, Space, Tag } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import { $getPermissions, type PermissionItem } from "@/services/permission";
import {
	$createRole,
	$deleteRole,
	$getRoles,
	$updateRole,
	type RoleFormParams,
	type RoleRow,
} from "@/services/role";
import { patchSchema } from "@/utils/common.ts";
import { COMMON_MODAL_PROPS } from "@/utils/constants.ts";

export default function RolePage() {
	const actionRef = useRef<ActionType | null>(null);
	const [permissionOptions, setPermissionOptions] = useState<
		{ label: string; value: number }[]
	>([]);

	useEffect(() => {
		$getPermissions().then((permissions) => {
			const options = permissions.map((p: PermissionItem) => ({
				label: p.name,
				value: p.id,
			}));
			setPermissionOptions(options);
		});
	}, []);

	const baseColumns = useMemo<ProColumns<RoleRow>[]>(() => {
		return [
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
						columns={descColumns}
					/>
				),
			},
			{
				title: "角色名",
				dataIndex: "name",
				formItemProps: { rules: [{ required: true, message: "请输入角色名" }] },
			},
			{
				title: "权限",
				dataIndex: "permissionIds",
				valueType: "select",
				fieldProps: {
					mode: "multiple",
					options: permissionOptions,
					placeholder: "请选择权限",
				},
				render: (_, record) => (
					<Space wrap>
						{record.permissions.map((p) => (
							<Tag key={p.id}>{p.name}</Tag>
						))}
					</Space>
				),
				formItemProps: { rules: [{ required: true, message: "请选择权限" }] },
			},
		];
	}, [permissionOptions]);

	const baseFormCols = useMemo(() => {
		return baseColumns as ProFormColumnsType<RoleFormParams>[];
	}, [baseColumns]);

	const createFormCols = useMemo(
		() => patchSchema(baseFormCols, {}),
		[baseFormCols],
	);

	const updateFormCols = useMemo(
		() =>
			patchSchema(baseFormCols, {
				id: { hideInForm: false, fieldProps: { disabled: true } },
			}),
		[baseFormCols],
	);

	const descColumns = useMemo(() => {
		return baseColumns.filter((c) => !c.hideInTable) as any;
	}, [baseColumns]);

	const tableColumns = useMemo<ProColumns<RoleRow>[]>(() => {
		const optionCol: ProColumns<RoleRow> = {
			title: "操作",
			valueType: "option",
			fixed: "right",
			width: 160,
			render: (_, record) => (
				<Space>
					<BetaSchemaForm<RoleFormParams>
						layoutType="ModalForm"
						title="编辑角色"
						trigger={<a>编辑</a>}
						columns={updateFormCols}
						initialValues={{
							...record,
							permissionIds: record.permissions.map((p) => p.id),
						}}
						onFinish={async (values) => {
							await $updateRole(record.id, values);
							message.success("更新成功");
							actionRef.current?.reload();
							return true;
						}}
						modalProps={COMMON_MODAL_PROPS}
					/>
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
		};

		return [...baseColumns, optionCol];
	}, [baseColumns, updateFormCols]);

	return (
		<BaseProTable<RoleRow, Record<string, any>>
			actionRef={actionRef}
			toolBarRender={() => [
				<BetaSchemaForm<RoleFormParams>
					key="create"
					layoutType="ModalForm"
					title="新增角色"
					trigger={<Button type="primary">新建</Button>}
					columns={createFormCols}
					onFinish={async (values) => {
						await $createRole(values as RoleFormParams);
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
	);
}
