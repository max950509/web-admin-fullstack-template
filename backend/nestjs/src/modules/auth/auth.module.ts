import { Module, Logger, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const url = configService.get<string>('REDIS_URL');
        const host = configService.get<string>('REDIS_HOST', '127.0.0.1');
        const port = configService.get<string>('REDIS_PORT', '6379');
        const password = configService.get<string>('REDIS_PASSWORD');
        const db = configService.get<string>('REDIS_DB', '0');
        const auth = password ? `:${encodeURIComponent(password)}@` : '';
        const dbSegment = db ? `/${db}` : '';
        const redisUrl = url ?? `redis://${auth}${host}:${port}${dbSegment}`;
        if (url) {
          try {
            const parsed = new URL(url);
            const safePassword = parsed.password ? '***' : '';
            const safeUser = parsed.username ? `${parsed.username}` : '';
            const authSegment =
              safeUser || safePassword
                ? `${safeUser}${safePassword ? `:${safePassword}` : ''}@`
                : '';
            const safeUrl = `${parsed.protocol}//${authSegment}${parsed.host}${parsed.pathname}`;
            logger.log(`Redis cache store: ${safeUrl}`);
          } catch {
            logger.log(
              'Redis cache store: using REDIS_URL (invalid URL format)',
            );
          }
        } else {
          logger.log(`Redis cache store: redis://${host}:${port}/${db}`);
        }
        return {
          stores: [new Keyv({ store: new KeyvRedis(redisUrl) })],
        };
      },
    }),
  ],
  providers: [AuthService, LocalStrategy, TokenAuthGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [TokenAuthGuard, PermissionsGuard, CacheModule, UserModule],
})
export class AuthModule {}
