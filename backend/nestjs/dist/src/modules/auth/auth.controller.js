"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.ReqUser = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const captcha_guard_1 = require("../../core/guards/captcha.guard");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
const otp_dto_1 = require("./dto/otp.dto");
const common_2 = require("@nestjs/common");
exports.ReqUser = (0, common_2.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    getCaptcha() {
        return this.authService.generateCaptcha();
    }
    async login(req, loginDto) {
        return this.authService.login(req.user);
    }
    async loginWith2fa(user, otpDto) {
        return this.authService.loginWith2fa(user, otpDto.code);
    }
    async generateOtp(user) {
        return this.authService.generateOtp(user.id);
    }
    async bindOtp(user, otpDto) {
        return this.authService.enableOtp(user.id, otpDto.code);
    }
    getProfile(user) {
        const { password, otpSecret, ...remaining } = user;
        return remaining;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('captcha'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCaptcha", null);
__decorate([
    (0, common_1.UseGuards)(captcha_guard_1.CaptchaGuard, (0, passport_1.AuthGuard)('local')),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('login/2fa'),
    __param(0, (0, exports.ReqUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, otp_dto_1.OtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWith2fa", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('otp/generate'),
    __param(0, (0, exports.ReqUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('otp/enable'),
    __param(0, (0, exports.ReqUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, otp_dto_1.OtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "bindOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, exports.ReqUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map