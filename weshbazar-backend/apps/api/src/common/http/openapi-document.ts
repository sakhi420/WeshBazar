/**
 * Shared OpenAPI document configuration.
 *
 * The live `/docs` Swagger UI (wired in `bootstrap.ts`) and the committed
 * `docs/openapi.json` artifact (produced by `scripts/generate-openapi.ts`)
 * MUST describe the exact same surface. Routing them both through this single
 * builder closes the OpenAPI metadata gap (spec §110 — servers & tags) and
 * prevents the two DocumentBuilder copies from drifting apart (spec §120).
 */
import { DocumentBuilder } from '@nestjs/swagger';
import type { Env } from '../../config/env.schema';

export const OPENAPI_TAGS = [
  { name: 'auth', description: 'Authentication, sessions and account verification.' },
  { name: 'me', description: 'Current-user profile, seller account, listings and analytics.' },
  { name: 'sellers', description: 'Public seller profiles.' },
  { name: 'categories', description: 'Public category catalog, tree and filter schema.' },
  { name: 'locations', description: 'Public provinces and cities.' },
  { name: 'listings', description: 'Listing discovery, detail, lifecycle, media, contact and reports.' },
  { name: 'favorites', description: 'User favorites.' },
  { name: 'admin', description: 'Moderator/admin operations, taxonomy, locations and audit.' },
  { name: 'health', description: 'Liveness and readiness probes.' },
] as const;

/**
 * Returns the partial OpenAPI document (the `DocumentBuilder.build()` result)
 * enriched with servers, tags and the two security schemes. Both the live
 * Swagger UI and the standalone generator pass this into
 * `SwaggerModule.createDocument(app, buildSwaggerConfig(env))`.
 */
export function buildSwaggerConfig(env: Env) {
  const builder = new DocumentBuilder()
    .setTitle('WeshBazar API')
    .setDescription(
      'Afghanistan C2C marketplace API (v1). All endpoints return the standard ' +
        'success/error envelope: { success, data|error, meta?, requestId }.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local development server');
  for (const tag of OPENAPI_TAGS) {
    builder.addTag(tag.name, tag.description);
  }
  return builder
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addCookieAuth(
      env.REFRESH_COOKIE_NAME,
      {
        type: 'apiKey',
        in: 'cookie',
        name: env.REFRESH_COOKIE_NAME,
        description:
          'HttpOnly refresh cookie (sent automatically by the browser to /api/v1/auth only).',
      },
      'refresh-cookie',
    )
    .build();
}
