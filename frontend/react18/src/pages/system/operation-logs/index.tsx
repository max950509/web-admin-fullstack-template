import type {
	ActionType,
	ProColumns,
	ProDescriptionsItemProps,
} from "@ant-design/pro-components";
import { Tag } from "antd";
import { useRef } from "react";
import BaseProTable from "@/components/BaseProTable.tsx";
import DescModal from "@/components/DescModal.tsx";
import {
	$getOperationLogs,
	type OperationLogItem,
} from "@/services/operation-log";
import { patchSchema } from "@/utils/common.ts";

const METHOD_ENUM = {
	GET: { text: "GET" },
	POST: { text: "POST" },
	PUT: { text: "PUT" },
	PATCH: { text: "PATCH" },
	DELETE: { text: "DELETE" },
} as const;

const METHOD_COLORS: Record<string, string> = {
	GET: "blue",
	POST: "green",
	PUT: "orange",
	PATCH: "orange",
	DELETE: "red",
};

type OperationLogRow = OperationLogItem;

type OperationLogQuery = {
	username?: string;
	action?: string;
	resource?: string;
	method?: string;
	statusCode?: number;
	from?: string;
	to?: string;
};

const renderMethodTag = (method: string) => (
	<Tag color={METHOD_COLORS[method] || "default"}>{method}</Tag>
);

const renderStatusTag = (statusCode: number) => {
	const color =
		statusCode >= 500 ? "red" : statusCode >= 400 ? "volcano" : "green";
	return <Tag color={color}>{statusCode}</Tag>;
};

const BASE_COLUMNS: ProColumns<OperationLogRow>[] = [
	{
		title: "ID",
		dataIndex: "id",
		hideInSearch: true,
		hideInForm: true,
		render: (text, record) => (
			<DescModal<OperationLogRow>
				trigger={<a>{text}</a>}
				title="操作日志详情"
				data={record}
				columns={DESC_COLUMNS}
			/>
		),
	},
	{
		title: "用户",
		dataIndex: "username",
	},
	{
		title: "动作",
		dataIndex: "action",
	},
	{
		title: "资源",
		dataIndex: "resource",
	},
	{
		title: "方法",
		dataIndex: "method",
		valueType: "select",
		valueEnum: METHOD_ENUM,
		render: (_, record) => renderMethodTag(record.method),
	},
	{
		title: "路径",
		dataIndex: "path",
		ellipsis: true,
	},
	{
		title: "状态码",
		dataIndex: "statusCode",
		valueType: "digit",
		render: (_, record) => renderStatusTag(record.statusCode),
	},
	{
		title: "时间",
		dataIndex: "createdAt",
		valueType: "dateTime",
		hideInSearch: true,
	},
	{
		title: "时间范围",
		dataIndex: "createdAtRange",
		valueType: "dateTimeRange",
		hideInTable: true,
		search: {
			transform: (value) => ({ from: value[0], to: value[1] }),
		},
	},
];

const DESC_COLUMNS = [
	...(
		patchSchema(BASE_COLUMNS as any, {
			id: { render: (text) => text },
		}) as ProDescriptionsItemProps<OperationLogRow>[]
	).filter((column) => column.dataIndex !== "createdAtRange"),
	{
		title: "Payload",
		dataIndex: "payload",
		render: (_, record) => (
			<pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
				{record.payload ? JSON.stringify(record.payload, null, 2) : "-"}
			</pre>
		),
	},
] as ProDescriptionsItemProps<OperationLogRow>[];

export default function OperationLogsPage() {
	const actionRef = useRef<ActionType | null>(null);

	return (
		<BaseProTable<OperationLogRow, OperationLogQuery>
			actionRef={actionRef}
			requestApi={$getOperationLogs}
			columns={BASE_COLUMNS}
			scroll={{ x: "100%" }}
		/>
	);
}
