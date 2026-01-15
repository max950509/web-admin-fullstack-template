import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role, Prisma, Permission } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  createPageResult,
  getPaginationArgs,
} from '../../core/utils/pagination';
import type { PageResult } from '../../core/types/page-result';
import { QueryUserDto } from './dto/query-user.dto';

type UserWithRoles = User & { roles: Role[] };
type RoleWithPermissions = Role & { permissions: Permission[] };
type UserWithRolesAndPermissions = User & { roles: RoleWithPermissions[] };
type SafeUser = Omit<User, 'password' | 'otpSecret'> & { roles: Role[] };

type UserWithRoleLinks = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } } };
}>;

type UserWithRolePermissionLinks = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneByUsername(
    username: string,
  ): Promise<UserWithRolesAndPermissions | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      return null;
    }
    const mapped = this.mapRolesWithPermissions(user);
    const hasAdminRole = mapped.roles.some((role) => role.name === 'admin');
    if (!hasAdminRole) {
      return mapped;
    }
    const allPermissions = await this.prisma.permission.findMany();
    return {
      ...mapped,
      roles: mapped.roles.map((role) =>
        role.name === 'admin' ? { ...role, permissions: allPermissions } : role,
      ),
    };
  }

  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  private mapRoles(user: UserWithRoleLinks): UserWithRoles {
    const { userRoles, ...rest } = user;
    return {
      ...rest,
      roles: userRoles.map((link) => link.role),
    };
  }

  private mapRolesWithPermissions(
    user: UserWithRolePermissionLinks,
  ): UserWithRolesAndPermissions {
    const { userRoles, ...rest } = user;
    const roles = userRoles.map((link) => {
      const { rolePermissions, ...role } = link.role;
      return {
        ...role,
        permissions: rolePermissions.map((item) => item.permission),
      };
    });
    return { ...rest, roles };
  }

  private sanitizeUser(user: UserWithRoles): SafeUser {
    const { password: _password, otpSecret: _otpSecret, ...safeUser } = user;
    void _password;
    void _otpSecret;
    return safeUser;
  }

  async findAllAccounts(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      include: { userRoles: { include: { role: true } } },
    });
    return users.map((user) => this.sanitizeUser(this.mapRoles(user)));
  }

  async findAccountsPage(query: QueryUserDto): Promise<PageResult<SafeUser>> {
    const { skip, take } = getPaginationArgs(query);
    const total = await this.prisma.user.count();
    const where: Prisma.UserWhereInput = {};
    if (query.username) {
      where.username = { contains: query.username, mode: 'insensitive' };
    }
    if (query.roleIds) {
      where.userRoles = { some: { roleId: { in: query.roleIds } } };
    }
    const users = await this.prisma.user.findMany({
      where,
      include: { userRoles: { include: { role: true } } },
      orderBy: { id: 'desc' },
      skip,
      take,
    });
    const list = users.map((user) => this.sanitizeUser(this.mapRoles(user)));
    return createPageResult(list, total, query);
  }

  async findAccountById(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }
    return this.sanitizeUser(this.mapRoles(user));
  }

  async createAccount(createUserDto: CreateUserDto): Promise<SafeUser> {
    const { username, password, roleIds } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        userRoles: roleIds?.length
          ? {
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : undefined,
      },
      include: { userRoles: { include: { role: true } } },
    });
    return this.sanitizeUser(this.mapRoles(user));
  }

  async updateAccount(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<SafeUser> {
    const { username, password, roleIds } = updateUserDto;
    const data: Prisma.UserUpdateInput = {};

    if (username) {
      data.username = username;
    }

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    if (roleIds) {
      data.userRoles = {
        deleteMany: {},
        ...(roleIds.length
          ? {
              create: roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : {}),
      };
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: { userRoles: { include: { role: true } } },
      });
      return this.sanitizeUser(this.mapRoles(user));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID #${id} not found`);
      }
      throw error;
    }
  }

  async removeAccount(id: number): Promise<void> {
    await this.findAccountById(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
