import type { PageQuery, PageResponse } from "@/types";
import request from "@/utils/request";

export type ExportTaskStatus = "pending" | "running" | "success" | "failed";
export type ExportTaskFormat = "csv" | "xlsx";
export type ExportTaskType = "account";

export interface ExportTaskItem {
	id: number;
	type: ExportTaskType;
	status: ExportTaskStatus;
	format: ExportTaskFormat;
	fileName?: string | null;
	filePath?: string | null;
	errorMessage?: string | null;
	createdAt: string;
	updatedAt: string;
	finishedAt?: string | null;
}

export interface ExportTaskQuery extends PageQuery {
	status?: ExportTaskStatus;
}

export const $createExportTask = async (params: {
	type: ExportTaskType;
	format: ExportTaskFormat;
	params?: Record<string, unknown>;
}) => request.post<ExportTaskItem>("/export-tasks", params);

export const $getExportTasks = async (params?: ExportTaskQuery) =>
	request.get<PageResponse<ExportTaskItem>>("/export-tasks", { params });

export const $downloadExportTask = async (id: number) =>
	request.get<Blob>(`/export-tasks/${id}/download`, {
		responseType: "blob",
	});
