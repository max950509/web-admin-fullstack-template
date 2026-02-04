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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { CheckPermissions } from '../../core/decorators/check-permissions.decorator';

@Controller('users')
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CheckPermissions('create', 'account')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @CheckPermissions('read', 'account')
  findAll(@Query() queryUserDto: QueryUserDto) {
    return this.userService.findAll(queryUserDto);
  }

  @Get('template')
  @CheckPermissions('read', 'account')
  template(@Query('format') format = 'csv', @Res() res: Response) {
    const file = this.userService.exportTemplate(format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.filename)}"`,
    );
    res.send(file.buffer);
  }

  @Post('import')
  @CheckPermissions('create', 'account')
  @UseInterceptors(FileInterceptor('file'))
  import(
    @UploadedFile() file: { buffer?: Buffer },
    @Query('mode') mode = 'insert',
  ) {
    return this.userService.importUsers(file, mode);
  }

  @Post('batch-delete')
  @CheckPermissions('delete', 'account')
  batchDelete(@Body() dto: BatchDeleteDto) {
    return this.userService.batchDelete(dto.ids);
  }

  @Get(':id')
  @CheckPermissions('read', 'account')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserByIdWithRole(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'account')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'account')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
