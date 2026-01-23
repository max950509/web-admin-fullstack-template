import { Injectable } from '@nestjs/common';
import { Prisma, OperationLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OperationLogCreateInput): Promise<OperationLog> {
    return this.prisma.operationLog.create({ data });
  }

  async findAll(
    query: QueryOperationLogDto,
  ): Promise<PageResult<OperationLog>> {
    const { skip, take } = getPaginationArgs(query);
    const where: Prisma.OperationLogWhereInput = {};

    if (query.username) {
      where.username = { contains: query.username, mode: 'insensitive' };
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.resource) {
      where.resource = { contains: query.resource, mode: 'insensitive' };
    }

    if (query.method) {
      where.method = query.method.toUpperCase();
    }

    if (query.statusCode) {
      where.statusCode = query.statusCode;
    }

    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      };
    }

    const total = await this.prisma.operationLog.count({ where });
    const list = await this.prisma.operationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return createPageResult(list, total, query);
  }

  async findMine(
    userId: number,
    query: QueryOperationLogDto,
  ): Promise<PageResult<OperationLog>> {
    return this.findAll({ ...query, userId });
  }
}
