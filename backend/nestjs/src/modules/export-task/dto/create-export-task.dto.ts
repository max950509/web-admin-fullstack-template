import { IsIn, IsObject, IsOptional } from 'class-validator';
import type {
  ExportTaskFormat,
  ExportTaskType,
} from '../export-task.constants';

export class CreateExportTaskDto {
  @IsIn(['account'] as ExportTaskType[])
  type: ExportTaskType;

  @IsIn(['csv', 'xlsx'] as ExportTaskFormat[])
  format: ExportTaskFormat;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
