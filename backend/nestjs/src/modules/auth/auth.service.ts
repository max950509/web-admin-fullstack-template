import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User, Role, Permission } from '@prisma/client';
import * as svgCaptcha from 'svg-captcha';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import * as bcrypt from 'bcrypt';

type UserWithRoles = Omit<User, 'password'> & {
  roles: (Role & { permissions: Permission[] })[];
}; // User without password, but with roles and their permissions

@Injectable()
export class AuthService {
  // A simple in-memory cache for CAPTCHAs. In production, use Redis or another cache store.
  private captchaCache = new Map<string, string>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Generates a new CAPTCHA.
   * @returns An object containing the ID and the SVG data of the CAPTCHA.
   */
  generateCaptcha(): { id: string; svg: string } {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
    });
    const captchaId = `captcha_${Date.now()}`;
    this.captchaCache.set(captchaId, captcha.text.toLowerCase());

    // Clean up the cache after 5 minutes
    setTimeout(() => this.captchaCache.delete(captchaId), 5 * 60 * 1000);

    return { id: captchaId, svg: captcha.data };
  }

  /**
   * Validates a given CAPTCHA.
   * @param id The ID of the CAPTCHA.
   * @param text The text to validate against.
   */
  validateCaptcha(id: string, text: string): boolean {
    const storedText = this.captchaCache.get(id);
    if (storedText === text.toLowerCase()) {
      this.captchaCache.delete(id); // CAPTCHA is single-use
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
      // If OTP is enabled, don't issue a full JWT yet.
      // Issue a temporary token that only grants access to the 2FA verification endpoint.
      const payload = {
        sub: user.id,
        username: user.username,
        isTwoFactorAuth: true,
      };
      const temporaryToken = this.jwtService.sign(payload, { expiresIn: '5m' });
      return {
        message: 'OTP required for 2FA',
        accessToken: temporaryToken, // This token is temporary
        isTemporary: true, // Flag to indicate that this is a temporary token
      };
    }

    // If OTP is not enabled, proceed with normal login.
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
    };
  }

  /**
   * Handles the second factor (OTP) authentication.
   * @param user The user object from the temporary JWT.
   * @param code The OTP code from the user.
   * @returns The final access and refresh tokens.
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
    const { password: _pwd, ...safeUser } = found;
    return this.generateTokens(safeUser as UserWithRoles);
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
   * @returns The final access and refresh tokens.
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
    const { password: _pwd, ...safeUser } = found;
    return this.generateTokens(safeUser as UserWithRoles);
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
   * Generates JWT access and refresh tokens for a user.
   * @param user The user object.
   * @returns An object containing the access token.
   */
  private async generateTokens(user: UserWithRoles) {
    console.log('generateTokens', user);
    const userPermissions = user.roles.flatMap((role) =>
      role.permissions.map((p) => `${p.action}:${p.resource}`),
    );

    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles.map((role) => role.name),
      permissions: userPermissions, // Add permissions to JWT payload
    };
    return {
      message: '登录成功',
      accessToken: this.jwtService.sign(payload),
    };
  }
}
