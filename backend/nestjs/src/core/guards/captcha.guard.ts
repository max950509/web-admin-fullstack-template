import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class CaptchaGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { captchaId, captcha } = req.body;

    if (!captchaId || !captcha) {
      throw new BadRequestException('验证码不能为空');
    }

    const isValid = await this.authService.validateCaptcha(captchaId, captcha);
    if (!isValid) {
      throw new BadRequestException('无效验证码');
    }

    return true;
  }
}
