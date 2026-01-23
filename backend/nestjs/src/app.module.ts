import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { PrismaModule } from './prisma/prisma.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperationLogInterceptor } from './core/interceptors/operation-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule, // Add the global PrismaModule
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    OperationLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
})
export class AppModule {}
