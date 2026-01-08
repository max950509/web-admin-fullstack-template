"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
});
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding database...');
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    const viewDashboardPermission = await prisma.permission.create({
        data: { action: 'view', resource: 'dashboard_menu' },
    });
    const createUserPermission = await prisma.permission.create({
        data: { action: 'create', resource: 'user_button' },
    });
    const readUserPermission = await prisma.permission.create({
        data: { action: 'read', resource: 'user_page' },
    });
    const updateUserPermission = await prisma.permission.create({
        data: { action: 'update', resource: 'user_page' },
    });
    const deleteUserPermission = await prisma.permission.create({
        data: { action: 'delete', resource: 'user_page' },
    });
    const readPermissionManagementPermission = await prisma.permission.create({
        data: { action: 'read', resource: 'permission_management' },
    });
    const createPermissionManagementPermission = await prisma.permission.create({
        data: { action: 'create', resource: 'permission_management' },
    });
    const updatePermissionManagementPermission = await prisma.permission.create({
        data: { action: 'update', resource: 'permission_management' },
    });
    const deletePermissionManagementPermission = await prisma.permission.create({
        data: { action: 'delete', resource: 'permission_management' },
    });
    const readRoleManagementPermission = await prisma.permission.create({
        data: { action: 'read', resource: 'role_management' },
    });
    const createRoleManagementPermission = await prisma.permission.create({
        data: { action: 'create', resource: 'role_management' },
    });
    const updateRoleManagementPermission = await prisma.permission.create({
        data: { action: 'update', resource: 'role_management' },
    });
    const deleteRoleManagementPermission = await prisma.permission.create({
        data: { action: 'delete', resource: 'role_management' },
    });
    console.log('Created permissions...');
    const adminRole = await prisma.role.create({
        data: {
            name: 'admin',
            permissions: {
                connect: [
                    { id: viewDashboardPermission.id },
                    { id: createUserPermission.id },
                    { id: readUserPermission.id },
                    { id: updateUserPermission.id },
                    { id: deleteUserPermission.id },
                    { id: readPermissionManagementPermission.id },
                    { id: createPermissionManagementPermission.id },
                    { id: updatePermissionManagementPermission.id },
                    { id: deletePermissionManagementPermission.id },
                    { id: readRoleManagementPermission.id },
                    { id: createRoleManagementPermission.id },
                    { id: updateRoleManagementPermission.id },
                    { id: deleteRoleManagementPermission.id },
                ],
            },
        },
    });
    const userRole = await prisma.role.create({
        data: {
            name: 'user',
            permissions: {
                connect: [
                    { id: viewDashboardPermission.id },
                    { id: readUserPermission.id },
                ],
            },
        },
    });
    console.log('Created roles...');
    const adminPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            password: adminPassword,
            roles: {
                connect: { id: adminRole.id },
            },
        },
    });
    const userPassword = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'john.doe',
            password: userPassword,
            roles: {
                connect: { id: userRole.id },
            },
        },
    });
    console.log('Created users...');
    console.log('Seeding complete!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map