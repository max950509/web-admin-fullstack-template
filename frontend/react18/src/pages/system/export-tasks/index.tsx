import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { message, Space, Tag } from "antd";
import { type MutableRefObject, useRef } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import {
	$downloadExportTask,
	$getExportTasks,
	type ExportTaskItem,
	type ExportTaskQuery,
	type ExportTaskStatus,
} from "@/services/export-task";

const STATUS_LABELS: Record<ExportTaskStatus, string> = {
	pending: "待处理",
	running: "处理中",
	success: "已完成",
	failed: "失败",
};

const STATUS_COLORS: Record<ExportTaskStatus, string> = {
	pending: "default",
	running: "processing",
	success: "success",
	failed: "error",
};

const STATUS_ENUM = {
	pending: { text: STATUS_LABELS.pending },
	running: { text: STATUS_LABELS.running },
	success: { text: STATUS_LABELS.success },
	failed: { text: STATUS_LABELS.failed },
} as const;

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

const buildOptionColumn = (
	actionRef: MutableRefObject<ActionType | null>,
): ProColumns<ExportTaskItem> => ({
	title: "操作",
	valueType: "option",
	fixed: "right",
	width: 120,
	render: (_, record) => (
		<Space>
			{record.status === "success" ? (
				<a
					onClick={async () => {
						try {
							const { data } = await $downloadExportTask(record.id);
							downloadBlob(
								data,
								record.fileName ?? `export-${record.id}.${record.format}`,
							);
						} catch {
							message.error("下载失败");
						}
					}}
				>
					下载
				</a>
			) : null}
			{record.status === "failed" && record.errorMessage ? (
				<span style={{ color: "#ff4d4f" }}>{record.errorMessage}</span>
			) : null}
		</Space>
	),
});

const COLUMNS: ProColumns<ExportTaskItem>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
	},
	{
		title: "类型",
		dataIndex: "type",
		hideInSearch: true,
		render: () => "账号导出",
	},
	{
		title: "格式",
		dataIndex: "format",
		valueType: "select",
		valueEnum: { csv: { text: "CSV" }, xlsx: { text: "Excel" } },
		hideInSearch: true,
	},
	{
		title: "状态",
		dataIndex: "status",
		valueType: "select",
		valueEnum: STATUS_ENUM,
		render: (_, record) => (
			<Tag color={STATUS_COLORS[record.status]}>
				{STATUS_LABELS[record.status]}
			</Tag>
		),
	},
	{
		title: "文件名",
		dataIndex: "fileName",
		hideInSearch: true,
		render: (text) => text ?? "-",
	},
	{
		title: "创建时间",
		dataIndex: "createdAt",
		valueType: "dateTime",
		hideInSearch: true,
	},
	{
		title: "完成时间",
		dataIndex: "finishedAt",
		valueType: "dateTime",
		hideInSearch: true,
		render: (text) => text ?? "-",
	},
];

export default function ExportTasksPage() {
	const actionRef = useRef<ActionType | null>(null);
	const tableColumns = [...COLUMNS, buildOptionColumn(actionRef)];

	return (
		<BaseProTable<ExportTaskItem, ExportTaskQuery>
			actionRef={actionRef}
			requestApi={$getExportTasks}
			columns={tableColumns}
			scroll={{ x: "100%" }}
		/>
	);
}
