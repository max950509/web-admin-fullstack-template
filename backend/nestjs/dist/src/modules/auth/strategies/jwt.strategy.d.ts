import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { User, Role, Permission } from '@prisma/client';
type UserWithRolesAndPermissions = User & {
    roles: (Role & {
        permissions: Permission[];
    })[];
};
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly userService;
    constructor(configService: ConfigService, userService: UserService);
    validate(payload: {
        sub: number;
        username: string;
        isTwoFactorAuth?: boolean;
        scope?: string;
    }): Promise<UserWithRolesAndPermissions | User>;
}
export {};
