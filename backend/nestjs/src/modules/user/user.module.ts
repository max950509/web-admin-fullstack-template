import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)], // TypeOrmModule removed, PrismaService is globally available
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
