import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // TypeOrmModule removed, PrismaService is globally available
  providers: [RoleService],
  controllers: [RoleController],
})
export class RoleModule {}
