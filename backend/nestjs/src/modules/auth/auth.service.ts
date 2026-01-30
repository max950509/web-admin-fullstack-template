import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UserService } from '../user/user.service';
import { User, Role, Permission } from '@prisma/client';
import * as svgCaptcha from 'svg-captcha';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';

type PermissionView = Pick<
  Permission,
  'name' | 'type' | 'action' | 'resource' | 'parentId' | 'sort'
>;
type RoleWithPermissions = Pick<Role, 'name'> & {
  permissions: PermissionView[];
};
export type UserWithRoles = Pick<User, 'id' | 'username' | 'isOtpEnabled'> & {
  roles: RoleWithPermissions[];
};

type TokenScope = 'access' | '2fa';

const ACCESS_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const TWO_FACTOR_TOKEN_TTL_MS = 5 * 60 * 1000;
const MAX_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

type StoredToken = {
  userId: number;
  username: string;
  scope: TokenScope;
  ver: number; // Per-user session version to invalidate all tokens at once.
  issuedAt: number;
  lastRenewAt?: number; // Throttle sliding renewals for access tokens.
  sessionExpiresAt?: number; // Absolute max session expiry for access tokens.
};

@Injectable()
export class AuthService {
  private readonly captchaTtlMs = 5 * 60 * 1000;
  private readonly accessTokenTtlMs: number;
  private readonly twoFactorTokenTtlMs: number;
  private readonly maxSessionLifetimeMs: number;

  constructor(
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.accessTokenTtlMs = ACCESS_TOKEN_TTL_MS;
    this.twoFactorTokenTtlMs = TWO_FACTOR_TOKEN_TTL_MS;
    this.maxSessionLifetimeMs = Math.max(
      ACCESS_TOKEN_TTL_MS,
      MAX_SESSION_LIFETIME_MS,
    );
  }

  private getTokenKey(token: string): string {
    return `auth:token:${token}`;
  }

  private getUserVersionKey(userId: number): string {
    return `auth:user:${userId}:ver`;
  }

  // The per-user version lets us invalidate all existing tokens by bumping it.
  private async getOrInitUserVersion(userId: number): Promise<number> {
    const key = this.getUserVersionKey(userId);
    const existing = await this.cacheManager.get<number>(key);
    if (typeof existing === 'number') {
      return existing;
    }

    const initial = 1;
    await this.cacheManager.set(key, initial);
    return initial;
  }

  private async issueToken(
    user: Pick<User, 'id' | 'username'>,
    scope: TokenScope,
    ttlMs: number,
  ): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const ver = await this.getOrInitUserVersion(user.id);
    const issuedAt = Date.now();
    const sessionExpiresAt =
      scope === 'access' ? issuedAt + this.maxSessionLifetimeMs : undefined;
    // Cap the initial TTL so the session cannot exceed the absolute max lifetime.
    const effectiveTtlMs =
      scope === 'access' && sessionExpiresAt
        ? Math.min(ttlMs, this.maxSessionLifetimeMs)
        : ttlMs;
    const record: StoredToken = {
      userId: user.id,
      username: user.username,
      scope,
      ver,
      issuedAt,
      lastRenewAt: issuedAt,
      sessionExpiresAt,
    };
    await this.cacheManager.set(
      this.getTokenKey(token),
      record,
      effectiveTtlMs,
    );
    return token;
  }

  /**
   * Validates a user based on username and password.
   * @param username The username to validate.
   * @param pass The password to validate.
   * @returns The user object if validation is successful, otherwise null.
   */
  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.userService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  /**
   * Generates a new CAPTCHA.
   * @returns An object containing the ID and the SVG data of the CAPTCHA.
   */
  private getCaptchaKey(id: string): string {
    return `captcha:${id}`;
  }

  async generateCaptcha(): Promise<{ id: string; svg: string }> {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
    });
    const captchaId = randomUUID();
    await this.cacheManager.set(
      this.getCaptchaKey(captchaId),
      captcha.text.toLowerCase(),
      this.captchaTtlMs,
    );

    return { id: captchaId, svg: captcha.data };
  }

  /**
   * Validates a given CAPTCHA.
   * @param id The ID of the CAPTCHA.
   * @param text The text to validate against.
   */
  async validateCaptcha(id: string, text: string): Promise<boolean> {
    const storedText = await this.cacheManager.get<string>(
      this.getCaptchaKey(id),
    );
    if (storedText === text.toLowerCase()) {
      await this.cacheManager.del(this.getCaptchaKey(id)); // CAPTCHA is single-use
      return true;
    }
    return false;
  }

  /**
   * Handles the main login flow.
   * @param user The authenticated user object.
   * @returns A response object indicating the next step (OTP required or full login success).
   */
  async login(user: User) {
    if (user.isOtpEnabled) {
      // Issue a temporary token that only grants access to the 2FA flow.
      const temporaryToken = await this.issueToken(
        { id: user.id, username: user.username },
        '2fa',
        this.twoFactorTokenTtlMs,
      );
      return {
        message: 'OTP required for 2FA',
        accessToken: temporaryToken, // This token is temporary
        isTemporary: true, // Flag to indicate that this is a temporary token
      };
    }

    // If OTP is not enabled, proceed with normal login.
    return this.issueAccessToken(user);
  }

  /**
   * Handles the second factor (OTP) authentication.
   * @param user The user object from the temporary token.
   * @param code The OTP code from the user.
   * @returns The final access token.
   */
  async loginWith2fa(user: User, code: string) {
    if (!user.otpSecret) {
      throw new UnauthorizedException('OTP is not configured for this user.');
    }
    const isValid = this.verifyOtp(code, user.otpSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }
    const found = await this.userService.findOneByUsername(user.username);
    if (!found) {
      throw new UnauthorizedException('User not found after 2FA validation');
    }
    return this.issueAccessToken(found);
  }

  async getProfile(id: number): Promise<UserWithRoles> {
    const found = await this.userService.findOneByIdWithPermissions(id);
    if (!found) {
      throw new UnauthorizedException('User not found');
    }
    return found;
  }

  /**
   * Generates a new OTP secret for a user.
   * @param userId The ID of the user.
   * @returns An object containing the OTP Auth URL and the QR code data URL.
   */
  async generateOtp(userId: number) {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      user.username,
      'web-admin-fullstack-template',
      secret,
    );

    await this.userService.update(userId, { otpSecret: secret });

    const qrCodeDataUrl = await toDataURL(otpAuthUrl);

    return {
      message: 'Scan this QR code with your authenticator app.',
      qrCodeDataUrl,
      secret,
    };
  }

  /**
   * Verifies an OTP code and enable OTP for the user.
   * @param userId The ID of the user.
   * @param code The OTP code to verify.
   * @returns The final access token.
   */
  async enableOtp(userId: number, code: string) {
    const user = await this.userService.findOneById(userId);
    if (!user || !user.otpSecret) {
      throw new UnauthorizedException(
        'User not found or OTP secret not generated',
      );
    }

    const isValid = this.verifyOtp(code, user.otpSecret);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code. Please try again.');
    }

    await this.userService.update(userId, { isOtpEnabled: true });
    const found = await this.userService.findOneByUsername(user.username);
    if (!found) {
      throw new UnauthorizedException(
        'User not found after OTP enable validation',
      );
    }
    return this.issueAccessToken(found);
  }

  /**
   * Verifies an OTP code against a user's secret.
   * @param code The OTP code.
   * @param secret The user's OTP secret.
   * @returns True if the code is valid, otherwise false.
   */
  verifyOtp(code: string, secret: string): boolean {
    return authenticator.verify({
      token: code,
      secret: secret,
    });
  }

  /**
   * Issues a Redis-backed access token for a user.
   * @param user The user object.
   * @returns An object containing the access token.
   */
  private async issueAccessToken(user: User) {
    const accessToken = await this.issueToken(
      { id: user.id, username: user.username },
      'access',
      this.accessTokenTtlMs,
    );
    return {
      message: '登录成功',
      accessToken,
    };
  }

  async logout(token?: string) {
    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }
    await this.cacheManager.del(this.getTokenKey(token));
    return { message: '退出成功' };
  }

  async logoutAll(userId: number) {
    const currentVer = await this.getOrInitUserVersion(userId);
    await this.cacheManager.set(this.getUserVersionKey(userId), currentVer + 1);
    return { message: '已退出所有会话' };
  }
}
