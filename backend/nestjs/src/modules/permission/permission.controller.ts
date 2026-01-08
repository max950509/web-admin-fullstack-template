
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
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard'; // New guard
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator'; // New decorator

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Use new PermissionsGuard
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @CheckPermissions('create', 'permission') // Example: require 'create:permission'
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @CheckPermissions('read', 'permission') // Example: require 'read:permission'
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @CheckPermissions('read', 'permission') // Example: require 'read:permission'
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'permission') // Example: require 'update:permission'
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'permission') // Example: require 'delete:permission'
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.remove(id);
  }
}
