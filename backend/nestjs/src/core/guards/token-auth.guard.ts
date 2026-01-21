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
  scope: TokenScope; // Controls which endpoints the token is allowed to access.
  ver: number; // Per-user session version to revoke all tokens at once.
  issuedAt: number; // Epoch ms for token issue time (audit/debug).
};

/**
 * token 是否有效
 * @param value
 */
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
    // Cache key for a specific issued token.
    return `auth:token:${token}`;
  }

  private getUserVersionKey(userId: number): string {
    // Cache key for the user's session version.
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
    // Validate session version to ensure the user has not been logged out.
    if (typeof currentVer !== 'number' || currentVer !== stored.ver) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Only load the base user; permissions are checked in a separate guard.
    const user = await this.userService.findOneById(stored.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    (request as { user?: unknown }).user = user;
    return true;
  }
}
