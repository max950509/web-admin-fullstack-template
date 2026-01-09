import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // TypeOrmModule removed, PrismaService is globally available
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
