import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CaptchaGuard } from '../../core/guards/captcha.guard';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { OtpDto } from './dto/otp.dto';
import { type User } from '@prisma/client';

// A custom decorator to get the user from the request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  getCaptcha() {
    return this.authService.generateCaptcha();
  }

  @UseGuards(CaptchaGuard, AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('login/2fa')
  async loginWith2fa(@ReqUser() user: User, @Body() otpDto: OtpDto) {
    // The user object here is from the temporary JWT issued after the first login step
    return this.authService.loginWith2fa(user, otpDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('otp/generate')
  async generateOtp(@ReqUser() user: User) {
    // This endpoint should be called after a successful password login but before OTP is enabled.
    return this.authService.generateOtp(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('otp/enable')
  async bindOtp(@ReqUser() user: User, @Body() otpDto: OtpDto) {
    return this.authService.enableOtp(user.id, otpDto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@ReqUser() user: User) {
    // Thanks to JwtAuthGuard and JwtStrategy, req.user is populated
    const { password, otpSecret, ...remaining } = user;
    return remaining;
  }
}
