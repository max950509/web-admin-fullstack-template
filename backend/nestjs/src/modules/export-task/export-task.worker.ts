import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, type Job } from 'bullmq';
import { EXPORT_TASK_QUEUE } from './export-task.constants';
import { buildRedisConnection } from './export-task.queue';
import { ExportTaskService } from './export-task.service';

type ExportJobData = { taskId: number };

@Injectable()
export class ExportTaskWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly exportTaskService: ExportTaskService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<ExportJobData>(
      EXPORT_TASK_QUEUE,
      async (job: Job<ExportJobData>) => {
        await this.exportTaskService.runExport(job.data.taskId);
      },
      {
        connection: buildRedisConnection(this.configService),
      },
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
