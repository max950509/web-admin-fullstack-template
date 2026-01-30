import {
  Body,
  Controller,
  ExecutionContext,
  Get,
  Post,
  UseGuards,
  Request,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CaptchaGuard } from '../../core/guards/captcha.guard';
import { TokenAuthGuard } from '../../core/guards/token-auth.guard';
import { OtpDto } from './dto/otp.dto';
import { type User } from '@prisma/client';
import type { Request as ExpressRequest } from 'express';

type RequestWithUser<TUser> = ExpressRequest & { user: TUser };

// A custom decorator to get the user from the request
export const ReqUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser<unknown>>();
    return request.user;
  },
);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  async getCaptcha() {
    return await this.authService.generateCaptcha();
  }

  @UseGuards(CaptchaGuard, AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req: RequestWithUser<User>,
    @Body() loginDto: LoginDto,
  ) {
    void loginDto;
    return this.authService.login(req.user);
  }

  @UseGuards(TokenAuthGuard)
  @Post('login/2fa')
  async loginWith2fa(@ReqUser() user: User, @Body() otpDto: OtpDto) {
    // The user object here is from the temporary token issued after the first login step.
    return this.authService.loginWith2fa(user, otpDto.code);
  }

  @UseGuards(TokenAuthGuard)
  @Post('otp/generate')
  async generateOtp(@ReqUser() user: User) {
    // This endpoint should be called after a successful password login but before OTP is enabled.
    return this.authService.generateOtp(user.id);
  }

  @UseGuards(TokenAuthGuard)
  @Post('otp/enable')
  async bindOtp(@ReqUser() user: User, @Body() otpDto: OtpDto) {
    return this.authService.enableOtp(user.id, otpDto.code);
  }

  @UseGuards(TokenAuthGuard)
  @Get('profile')
  getProfile(@ReqUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(TokenAuthGuard)
  @Post('logout')
  async logout(@Request() req: RequestWithUser<User>) {
    const headerValue = req.headers.authorization;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const authHeader = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    return this.authService.logout(authHeader);
  }

  @UseGuards(TokenAuthGuard)
  @Post('logout/all')
  async logoutAll(@ReqUser() user: User) {
    return this.authService.logoutAll(user.id);
  }
}
