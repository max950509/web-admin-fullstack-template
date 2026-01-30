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

const ACCESS_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_RENEW_INTERVAL_MS = 15 * 60 * 1000;

type StoredToken = {
  userId: number;
  username: string;
  scope: TokenScope; // Controls which endpoints the token is allowed to access.
  ver: number; // Per-user session version to revoke all tokens at once.
  issuedAt: number; // Epoch ms for token issue time (audit/debug).
  lastRenewAt?: number; // Epoch ms of last sliding renewal.
  sessionExpiresAt?: number; // Absolute max session expiry for access tokens.
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
    typeof record.issuedAt === 'number' &&
    (record.lastRenewAt === undefined ||
      typeof record.lastRenewAt === 'number') &&
    (record.sessionExpiresAt === undefined ||
      typeof record.sessionExpiresAt === 'number')
  );
}

@Injectable()
export class TokenAuthGuard implements CanActivate {
  private readonly accessTokenTtlMs: number;
  private readonly maxSessionLifetimeMs: number;
  private readonly renewIntervalMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly userService: UserService,
  ) {
    this.accessTokenTtlMs = ACCESS_TOKEN_TTL_MS;
    this.maxSessionLifetimeMs = Math.max(
      ACCESS_TOKEN_TTL_MS,
      MAX_SESSION_LIFETIME_MS,
    );
    this.renewIntervalMs = TOKEN_RENEW_INTERVAL_MS;
  }

  private getTokenKey(token: string): string {
    // Cache key for a specific issued token.
    return `auth:token:${token}`;
  }

  private getUserVersionKey(userId: number): string {
    // Cache key for the user's session version.
    return `auth:user:${userId}:ver`;
  }

  /**
   * 判断是否需要token延期
   * 只在 now - lastRenewAt >= renewInterval 时续期（比如 10–15 分钟一次），并加 maxSessionLifetime 兜底
   * 活跃用户不会被踢，写压力从“每请求一次”降到“每会话每 N 分钟一次
   * @param token
   * @param stored
   * @private
   */
  private async maybeRenewToken(token: string, stored: StoredToken) {
    if (stored.scope !== 'access') {
      return;
    }
    if (this.renewIntervalMs <= 0 || this.maxSessionLifetimeMs <= 0) {
      return;
    }
    const now = Date.now();
    const sessionExpiresAt =
      typeof stored.sessionExpiresAt === 'number'
        ? stored.sessionExpiresAt
        : stored.issuedAt + this.maxSessionLifetimeMs;

    // Enforce absolute max session lifetime regardless of sliding renewals.
    if (now >= sessionExpiresAt) {
      await this.cacheManager.del(this.getTokenKey(token));
      throw new UnauthorizedException('Session expired');
    }

    const lastRenewAt =
      typeof stored.lastRenewAt === 'number'
        ? stored.lastRenewAt
        : stored.issuedAt;
    if (now - lastRenewAt < this.renewIntervalMs) {
      return;
    }

    // Sliding renewal, throttled to reduce Redis write pressure.
    const remainingMs = sessionExpiresAt - now;
    const nextTtlMs = Math.min(this.accessTokenTtlMs, remainingMs);
    await this.cacheManager.set(
      this.getTokenKey(token),
      { ...stored, lastRenewAt: now, sessionExpiresAt },
      nextTtlMs,
    );
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

    await this.maybeRenewToken(authHeader, stored);

    // Only load the base user; permissions are checked in a separate guard.
    const user = await this.userService.findOneById(stored.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    (request as { user?: unknown }).user = user;
    return true;
  }
}
