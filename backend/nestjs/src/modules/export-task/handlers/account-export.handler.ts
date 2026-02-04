import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { UserService } from '../../user/user.service';
import { QueryUserDto } from '../../user/dto/query-user.dto';
import type { ExportTaskFormat } from '../export-task.constants';

type ExportFile = {
  contentType: string;
  buffer: Buffer;
};

type ExportRow = (string | number)[];

const EXPORT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: '账号名' },
  { key: 'roles', label: '角色' },
] as const;

const buildSheetBuffer = (rows: ExportRow[], format: ExportTaskFormat) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return Buffer.from(`\ufeff${csv}`, 'utf-8');
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

@Injectable()
export class AccountExportHandler {
  constructor(private readonly userService: UserService) {}

  normalizeParams(params?: Record<string, unknown>): QueryUserDto {
    const query = new QueryUserDto();
    if (!params) {
      return query;
    }
    if (typeof params.username === 'string' && params.username.trim()) {
      query.username = params.username.trim();
    }
    if (Array.isArray(params.roleIds)) {
      const roleIds = params.roleIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
      if (roleIds.length) {
        query.roleIds = roleIds;
      }
    }
    return query;
  }

  async export(
    format: ExportTaskFormat,
    params?: Record<string, unknown>,
  ): Promise<ExportFile> {
    const query = this.normalizeParams(params);
    const users = await this.userService.findUsersForExport(query);
    const rows: ExportRow[] = [
      EXPORT_COLUMNS.map((column) => column.label),
      ...users.map((user) => [
        user.id,
        user.username,
        user.roles.map((role) => role.name).join(','),
      ]),
    ];
    const buffer = buildSheetBuffer(rows, format);
    return {
      contentType:
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    };
  }
}
