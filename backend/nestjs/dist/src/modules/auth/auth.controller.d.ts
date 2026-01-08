import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpDto } from './dto/otp.dto';
import { type User } from '@prisma/client';
export declare const ReqUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCaptcha(): {
        id: string;
        svg: string;
    };
    login(req: any, loginDto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        isTemporary: boolean;
    } | {
        message: string;
        accessToken: string;
        isTemporary?: undefined;
    }>;
    loginWith2fa(user: User, otpDto: OtpDto): Promise<{
        message: string;
        accessToken: string;
    }>;
    generateOtp(user: User): Promise<{
        message: string;
        qrCodeDataUrl: string;
        secret: string;
    }>;
    bindOtp(user: User, otpDto: OtpDto): Promise<{
        message: string;
        accessToken: string;
    }>;
    getProfile(user: User): {
        id: number;
        username: string;
        isOtpEnabled: boolean;
    };
}
