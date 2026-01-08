
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
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard'; // New guard
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator'; // New decorator

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Use new PermissionsGuard
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @CheckPermissions('create', 'role') // Example: require 'create:role'
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @CheckPermissions('read', 'role') // Example: require 'read:role'
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @CheckPermissions('read', 'role') // Example: require 'read:role'
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'role') // Example: require 'update:role'
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'role') // Example: require 'delete:role'
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }
}
