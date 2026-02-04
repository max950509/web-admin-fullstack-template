import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExportTaskController } from './export-task.controller';
import { ExportTaskService } from './export-task.service';
import { ExportTaskQueue } from './export-task.queue';
import { ExportTaskWorker } from './export-task.worker';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { AccountExportHandler } from './handlers/account-export.handler';

@Module({
  imports: [ConfigModule, AuthModule, UserModule],
  controllers: [ExportTaskController],
  providers: [
    ExportTaskService,
    ExportTaskQueue,
    ExportTaskWorker,
    AccountExportHandler,
  ],
})
export class ExportTaskModule {}
