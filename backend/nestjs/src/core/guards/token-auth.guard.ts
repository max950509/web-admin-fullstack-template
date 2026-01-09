import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Request } from 'express';
import { UserService } from '../../modules/user/user.service';

type TokenScope = 'access' | '2fa';

type StoredToken = {
  userId: number;
  username: string;
  scope: TokenScope;
  ver: number; // Per-user session version to invalidate all tokens at once.
  issuedAt: number;
};

function isStoredToken(value: unknown): value is StoredToken {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === 'number' &&
    typeof record.username === 'string' &&
    (record.scope === 'access' || record.scope === '2fa') &&
    typeof record.ver === 'number' &&
    typeof record.issuedAt === 'number'
  );
}

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {}

  private getTokenKey(token: string): string {
    return `auth:token:${token}`;
  }

  private getUserVersionKey(userId: number): string {
    return `auth:user:${userId}:ver`;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headerValue = request.headers.authorization;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authHeader = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const stored = await this.cacheManager.get<unknown>(
      this.getTokenKey(authHeader),
    );
    if (!isStoredToken(stored)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const currentVer = await this.cacheManager.get<unknown>(
      this.getUserVersionKey(stored.userId),
    );
    if (typeof currentVer !== 'number' || currentVer !== stored.ver) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user =
      stored.scope === '2fa'
        ? await this.userService.findOneById(stored.userId)
        : await this.userService.findOneByUsername(stored.username);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    (request as { user?: unknown }).user = user;
    return true;
  }
}
