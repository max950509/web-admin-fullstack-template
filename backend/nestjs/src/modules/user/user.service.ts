import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  User,
  Role,
  Prisma,
  Permission,
  Department,
  Position,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';
import { QueryUserDto } from './dto/query-user.dto';

type SafeUser = Pick<
  User,
  'id' | 'username' | 'isOtpEnabled' | 'departmentId' | 'positionId'
> & {
  department?: Department | null;
  position?: Position | null;
};
type UserWithRoles = SafeUser & { roles: Role[] };
type RoleWithPermissions = Role & {
  permissions: Permission[];
};
type UserWithRolesAndPermissions = SafeUser & { roles: RoleWithPermissions[] };
type ImportMode = 'insert' | 'upsert';
type ImportResult = {
  successCount: number;
  failCount: number;
  errors: { row: number; message: string }[];
};
type ImportRow = {
  username?: string;
  password?: string;
  roleNames?: string[];
};
type ParsedRow = { rowIndex: number; data: ImportRow };
type ExportFormat = 'csv' | 'xlsx';
type ExportFile = { filename: string; contentType: string; buffer: Buffer };

type SheetCell = string | number | boolean | null | undefined;
type WorkSheet = Record<string, unknown>;
type WorkBook = { SheetNames: string[]; Sheets: Record<string, WorkSheet> };
type XlsxLike = {
  read: (data: Buffer, options: { type: 'buffer' }) => WorkBook;
  utils: {
    sheet_to_json: (
      sheet: WorkSheet,
      options: { header: 1; raw: boolean },
    ) => unknown;
    sheet_to_csv: (sheet: WorkSheet) => string;
    aoa_to_sheet: (rows: SheetCell[][]) => WorkSheet;
    book_new: () => WorkBook;
    book_append_sheet: (book: WorkBook, sheet: WorkSheet, name: string) => void;
  };
  write: (
    book: WorkBook,
    options: { type: 'buffer'; bookType: 'xlsx' },
  ) => Buffer;
};

const xlsx = XLSX as unknown as XlsxLike;

type UserWithRoleLinks = Prisma.UserGetPayload<{
  include: {
    userRoles: { include: { role: true } };
    department: true;
    position: true;
  };
}>;

const TEMPLATE_COLUMNS = [
  { key: 'username', label: '账号名' },
  { key: 'password', label: '密码' },
  { key: 'roleNames', label: '角色(逗号分隔)' },
] as const;

const IMPORT_HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  username: ['username', '账号', '账号名'],
  password: ['password', '密码'],
  roleNames: [
    'roleNames',
    'roles',
    '角色',
    '角色名',
    '角色名称',
    '角色(逗号分隔)',
  ],
};

const normalizeHeader = (value: string) =>
  value
    .replace(/\s+/g, '')
    .replace(/[()（）]/g, '')
    .toLowerCase();

const HEADER_ALIAS_MAP = (() => {
  const map = new Map<string, keyof ImportRow>();
  (Object.keys(IMPORT_HEADER_ALIASES) as (keyof ImportRow)[]).forEach((key) => {
    IMPORT_HEADER_ALIASES[key].forEach((alias) => {
      map.set(normalizeHeader(alias), key);
    });
  });
  return map;
})();

const splitRoleNames = (value: string) =>
  value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildSheetBuffer = (
  rows: (string | number | boolean | null | undefined)[][],
  format: ExportFormat,
) => {
  const sheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  if (format === 'csv') {
    const csv = xlsx.utils.sheet_to_csv(sheet);
    return Buffer.from(`\ufeff${csv}`, 'utf-8');
  }
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const toSheetRows = (value: unknown): (string | number | null)[][] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((row) => {
    if (!Array.isArray(row)) {
      return [];
    }
    return row.map((cell) => {
      if (cell === null || cell === undefined) {
        return null;
      }
      if (typeof cell === 'string' || typeof cell === 'number') {
        return cell;
      }
      return String(cell);
    });
  });
};

const parseImportRows = (buffer: Buffer): ParsedRow[] => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
  });
  const rows = toSheetRows(rawRows);
  if (!rows.length) {
    return [];
  }

  const headerRow = rows[0].map((cell) =>
    normalizeHeader(String(cell ?? '').trim()),
  );
  const keyMap = headerRow.map((header) => HEADER_ALIAS_MAP.get(header));

  const parsed: ParsedRow[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const data: ImportRow = {};
    keyMap.forEach((key, cellIndex) => {
      if (!key) {
        return;
      }
      const rawValue = row[cellIndex];
      if (rawValue === undefined || rawValue === null) {
        return;
      }
      const value = String(rawValue).trim();
      if (!value) {
        return;
      }
      if (key === 'roleNames') {
        data.roleNames = splitRoleNames(value);
        return;
      }
      data[key] = value;
    });
    if (Object.keys(data).length > 0) {
      parsed.push({ rowIndex: index + 1, data });
    }
  }

  return parsed;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private buildUserWhere(query: QueryUserDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};
    if (query.username) {
      where.username = { contains: query.username, mode: 'insensitive' };
    }
    if (query.roleIds?.length) {
      where.userRoles = { some: { roleId: { in: query.roleIds } } };
    }
    return where;
  }

  private mapRoles(user: UserWithRoleLinks): UserWithRoles {
    const { userRoles, ...rest } = user;
    return {
      ...rest,
      roles: userRoles.map((link) => link.role),
    };
  }

  private sanitizeUser<T extends Record<string, unknown>>(
    user: T,
  ): Omit<T, 'password' | 'otpSecret'> {
    const {
      password: _password,
      otpSecret: _otpSecret,
      ...safeUser
    } = user as T & {
      password?: string | null;
      otpSecret?: string | null;
    };
    void _password;
    void _otpSecret;
    return safeUser;
  }

  /**
   * Find a user by ID and return with roles and permissions
   * @param userId
   */
  async findOneByIdWithPermissions(
    userId: number,
  ): Promise<UserWithRolesAndPermissions | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      return null;
    }
    const { id, username, isOtpEnabled, departmentId, positionId, userRoles } =
      user;
    // Map roles with permissions for a user
    const roles = userRoles.map((link) => {
      const { rolePermissions, ...role } = link.role;
      return {
        ...role,
        permissions: rolePermissions.map((item) => item.permission),
      };
    });
    const hasAdminRole = roles.some((role) => role.name === 'admin');
    if (!hasAdminRole) {
      return { id, username, isOtpEnabled, departmentId, positionId, roles };
    }
    const allPermissions = await this.prisma.permission.findMany();
    return {
      id,
      username,
      isOtpEnabled,
      departmentId,
      positionId,
      roles: roles.map((role) =>
        role.name === 'admin' ? { ...role, permissions: allPermissions } : role,
      ),
    };
  }

  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findAll(query: QueryUserDto): Promise<PageResult<UserWithRoles>> {
    const { skip, take } = getPaginationArgs(query);
    const where = this.buildUserWhere(query);
    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      include: {
        userRoles: { include: { role: true } },
        department: true,
        position: true,
      },
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    const list = users.map((user) => this.sanitizeUser(this.mapRoles(user)));
    return createPageResult(list, total, query);
  }

  async findUsersForExport(query: QueryUserDto): Promise<UserWithRoles[]> {
    const where = this.buildUserWhere(query);
    const users = await this.prisma.user.findMany({
      where,
      include: {
        userRoles: { include: { role: true } },
        department: true,
        position: true,
      },
      orderBy: { id: 'desc' },
    });
    return users.map((user) => this.mapRoles(user));
  }

  async findUserByIdWithRole(id: number): Promise<UserWithRoles> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        department: true,
        position: true,
      },
    });
    if (!user) {
      throw new Error(`User with ID #${id} not found`);
    }
    return this.sanitizeUser(this.mapRoles(user));
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithRoles> {
    const { username, password, roleIds, departmentId, positionId } =
      createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          departmentId,
          positionId,
          userRoles: roleIds?.length
            ? {
                create: roleIds.map((roleId) => ({
                  role: { connect: { id: roleId } },
                })),
              }
            : undefined,
        },
        include: {
          userRoles: { include: { role: true } },
          department: true,
          position: true,
        },
      });
      return this.sanitizeUser(this.mapRoles(user));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(`用户名已存在`);
      }
      throw new BadRequestException('用户创建失败');
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithRoles> {
    const { roleIds, password, ...reset } = updateUserDto;
    const data: Prisma.UserUpdateInput = reset;

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (roleIds) {
      data.userRoles = {
        deleteMany: {},
        ...(roleIds.length
          ? {
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : {}),
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: { include: { role: true } },
        department: true,
        position: true,
      },
    });
    return this.sanitizeUser(this.mapRoles(user));
  }

  async remove(id: number): Promise<void> {
    await this.findOneById(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async batchDelete(ids: number[]): Promise<{ count: number }> {
    const { count } = await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
    return { count };
  }

  exportTemplate(format = 'csv'): ExportFile {
    const safeFormat: ExportFormat = format === 'xlsx' ? 'xlsx' : 'csv';
    const rows = [TEMPLATE_COLUMNS.map((column) => column.label), []];
    const buffer = buildSheetBuffer(rows, safeFormat);
    return {
      filename: `accounts-template.${safeFormat}`,
      contentType:
        safeFormat === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    };
  }

  async importUsers(
    file: { buffer?: Buffer },
    mode: string,
  ): Promise<ImportResult> {
    if (!file?.buffer) {
      throw new BadRequestException('请上传文件');
    }
    const safeMode: ImportMode = mode === 'upsert' ? 'upsert' : 'insert';
    const rows = parseImportRows(file.buffer);
    if (!rows.length) {
      return { successCount: 0, failCount: 0, errors: [] };
    }

    const roles = await this.prisma.role.findMany();
    const roleByName = new Map(
      roles.map((role) => [role.name.toLowerCase(), role.id]),
    );

    const usernames = rows
      .map((row) => row.data.username)
      .filter((username): username is string => Boolean(username));
    const existingUsers = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true, username: true },
    });
    const existingMap = new Map(
      existingUsers.map((user) => [user.username, user.id]),
    );

    const errors: { row: number; message: string }[] = [];
    let successCount = 0;

    for (const row of rows) {
      const { rowIndex, data } = row;
      const username = data.username?.trim();
      const password = data.password?.trim();
      if (!username) {
        errors.push({ row: rowIndex, message: '账号名不能为空' });
        continue;
      }
      if (!password) {
        errors.push({ row: rowIndex, message: '密码不能为空' });
        continue;
      }
      if (password.length < 6) {
        errors.push({ row: rowIndex, message: '密码长度不能少于6位' });
        continue;
      }
      const roleNames = data.roleNames ?? [];
      if (!roleNames.length) {
        errors.push({ row: rowIndex, message: '角色不能为空' });
        continue;
      }
      const roleIds = roleNames
        .map((name) => roleByName.get(name.toLowerCase()))
        .filter((id): id is number => Number.isFinite(id));
      if (roleIds.length !== roleNames.length) {
        const missing = roleNames.filter(
          (name) => !roleByName.has(name.toLowerCase()),
        );
        errors.push({
          row: rowIndex,
          message: `角色不存在: ${missing.join(',')}`,
        });
        continue;
      }

      const existingId = existingMap.get(username);
      if (existingId && safeMode === 'insert') {
        errors.push({ row: rowIndex, message: '账号已存在' });
        continue;
      }

      try {
        if (existingId) {
          await this.update(existingId, {
            username,
            password,
            roleIds,
          });
        } else {
          await this.create({
            username,
            password,
            roleIds,
          });
        }
        successCount += 1;
      } catch {
        errors.push({ row: rowIndex, message: '导入失败' });
      }
    }

    return {
      successCount,
      failCount: errors.length,
      errors,
    };
  }
}
