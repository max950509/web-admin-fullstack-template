import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear existing data in reverse order of dependency
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  // Create permissions
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

  // Create roles and connect permissions
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

  // Create users and connect roles
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
