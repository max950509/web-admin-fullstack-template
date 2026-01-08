import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User, Role } from '@prisma/client';
type UserWithRoles = Omit<User, 'password'> & {
    roles: Role[];
};
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(username: string, password: string): Promise<UserWithRoles>;
}
export {};
