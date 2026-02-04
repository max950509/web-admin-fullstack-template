import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportTaskQueue } from './export-task.queue';
import { type ExportTaskFormat } from './export-task.constants';
import { CreateExportTaskDto } from './dto/create-export-task.dto';
import { QueryExportTaskDto } from './dto/query-export-task.dto';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';
import { AccountExportHandler } from './handlers/account-export.handler';

const resolveExportDir = () => {
  return path.join(process.cwd(), 'uploads', 'exports');
};

@Injectable()
export class ExportTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: ExportTaskQueue,
    private readonly accountExportHandler: AccountExportHandler,
  ) {}

  private getHandler(type: string) {
    if (type === 'account') {
      return this.accountExportHandler;
    }
    throw new BadRequestException('Unsupported export type');
  }

  async createTask(user: User, dto: CreateExportTaskDto) {
    const handler = this.getHandler(dto.type);
    const normalized = handler.normalizeParams(dto.params);
    const params = { ...normalized };
    const task = await this.prisma.exportTask.create({
      data: {
        type: dto.type,
        status: 'pending',
        format: dto.format,
        params,
        createdById: user.id,
      },
    });
    await this.queue.add(task.id);
    return task;
  }

  async listTasks(
    userId: number,
    query: QueryExportTaskDto,
  ): Promise<PageResult<Prisma.ExportTaskGetPayload<Record<string, never>>>> {
    const { skip, take } = getPaginationArgs(query);
    const where: Prisma.ExportTaskWhereInput = {
      createdById: userId,
    };
    if (query.status) {
      where.status = query.status;
    }
    const total = await this.prisma.exportTask.count({ where });
    const list = await this.prisma.exportTask.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    return createPageResult(list, total, query);
  }

  async getTaskForDownload(
    userId: number,
    taskId: number,
  ): Promise<{ filePath: string; fileName: string }> {
    const task = await this.prisma.exportTask.findFirst({
      where: { id: taskId, createdById: userId },
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    const { filePath, fileName } = task;
    if (task.status !== 'success' || !filePath || !fileName) {
      throw new BadRequestException('任务未完成');
    }
    return { filePath, fileName };
  }

  async runExport(taskId: number) {
    const locked = await this.prisma.exportTask.updateMany({
      where: { id: taskId, status: 'pending' },
      data: { status: 'running' },
    });
    if (!locked.count) {
      return;
    }

    const task = await this.prisma.exportTask.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      return;
    }

    try {
      const handler = this.getHandler(task.type);
      const { buffer } = await handler.export(
        task.format as ExportTaskFormat,
        task.params as Record<string, unknown> | undefined,
      );
      const exportDir = resolveExportDir();
      await fs.mkdir(exportDir, { recursive: true });
      const filename = `${task.type}-export-${task.id}.${task.format}`;
      const filePath = path.join(exportDir, filename);
      await fs.writeFile(filePath, buffer);

      await this.prisma.exportTask.update({
        where: { id: task.id },
        data: {
          status: 'success',
          fileName: filename,
          filePath,
          finishedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败';
      await this.prisma.exportTask.update({
        where: { id: task.id },
        data: {
          status: 'failed',
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
