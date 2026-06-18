import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const FORBIDDEN_MESSAGE_KEY = 'roles_forbidden_message';

export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
export const ForbiddenMessage = (message: string) => SetMetadata(FORBIDDEN_MESSAGE_KEY, message);
