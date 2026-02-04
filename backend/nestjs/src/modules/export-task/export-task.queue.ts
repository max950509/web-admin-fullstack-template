import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, type ConnectionOptions } from 'bullmq';
import { EXPORT_TASK_QUEUE } from './export-task.constants';

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildRedisConnection = (
  configService: ConfigService,
): ConnectionOptions => {
  const url = configService.get<string>('REDIS_URL');
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseNumber(parsed.port, 6379),
        password: parsed.password
          ? decodeURIComponent(parsed.password)
          : undefined,
        db: parseNumber(parsed.pathname.replace('/', ''), 0),
      };
    } catch {
      // Fall through to host/port.
    }
  }

  return {
    host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
    port: parseNumber(configService.get<string>('REDIS_PORT'), 6379),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: parseNumber(configService.get<string>('REDIS_DB'), 0),
  };
};

@Injectable()
export class ExportTaskQueue implements OnModuleInit, OnModuleDestroy {
  private queue?: Queue;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.queue = new Queue(EXPORT_TASK_QUEUE, {
      connection: buildRedisConnection(this.configService),
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
  }

  async add(taskId: number) {
    if (!this.queue) {
      throw new Error('Export task queue is not ready');
    }
    await this.queue.add(
      'export',
      { taskId },
      {
        jobId: `export-task-${taskId}`,
        removeOnComplete: true,
        attempts: 1,
      },
    );
  }
}
