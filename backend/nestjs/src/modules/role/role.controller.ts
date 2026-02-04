import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator';
import { QueryRoleDto } from './dto/query-role.dto';
import { ApiPageQuery } from '../../core/decorators/api-page-query.decorator';

@Controller('roles')
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @CheckPermissions('create', 'role')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @CheckPermissions('read', 'role')
  @ApiPageQuery()
  findAll(@Query() queryRoleDto: QueryRoleDto) {
    return this.roleService.findAll(queryRoleDto);
  }

  @Get('options')
  findOptions() {
    return this.roleService.findAllForOptions();
  }

  @Get(':id')
  @CheckPermissions('read', 'role')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findRoleById(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'role')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'role')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }
}
