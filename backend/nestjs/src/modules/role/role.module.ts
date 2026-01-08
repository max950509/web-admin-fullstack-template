
import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [], // TypeOrmModule removed, PrismaService is globally available
  providers: [RoleService],
  controllers: [RoleController],
})
export class RoleModule {}
