import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // If no user is found, deny access
    if (!user) {
      return false;
    }

    // Check if user.roles is an array (from JWT token)
    if (user.roles && Array.isArray(user.roles)) {
      return requiredRoles.some((role) => user.roles.includes(role));
    }

    // Check if user.role is a string (from user object)
    if (user.role) {
      return requiredRoles.includes(user.role);
    }

    return false;
  }
}
