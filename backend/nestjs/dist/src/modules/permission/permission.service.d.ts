import { PrismaService } from '../../prisma/prisma.service';
import { Permission, Prisma } from '@prisma/client';
export declare class PermissionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.PermissionCreateInput): Promise<Permission>;
    findAll(): Promise<Permission[]>;
    findOne(id: number): Promise<Permission>;
    update(id: number, data: Prisma.PermissionUpdateInput): Promise<Permission>;
    remove(id: number): Promise<void>;
}
