import { BadRequestException, Injectable } from '@nestjs/common';
import { Position, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePositionDto): Promise<Position> {
    return this.prisma.position.create({ data });
  }

  async findAll(query: QueryPositionDto): Promise<PageResult<Position>> {
    const { skip, take } = getPaginationArgs(query);
    const where: Prisma.PositionWhereInput = {};
    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    const total = await this.prisma.position.count({ where });
    const list = await this.prisma.position.findMany({
      where,
      include: { department: true },
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    return createPageResult(list, total, query);
  }

  async findOptions(departmentId?: number) {
    const where: Prisma.PositionWhereInput = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    const list = await this.prisma.position.findMany({
      where,
      include: { department: true },
      orderBy: { id: 'desc' },
    });
    return list.map((item) => ({
      id: item.id,
      name: item.name,
      departmentId: item.departmentId,
      departmentName: item.department?.name,
    }));
  }

  async findOne(id: number) {
    const position = await this.prisma.position.findUnique({
      where: { id },
    });
    if (!position) {
      throw new BadRequestException(`Position with ID #${id} not found`);
    }
    return position;
  }

  async update(id: number, data: UpdatePositionDto): Promise<Position> {
    await this.findOne(id);
    return this.prisma.position.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const userCount = await this.prisma.user.count({
      where: { positionId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException('岗位下仍有成员，请先调整归属');
    }
    await this.prisma.position.delete({ where: { id } });
  }
}
