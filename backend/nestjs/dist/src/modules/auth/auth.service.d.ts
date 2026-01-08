import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User, Role, Permission } from '@prisma/client';
type UserWithRoles = Omit<User, 'password'> & {
    roles: (Role & {
        permissions: Permission[];
    })[];
};
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly cacheManager;
    private readonly captchaTtlMs;
    constructor(userService: UserService, jwtService: JwtService, cacheManager: Cache);
    validateUser(username: string, pass: string): Promise<UserWithRoles | null>;
    private getCaptchaKey;
    generateCaptcha(): Promise<{
        id: string;
        svg: string;
    }>;
    validateCaptcha(id: string, text: string): Promise<boolean>;
    login(user: UserWithRoles): Promise<{
        message: string;
        accessToken: string;
        isTemporary: boolean;
    } | {
        message: string;
        accessToken: string;
        isTemporary?: undefined;
    }>;
    loginWith2fa(user: User, code: string): Promise<{
        message: string;
        accessToken: string;
    }>;
    generateOtp(userId: number): Promise<{
        message: string;
        qrCodeDataUrl: string;
        secret: string;
    }>;
    enableOtp(userId: number, code: string): Promise<{
        message: string;
        accessToken: string;
    }>;
    verifyOtp(code: string, secret: string): boolean;
    private generateTokens;
}
export {};
