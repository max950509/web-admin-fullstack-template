import { Injectable } from '@nestjs/common';
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

type SafeUser = Pick<User, 'id' | 'username' | 'isOtpEnabled'>;
type UserWithRoles = User & { roles: Role[] };
type RoleWithPermissions = Role & {
  permissions: Permission[];
};
type UserWithRolesAndPermissions = SafeUser & { roles: RoleWithPermissions[] };

type UserWithRoleLinks = Prisma.UserGetPayload<{
  include: { userRoles: { include: { role: true } } };
}>;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private mapRoles(user: UserWithRoleLinks): UserWithRoles {
    const { userRoles, ...rest } = user;
    return {
      ...rest,
      roles: userRoles.map((link) => link.role),
    };
  }

  private sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, otpSecret, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Find a user by ID and return with roles and permissions
   * @param userId
   */
  async findOneByIdWithPermissions(
    userId: number,
  ): Promise<UserWithRolesAndPermissions | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
    const { id, username, isOtpEnabled, userRoles } = user;
    // Map roles with permissions for a user
    const roles = userRoles.map((link) => {
      const { rolePermissions, ...role } = link.role;
      return {
        ...role,
        permissions: rolePermissions.map((item) => item.permission),
      };
    });
    const hasAdminRole = roles.some((role) => role.name === 'admin');
    if (!hasAdminRole) {
      return { id, username, isOtpEnabled, roles };
    }
    const allPermissions = await this.prisma.permission.findMany();
    return {
      id,
      username,
      isOtpEnabled,
      roles: roles.map((role) =>
        role.name === 'admin' ? { ...role, permissions: allPermissions } : role,
      ),
    };
  }

  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findAll(query: QueryUserDto): Promise<PageResult<SafeUser>> {
    const { skip, take } = getPaginationArgs(query);
    const where: Prisma.UserWhereInput = {};
    if (query.username) {
      where.username = { contains: query.username, mode: 'insensitive' };
    }
    if (query.roleIds) {
      where.userRoles = { some: { roleId: { in: query.roleIds } } };
    }
    const total = await this.prisma.user.count({ where });
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

  async findUserByIdWithRole(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      throw new Error(`User with ID #${id} not found`);
    }
    return this.sanitizeUser(this.mapRoles(user));
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const { roleIds, password, ...reset } = updateUserDto;
    const data: Prisma.UserUpdateInput = reset;

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

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { userRoles: { include: { role: true } } },
    });
    return this.sanitizeUser(this.mapRoles(user));
  }

  async remove(id: number): Promise<void> {
    await this.findOneById(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
