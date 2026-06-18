import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { FORBIDDEN_MESSAGE_KEY, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: CurrentUser }>();
    const role = request.user?.role as RoleName | undefined;
    if (role && required.includes(role)) return true;
    const message = this.reflector.getAllAndOverride<string>(FORBIDDEN_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    throw new ForbiddenException(message ?? 'No tiene permiso para acceder a este módulo.');
  }
}
