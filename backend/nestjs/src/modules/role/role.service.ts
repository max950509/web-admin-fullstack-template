import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma, Permission } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';

const rolePermissionInclude = {
  rolePermissions: { include: { permission: true } },
} as const;

type RoleWithPermissionLinks = Prisma.RoleGetPayload<{
  include: typeof rolePermissionInclude;
}>;

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(
    createRoleDto: CreateRoleDto,
  ): Promise<Role & { permissions: Permission[] }> {
    const { name, permissionIds } = createRoleDto;

    const role = await this.prisma.role.create({
      data: {
        name,
        rolePermissions: permissionIds.length
          ? {
              // Create join-table rows to link this role to existing permissions.
              create: permissionIds.map((permissionId) => ({
                // Set RolePermission.permissionId via the relation field.
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      // Include linked permissions in the returned role record.
      include: rolePermissionInclude,
    });
    return this.mapPermissions(role);
  }

  async findRolesPage(query: QueryRoleDto): Promise<PageResult<Role>> {
    const { skip, take } = getPaginationArgs(query);
    const where: Prisma.RoleWhereInput = {};
    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    const total = await this.prisma.role.count({ where });
    const list = await this.prisma.role.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    return createPageResult(list, total, query);
  }

  async findRoleById(
    id: number,
  ): Promise<Role & { permissions: Permission[] }> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: rolePermissionInclude,
    });
    if (!role) {
      throw new NotFoundException(`Role with ID #${id} not found`);
    }
    return this.mapPermissions(role);
  }

  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<Role & { permissions: Permission[] }> {
    const { name, permissionIds } = updateRoleDto;
    const data: Prisma.RoleUpdateInput = {};

    if (name) {
      data.name = name;
    }

    if (permissionIds) {
      data.rolePermissions = {
        // Reset join-table rows to match the incoming permission set.
        deleteMany: {},
        ...(permissionIds.length
          ? {
              create: permissionIds.map((permissionId) => ({
                // Connect each permission id to the role.
                permission: { connect: { id: permissionId } },
              })),
            }
          : {}),
      };
    }

    try {
      const role = await this.prisma.role.update({
        where: { id },
        data,
        include: rolePermissionInclude,
      });
      return this.mapPermissions(role);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Role with ID #${id} not found`);
      }
      throw error;
    }
  }

  async removeRole(id: number): Promise<void> {
    await this.findRoleById(id);
    await this.prisma.role.delete({ where: { id } });
  }

  async findRolesOptions(): Promise<{ id: number; name: string }[]> {
    return await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  private mapPermissions(
    role: RoleWithPermissionLinks,
  ): Role & { permissions: Permission[] } {
    const { rolePermissions, ...rest } = role;
    return {
      ...rest,
      permissions: rolePermissions.map((item) => item.permission),
    };
  }
}
