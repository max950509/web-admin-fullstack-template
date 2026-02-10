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
	Dropdown,
	Modal,
	message,
	Popconfirm,
	Radio,
	Space,
	Tag,
	Upload,
} from "antd";
import { type Key, type MutableRefObject, useRef, useState } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import {
	$batchDeleteAccounts,
	$createAccount,
	$deleteAccount,
	$downloadAccountTemplate,
	$getAccounts,
	$importAccounts,
	$updateAccount,
	type AccountFormParams,
	type AccountImportResult,
	type AccountQuery,
	type AccountRow,
	type ImportMode,
} from "@/services/account";
import { $getDepartmentOptions } from "@/services/department";
import { $createExportTask } from "@/services/export-task";
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

const buildFileStamp = () => {
	const now = new Date();
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
};

const downloadBlob = (blob: Blob, filename: string) => {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
};

const handleImportErrors = (result: AccountImportResult) => {
	if (!result.failCount) {
		return;
	}
	Modal.info({
		title: "导入失败明细",
		content: (
			<div style={{ maxHeight: 300, overflow: "auto" }}>
				{result.errors.slice(0, 10).map((item) => (
					<div key={`${item.row}-${item.message}`}>
						第 {item.row} 行：{item.message}
					</div>
				))}
				{result.errors.length > 10 ? <div>仅展示前 10 条失败记录</div> : null}
			</div>
		),
	});
};

export default function Account() {
	const actionRef = useRef<ActionType | null>(null);
	const lastQueryRef = useRef<AccountQuery>({});
	const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
	const [importOpen, setImportOpen] = useState(false);
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importMode, setImportMode] = useState<ImportMode>("insert");
	const [importing, setImporting] = useState(false);

	const tableColumns = [...BASE_COLS, buildOptionColumn(actionRef)];

	const requestAccounts = async (
		params: AccountQuery & { current?: number; pageSize?: number },
	) => {
		const { current, pageSize, ...rest } = params;
		lastQueryRef.current = rest;
		const { data } = await $getAccounts({
			...rest,
			page: current,
			pageSize,
		});
		return {
			data: data.list,
			total: data.total,
			success: true,
		};
	};

	const handleExport = async (format: "csv" | "xlsx") => {
		try {
			await $createExportTask({
				type: "account",
				format,
				params: lastQueryRef.current as Record<string, unknown>,
			});
			message.success("导出任务已创建，请到导出任务查看");
		} catch {
			message.error("创建导出任务失败");
		}
	};

	const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
		try {
			const { data } = await $downloadAccountTemplate(format);
			downloadBlob(data, `accounts-template-${buildFileStamp()}.${format}`);
		} catch {
			message.error("模板下载失败");
		}
	};

	const handleBatchDelete = () => {
		if (!selectedRowKeys.length) {
			return;
		}
		Modal.confirm({
			title: "确认删除选中的账号吗？",
			onOk: async () => {
				await $batchDeleteAccounts(selectedRowKeys as number[]);
				message.success("删除成功");
				setSelectedRowKeys([]);
				actionRef.current?.reload();
			},
		});
	};

	const handleImport = async () => {
		if (!importFile) {
			message.warning("请先选择文件");
			return;
		}
		setImporting(true);
		try {
			const { data } = await $importAccounts(importFile, importMode);
			message.success(
				`导入完成：成功 ${data.successCount} 条，失败 ${data.failCount} 条`,
			);
			handleImportErrors(data);
			setImportOpen(false);
			setImportFile(null);
			actionRef.current?.reload();
		} finally {
			setImporting(false);
		}
	};

	return (
		<>
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
					<Button key="import" onClick={() => setImportOpen(true)}>
						导入
					</Button>,
					<Dropdown
						key="export"
						menu={{
							items: [
								{ key: "csv", label: "导出 CSV" },
								{ key: "xlsx", label: "导出 Excel" },
							],
							onClick: ({ key }) => handleExport(key as "csv" | "xlsx"),
						}}
					>
						<Button>导出</Button>
					</Dropdown>,
					<Dropdown
						key="template"
						menu={{
							items: [
								{ key: "csv", label: "下载 CSV 模板" },
								{ key: "xlsx", label: "下载 Excel 模板" },
							],
							onClick: ({ key }) =>
								handleDownloadTemplate(key as "csv" | "xlsx"),
						}}
					>
						<Button>模板下载</Button>
					</Dropdown>,
					<Button
						key="batch-delete"
						danger
						disabled={!selectedRowKeys.length}
						onClick={handleBatchDelete}
					>
						批量删除
					</Button>,
				]}
				request={requestAccounts}
				columns={tableColumns}
				scroll={{ x: "100%" }}
				rowSelection={{
					selectedRowKeys,
					onChange: (keys) => setSelectedRowKeys(keys),
				}}
			/>
			<Modal
				title="导入账号"
				open={importOpen}
				onCancel={() => {
					setImportOpen(false);
					setImportFile(null);
				}}
				onOk={handleImport}
				okButtonProps={{ loading: importing, disabled: !importFile }}
				{...COMMON_MODAL_PROPS}
			>
				<Space direction="vertical" style={{ width: "100%" }}>
					<Upload
						accept=".csv,.xlsx"
						maxCount={1}
						beforeUpload={(file) => {
							setImportFile(file);
							return false;
						}}
						onRemove={() => {
							setImportFile(null);
						}}
					>
						<Button>选择文件</Button>
					</Upload>
					<div>{importFile ? `已选择：${importFile.name}` : "未选择文件"}</div>
					<Radio.Group
						value={importMode}
						onChange={(event) =>
							setImportMode(event.target.value as ImportMode)
						}
					>
						<Radio value="insert">仅新增</Radio>
						<Radio value="upsert">存在则更新</Radio>
					</Radio.Group>
					<div>支持 CSV / Excel（.xlsx）</div>
				</Space>
			</Modal>
		</>
	);
}
