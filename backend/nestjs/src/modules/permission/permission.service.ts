
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Permission, Prisma } from '@prisma/client';

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.PermissionCreateInput): Promise<Permission> {
    return this.prisma.permission.create({ data });
  }

  async findAll(): Promise<Permission[]> {
    return this.prisma.permission.findMany();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID #${id} not found`);
    }
    return permission;
  }

  async update(id: number, data: Prisma.PermissionUpdateInput): Promise<Permission> {
    try {
      return await this.prisma.permission.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Permission with ID #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    // findOne will throw NotFoundException if not found
    const permission = await this.findOne(id);
    await this.prisma.permission.delete({ where: { id: permission.id } });
  }
}
