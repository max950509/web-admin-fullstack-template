import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User, Role, Permission } from '@prisma/client'; // Correct import path

type UserWithRolesAndPermissions = User & {
  roles: (Role & { permissions: Permission[] })[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: {
    sub: number;
    username: string;
    isTwoFactorAuth?: boolean;
    scope?: string;
  }): Promise<UserWithRolesAndPermissions | User> {
    console.log('JwtStrategy.validate', payload);
    // For 2FA, the initial token is temporary and shouldn't grant full access
    if (payload.isTwoFactorAuth || payload.scope === '2FA') {
      const user = await this.userService.findOneById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return user; // Return user without roles for 2FA step
    }

    const user = await this.userService.findOneByUsername(payload.username);
    if (!user) {
      throw new UnauthorizedException();
    }
    // The object returned here will be attached to the request as request.user
    return user;
  }
}
