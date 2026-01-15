import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, permissionIds } = createRoleDto;

    return this.prisma.role.create({
      data: {
        name,
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
      include: { permissions: true },
    });
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
      include: { permissions: true },
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    return createPageResult(list, total, query);
  }

  async findRoleById(id: number): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID #${id} not found`);
    }
    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { name, permissionIds } = updateRoleDto;
    const data: Prisma.RoleUpdateInput = {};

    if (name) {
      data.name = name;
    }

    if (permissionIds) {
      data.permissions = {
        set: permissionIds.map((id) => ({ id })),
      };
    }

    try {
      return await this.prisma.role.update({
        where: { id },
        data,
        include: { permissions: true },
      });
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
}
