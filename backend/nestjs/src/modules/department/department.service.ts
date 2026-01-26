import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Department, Prisma } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { QueryDepartmentDto } from './dto/query-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({ data });
  }

  async findAll(query: QueryDepartmentDto): Promise<Department[]> {
    const where: Prisma.DepartmentWhereInput = {};
    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    return this.prisma.department.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async findOptions(): Promise<
    { id: number; name: string; parentId: number | null }[]
  > {
    return this.prisma.department.findMany({
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new BadRequestException(`Department with ID #${id} not found`);
    }
    return department;
  }

  async update(id: number, data: UpdateDepartmentDto): Promise<Department> {
    if (data.parentId && data.parentId === id) {
      throw new BadRequestException('Parent department cannot be itself');
    }
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const childCount = await this.prisma.department.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException('部门下仍有子部门，请先调整层级');
    }
    const positionCount = await this.prisma.position.count({
      where: { departmentId: id },
    });
    if (positionCount > 0) {
      throw new BadRequestException('部门下仍有岗位，请先移除岗位');
    }
    const userCount = await this.prisma.user.count({
      where: { departmentId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException('部门下仍有成员，请先调整归属');
    }
    await this.prisma.department.delete({ where: { id } });
  }
}
