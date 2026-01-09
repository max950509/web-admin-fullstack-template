import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import type { UserWithRoles } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<UserWithRoles> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('账号名或密码错误');
    }
    return user;
  }
}
