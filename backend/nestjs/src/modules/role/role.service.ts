
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, permissionIds } = createRoleDto;

    // Prisma can connect relations by id during creation
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

  async findAll(): Promise<Role[]> {
    return this.prisma.role.findMany({ include: { permissions: true } });
  }

  async findOne(id: number): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID #${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { name, permissionIds } = updateRoleDto;
    const data: Prisma.RoleUpdateInput = {};

    if (name) {
      data.name = name;
    }

    // The 'set' operation will replace all existing permissions with the new set.
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Role with ID #${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Ensures the role exists before trying to delete
    await this.prisma.role.delete({ where: { id } });
  }
}
