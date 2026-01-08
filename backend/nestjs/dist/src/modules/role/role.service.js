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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let RoleService = class RoleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createRoleDto) {
        const { name, permissionIds } = createRoleDto;
        return this.prisma.role.create({
            data: {
                name,
                permissions: {
                    connect: permissionIds.map((id) => ({ id })),
                },
            },
            include: { permissions: true },
        });
    }
    async findAll() {
        return this.prisma.role.findMany({ include: { permissions: true } });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID #${id} not found`);
        }
        return role;
    }
    async update(id, updateRoleDto) {
        const { name, permissionIds } = updateRoleDto;
        const data = {};
        if (name) {
            data.name = name;
        }
        if (permissionIds) {
            data.permissions = {
                set: permissionIds.map((id) => ({ id })),
            };
        }
        try {
            return await this.prisma.role.update({
                where: { id },
                data,
                include: { permissions: true },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Role with ID #${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.role.delete({ where: { id } });
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoleService);
//# sourceMappingURL=role.service.js.map