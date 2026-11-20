import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use Neon's direct (unpooled) URL for Prisma CLI migrations when available.
    // Runtime queries continue using the pooled DATABASE_URL in PrismaService.
    url: process.env.DATABASE_URL_UNPOOLED
      ? env('DATABASE_URL_UNPOOLED')
      : env('DATABASE_URL'),
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
