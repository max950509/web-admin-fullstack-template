import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_PERMISSIONS_KEY } from '../decorators/check-permissions.decorator';
import { User, Role, Permission } from '@prisma/client'; // Correct import path

// Define a type for User that includes roles and their permissions
type UserWithRolesAndPermissions = User & {
  roles: (Role & { permissions: Permission[] })[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<{
      action: string;
      resource: string;
    }>(CHECK_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true; // No specific permission required, access granted
    }

    const { user }: { user: UserWithRolesAndPermissions } = context
      .switchToHttp()
      .getRequest();

    if (!user || !user.roles) {
      return false; // No user or user has no roles
    }

    if (user.roles.some((role) => role.name === 'admin')) {
      return true;
    }

    // Check if the user has any role that grants the required permission
    const hasPermission = user.roles.some((role) =>
      role.permissions.some(
        (permission) =>
          permission.action === requiredPermission.action &&
          permission.resource === requiredPermission.resource,
      ),
    );

    return hasPermission;
  }
}
