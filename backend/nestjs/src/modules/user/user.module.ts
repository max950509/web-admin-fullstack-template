
import { Module } from '@nestjs/common';
import { UserService } from './user.service';

@Module({
  imports: [], // TypeOrmModule removed, PrismaService is globally available
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
