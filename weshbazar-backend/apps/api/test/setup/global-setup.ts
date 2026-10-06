/**
 * Jest global setup for integration/e2e suites.
 *
 * Applies pending Prisma migrations to the dedicated test database so test
 * runs always execute against the current schema. Requires the PostgreSQL
 * test database to exist (see `scripts/setup-local-db.*`).
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import './test-env';

export default function globalSetup(): void {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

  // Migrations are defined at the repository root (prisma.config.ts).
  execSync('npx prisma migrate deploy', {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: 'inherit',
  });
}
