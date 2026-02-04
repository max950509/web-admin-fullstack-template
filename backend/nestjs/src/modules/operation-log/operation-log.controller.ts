import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator';
import { ReqUser } from '../auth/auth.controller';
import type { User } from '@prisma/client';
import { ApiPageQuery } from '../../core/decorators/api-page-query.decorator';

@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @UseGuards(TokenAuthGuard, PermissionsGuard)
  @Get()
  @CheckPermissions('read', 'operation-log')
  @ApiPageQuery()
  findAll(@Query() query: QueryOperationLogDto) {
    return this.operationLogService.findAll(query);
  }

  @UseGuards(TokenAuthGuard)
  @Get('me')
  @ApiPageQuery()
  findMine(@ReqUser() user: User, @Query() query: QueryOperationLogDto) {
    return this.operationLogService.findMine(user.id, query);
  }
}
