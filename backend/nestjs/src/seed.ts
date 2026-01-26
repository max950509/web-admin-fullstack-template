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
  await prisma.operationLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  // Create permissions
  const systemMenu = await prisma.permission.create({
    data: {
      name: '系统管理',
      type: 'menu',
      action: 'menu',
      resource: 'system',
      sort: 1,
    },
  });

  const accountPage = await prisma.permission.create({
    data: {
      name: '账号管理',
      type: 'page',
      action: 'read',
      resource: 'account',
      parentId: systemMenu.id,
      sort: 1,
    },
  });
  const accountCreate = await prisma.permission.create({
    data: {
      name: '新增账号',
      type: 'action',
      action: 'create',
      resource: 'account',
      parentId: accountPage.id,
      sort: 1,
    },
  });
  const accountUpdate = await prisma.permission.create({
    data: {
      name: '编辑账号',
      type: 'action',
      action: 'update',
      resource: 'account',
      parentId: accountPage.id,
      sort: 2,
    },
  });
  const accountDelete = await prisma.permission.create({
    data: {
      name: '删除账号',
      type: 'action',
      action: 'delete',
      resource: 'account',
      parentId: accountPage.id,
      sort: 3,
    },
  });

  const rolePage = await prisma.permission.create({
    data: {
      name: '角色管理',
      type: 'page',
      action: 'read',
      resource: 'role',
      parentId: systemMenu.id,
      sort: 2,
    },
  });
  const roleCreate = await prisma.permission.create({
    data: {
      name: '新增角色',
      type: 'action',
      action: 'create',
      resource: 'role',
      parentId: rolePage.id,
      sort: 1,
    },
  });
  const roleUpdate = await prisma.permission.create({
    data: {
      name: '编辑角色',
      type: 'action',
      action: 'update',
      resource: 'role',
      parentId: rolePage.id,
      sort: 2,
    },
  });
  const roleDelete = await prisma.permission.create({
    data: {
      name: '删除角色',
      type: 'action',
      action: 'delete',
      resource: 'role',
      parentId: rolePage.id,
      sort: 3,
    },
  });

  const permissionPage = await prisma.permission.create({
    data: {
      name: '权限管理',
      type: 'page',
      action: 'read',
      resource: 'permission',
      parentId: systemMenu.id,
      sort: 3,
    },
  });
  const permissionCreate = await prisma.permission.create({
    data: {
      name: '新增权限',
      type: 'action',
      action: 'create',
      resource: 'permission',
      parentId: permissionPage.id,
      sort: 1,
    },
  });
  const permissionUpdate = await prisma.permission.create({
    data: {
      name: '编辑权限',
      type: 'action',
      action: 'update',
      resource: 'permission',
      parentId: permissionPage.id,
      sort: 2,
    },
  });
  const permissionDelete = await prisma.permission.create({
    data: {
      name: '删除权限',
      type: 'action',
      action: 'delete',
      resource: 'permission',
      parentId: permissionPage.id,
      sort: 3,
    },
  });

  const operationLogPage = await prisma.permission.create({
    data: {
      name: '操作日志',
      type: 'page',
      action: 'read',
      resource: 'operation-log',
      parentId: systemMenu.id,
      sort: 4,
    },
  });

  const departmentPage = await prisma.permission.create({
    data: {
      name: '部门管理',
      type: 'page',
      action: 'read',
      resource: 'department',
      parentId: systemMenu.id,
      sort: 5,
    },
  });
  const departmentCreate = await prisma.permission.create({
    data: {
      name: '新增部门',
      type: 'action',
      action: 'create',
      resource: 'department',
      parentId: departmentPage.id,
      sort: 1,
    },
  });
  const departmentUpdate = await prisma.permission.create({
    data: {
      name: '编辑部门',
      type: 'action',
      action: 'update',
      resource: 'department',
      parentId: departmentPage.id,
      sort: 2,
    },
  });
  const departmentDelete = await prisma.permission.create({
    data: {
      name: '删除部门',
      type: 'action',
      action: 'delete',
      resource: 'department',
      parentId: departmentPage.id,
      sort: 3,
    },
  });

  const positionPage = await prisma.permission.create({
    data: {
      name: '岗位管理',
      type: 'page',
      action: 'read',
      resource: 'position',
      parentId: systemMenu.id,
      sort: 6,
    },
  });
  const positionCreate = await prisma.permission.create({
    data: {
      name: '新增岗位',
      type: 'action',
      action: 'create',
      resource: 'position',
      parentId: positionPage.id,
      sort: 1,
    },
  });
  const positionUpdate = await prisma.permission.create({
    data: {
      name: '编辑岗位',
      type: 'action',
      action: 'update',
      resource: 'position',
      parentId: positionPage.id,
      sort: 2,
    },
  });
  const positionDelete = await prisma.permission.create({
    data: {
      name: '删除岗位',
      type: 'action',
      action: 'delete',
      resource: 'position',
      parentId: positionPage.id,
      sort: 3,
    },
  });

  console.log('Created permissions...');

  // Create roles and connect permissions
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      rolePermissions: {
        create: [
          { permission: { connect: { id: accountPage.id } } },
          { permission: { connect: { id: accountCreate.id } } },
          { permission: { connect: { id: accountUpdate.id } } },
          { permission: { connect: { id: accountDelete.id } } },
          { permission: { connect: { id: rolePage.id } } },
          { permission: { connect: { id: roleCreate.id } } },
          { permission: { connect: { id: roleUpdate.id } } },
          { permission: { connect: { id: roleDelete.id } } },
          { permission: { connect: { id: permissionPage.id } } },
          { permission: { connect: { id: permissionCreate.id } } },
          { permission: { connect: { id: permissionUpdate.id } } },
          { permission: { connect: { id: permissionDelete.id } } },
          { permission: { connect: { id: operationLogPage.id } } },
          { permission: { connect: { id: departmentPage.id } } },
          { permission: { connect: { id: departmentCreate.id } } },
          { permission: { connect: { id: departmentUpdate.id } } },
          { permission: { connect: { id: departmentDelete.id } } },
          { permission: { connect: { id: positionPage.id } } },
          { permission: { connect: { id: positionCreate.id } } },
          { permission: { connect: { id: positionUpdate.id } } },
          { permission: { connect: { id: positionDelete.id } } },
        ],
      },
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'user',
      rolePermissions: {
        create: [{ permission: { connect: { id: accountPage.id } } }],
      },
    },
  });

  console.log('Created roles...');

  const hqDepartment = await prisma.department.create({
    data: {
      name: '总部',
      sort: 1,
    },
  });
  const techDepartment = await prisma.department.create({
    data: {
      name: '技术部',
      parentId: hqDepartment.id,
      sort: 1,
    },
  });
  const opsDepartment = await prisma.department.create({
    data: {
      name: '运营部',
      parentId: hqDepartment.id,
      sort: 2,
    },
  });

  const techLead = await prisma.position.create({
    data: {
      name: '技术负责人',
      departmentId: techDepartment.id,
    },
  });
  const operator = await prisma.position.create({
    data: {
      name: '运营专员',
      departmentId: opsDepartment.id,
    },
  });

  // Create users and connect roles
  const adminPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      departmentId: techDepartment.id,
      positionId: techLead.id,
      userRoles: {
        create: [{ role: { connect: { id: adminRole.id } } }],
      },
    },
  });

  const userPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      username: 'john.doe',
      password: userPassword,
      departmentId: opsDepartment.id,
      positionId: operator.id,
      userRoles: {
        create: [{ role: { connect: { id: userRole.id } } }],
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
