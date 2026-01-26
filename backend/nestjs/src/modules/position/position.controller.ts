import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';

@Controller('positions')
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  @CheckPermissions('create', 'position')
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionService.create(createPositionDto);
  }

  @Get()
  @CheckPermissions('read', 'position')
  findAll(@Query() queryPositionDto: QueryPositionDto) {
    return this.positionService.findAll(queryPositionDto);
  }

  @Get('options')
  findOptions(@Query('departmentId') departmentId?: string) {
    const parsed = departmentId ? Number(departmentId) : undefined;
    const resolved = Number.isFinite(parsed) ? parsed : undefined;
    return this.positionService.findOptions(resolved);
  }

  @Get(':id')
  @CheckPermissions('read', 'position')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.positionService.findOne(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'position')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionService.update(id, updatePositionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'position')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.positionService.remove(id);
  }
}
