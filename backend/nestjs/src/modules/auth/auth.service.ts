import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User, Role, Permission } from '@prisma/client';
import * as svgCaptcha from 'svg-captcha';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';

export type UserWithRoles = Omit<User, 'password'> & {
  roles: (Role & { permissions: Permission[] })[];
}; // User without password, but with roles and their permissions

type TokenScope = 'access' | '2fa';

type StoredToken = {
  userId: number;
  username: string;
  scope: TokenScope;
  ver: number; // Per-user session version to invalidate all tokens at once.
  issuedAt: number;
};

@Injectable()
export class AuthService {
  private readonly captchaTtlMs = 5 * 60 * 1000;
  private readonly accessTokenTtlMs: number;
  private readonly twoFactorTokenTtlMs: number;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.accessTokenTtlMs = this.getTtlMs(
      'TOKEN_TTL_MS',
      7 * 24 * 60 * 60 * 1000,
    );
    this.twoFactorTokenTtlMs = this.getTtlMs('TOKEN_2FA_TTL_MS', 5 * 60 * 1000);
  }

  private getTtlMs(key: string, fallbackMs: number): number {
    const raw = this.configService.get<string>(key);
    if (!raw) return fallbackMs;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
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
    const record: StoredToken = {
      userId: user.id,
      username: user.username,
      scope,
      ver,
      issuedAt: Date.now(),
    };
    await this.cacheManager.set(this.getTokenKey(token), record, ttlMs);
    return token;
  }

  /**
   * Validates a user based on username and password.
   * @param username The username to validate.
   * @param pass The password to validate.
   * @returns The user object if validation is successful, otherwise null.
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserWithRoles | null> {
    const user = await this.userService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      void _password;
      return result;
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
  async login(user: UserWithRoles) {
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
    const { password: _password, ...safeUser } = found;
    void _password;
    return this.issueAccessToken(safeUser);
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

    await this.userService.updateUser(userId, { otpSecret: secret });

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

    await this.userService.updateUser(userId, { isOtpEnabled: true });
    const found = await this.userService.findOneByUsername(user.username);
    if (!found) {
      throw new UnauthorizedException(
        'User not found after OTP enable validation',
      );
    }
    const { password: _password, ...safeUser } = found;
    void _password;
    return this.issueAccessToken(safeUser);
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
  private async issueAccessToken(user: UserWithRoles) {
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
}
