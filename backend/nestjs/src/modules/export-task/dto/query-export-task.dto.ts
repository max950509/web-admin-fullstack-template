import { IsIn, IsOptional } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';
import type { ExportTaskStatus } from '../export-task.constants';

export class QueryExportTaskDto extends PageQueryDto {
  @IsOptional()
  @IsIn(['pending', 'running', 'success', 'failed'] as ExportTaskStatus[])
  status?: ExportTaskStatus;
}
