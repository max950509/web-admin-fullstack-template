export const EXPORT_TASK_QUEUE = 'export-task';

export type ExportTaskType = 'account';
export type ExportTaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type ExportTaskFormat = 'csv' | 'xlsx';
