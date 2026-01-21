import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{
      action: string;
      resource: string;
    }>(CHECK_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true; // No specific permission required, access granted
    }

    const { user }: { user?: User } = context.switchToHttp().getRequest();
    if (!user) {
      return false; // No user attached to request.
    }

    // Check if the user has the required permission or is an admin
    const matchedRole = await this.prisma.role.findFirst({
      where: {
        userRoles: { some: { userId: user.id } },
        OR: [
          { name: 'admin' },
          {
            rolePermissions: {
              some: {
                permission: {
                  action: requiredPermission.action,
                  resource: requiredPermission.resource,
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return Boolean(matchedRole);
  }
}
