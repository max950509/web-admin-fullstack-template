import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportTaskService } from './export-task.service';
import { CreateExportTaskDto } from './dto/create-export-task.dto';
import { QueryExportTaskDto } from './dto/query-export-task.dto';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator';
import { ReqUser } from '../auth/auth.controller';
import type { User } from '@prisma/client';

@Controller('export-tasks')
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class ExportTaskController {
  constructor(private readonly exportTaskService: ExportTaskService) {}

  @Post()
  @CheckPermissions('create', 'export-task')
  create(@ReqUser() user: User, @Body() dto: CreateExportTaskDto) {
    return this.exportTaskService.createTask(user, dto);
  }

  @Get()
  @CheckPermissions('read', 'export-task')
  list(@ReqUser() user: User, @Query() query: QueryExportTaskDto) {
    return this.exportTaskService.listTasks(user.id, query);
  }

  @Get(':id/download')
  @CheckPermissions('read', 'export-task')
  async download(
    @ReqUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const task = await this.exportTaskService.getTaskForDownload(user.id, id);
    res.download(task.filePath, task.fileName);
  }
}
