import { PrismaService } from '../../prisma/prisma.service';
import { User, Role, Prisma, Permission } from '@prisma/client';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOneByUsername(username: string): Promise<(User & {
        roles: (Role & {
            permissions: Permission[];
        })[];
    }) | null>;
    findOneById(id: number): Promise<User | null>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User>;
}
