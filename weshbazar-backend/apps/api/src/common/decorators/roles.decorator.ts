/**
 * Role-based access metadata consumed by the global `RolesGuard`.
 */
import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../generated/prisma/enums';

export const ROLES_KEY = 'weshbazar:roles';

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
