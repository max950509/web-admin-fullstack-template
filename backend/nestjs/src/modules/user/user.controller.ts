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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
    return this.userService.createAccount(createUserDto);
  }

  @Get()
  @CheckPermissions('read', 'account')
  findAll() {
    return this.userService.findAllAccounts();
  }

  @Get(':id')
  @CheckPermissions('read', 'account')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findAccountById(id);
  }

  @Patch(':id')
  @CheckPermissions('update', 'account')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateAccount(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPermissions('delete', 'account')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeAccount(id);
  }
}
