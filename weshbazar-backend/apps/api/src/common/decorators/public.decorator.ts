/**
 * `@Public()` marks a route (or whole controller) as reachable without
 * authentication. The global JWT guard (added in Phase 3) skips routes that
 * carry this metadata — health probes and auth endpoints use it.
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'weshbazar:isPublic';

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
