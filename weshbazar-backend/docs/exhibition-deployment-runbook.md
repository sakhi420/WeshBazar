# Exhibition deployment runbook — 22 November 2026

## Scope

Temporary public demonstration only; this is not a production launch. All
deployment work belongs on `deploy/exhibition-2026-11-22`. Keep the API
contract frozen.

## Target services

Neon's current Free plan includes 5 GB of Object Storage per project and does
not require a payment card. Monitor usage in the Neon Console; stay within the
free allowance for this temporary demonstration.

- Netlify: Next.js 15 frontend, repository base directory `weshbazar-frontend`.
- Render: NestJS/Fastify API, repository root directory `weshbazar-backend`,
  existing Dockerfile `docker/Dockerfile`.
- Neon: PostgreSQL plus S3-compatible Object Storage in the same project.

Render's free web service sleeps after 15 minutes without inbound traffic and
can take about one minute to wake. Open the public site and hit `/health/live`
shortly before the exhibition starts.

## Backend environment

Set these only in Render's private environment settings:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<Neon pooled PostgreSQL connection string for API runtime>
DATABASE_URL_UNPOOLED=<Neon direct PostgreSQL connection string for Prisma migrations>
DB_POOL_MAX=5
JWT_ACCESS_SECRET=<random secret, at least 32 characters>
JWT_REFRESH_SECRET=<different random secret, at least 32 characters>
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
TRUST_PROXY=true
SWAGGER_ENABLED=false
STORAGE_PROVIDER=neon
NEON_STORAGE_ENDPOINT=<S3 endpoint shown in Neon Object Storage>
NEON_STORAGE_BUCKET=<bucket name configured as public_read>
NEON_STORAGE_REGION=us-east-2
NEON_STORAGE_ACCESS_KEY_ID=<Neon Object Storage access key>
NEON_STORAGE_SECRET_ACCESS_KEY=<Neon Object Storage secret key>
SMS_PROVIDER=disabled
ORPHAN_MEDIA_RETENTION_DAYS=30
JOBS_ENABLED=true
JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED=false
JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN=true
```

`SMS_PROVIDER=disabled` only disables OTP delivery; it does not make the
marketplace read-only. Existing verified accounts can sign in and perform
authorized actions, while registration, phone verification, phone changes and
password resets fail closed until a real SMS gateway is configured. Restrict
write access separately if the exhibition must be read-only. Never use a fake
OTP or mock SMS provider on the public deployment.

## Frontend environment

Set these in Netlify, replacing the example origins with the actual service URLs:

```env
NEXT_PUBLIC_API_BASE_URL=
API_SERVER_BASE_URL=https://<render-api-host>
NEXT_PUBLIC_MEDIA_BASE_URL=https://<Neon-S3-endpoint>/<bucket-name>
NEXT_PUBLIC_SITE_URL=https://<netlify-site-host>
```

Keep `NEXT_PUBLIC_API_BASE_URL` empty so browser requests use the same-origin
`/api/v1` rewrite and the refresh cookie stays first-party to the Netlify site.
`API_SERVER_BASE_URL` supplies the backend origin for server-side reads and
rewrites.

## Database migration

1. Take and verify a local PostgreSQL backup with `pg_dump`.
2. Create Neon, ensure `DATABASE_URL_UNPOOLED` contains Neon's direct (unpooled)
   connection string, and run the existing migrations with
   `npm run prisma:migrate:deploy`. The API itself continues using the pooled
   `DATABASE_URL`.
3. Restore the local database backup into Neon. Do not seed over an existing
   dataset until the idempotent exhibition seed behavior is reviewed.
4. Compare row counts and key tables before switching the API to Neon.

## Media migration

1. Create a bucket with `public_read` access in the same Neon project. Obtain its S3 endpoint, bucket name, region, access key and secret key from the Neon Console.
2. Put these values in the local backend `.env` file; never commit secrets.
3. Run `npm run media:migrate:neon -- --dry-run` from
   `weshbazar-backend` and verify the source path and file count.
4. Run `npm run media:migrate:neon`. The script copies files and never
   deletes local originals.
5. Verify original and thumbnail/medium/large object URLs using an incognito
   browser window before switching Render to `STORAGE_PROVIDER=neon`.

## Final checks

- `GET /health/live` returns HTTP 200.
- `GET /health/ready` returns HTTP 200 with a healthy database.
- Browse home, search, category, listing details and seller pages on a phone
  using mobile data.
- Confirm original and variant images load without authentication.
- Sign in with a pre-seeded, phone-verified exhibition account. Do not put its
  password in this repository or on the event poster.
- Check Netlify and Neon Object Storage usage after the public demo.
- Keep local PostgreSQL and media backups until cloud copies are verified.


## Exhibition listing seed

Use the dedicated exhibition command from the `weshbazar-backend` directory.
Do not use `npm run db:seed` for this operation: the general seed also upserts
the administrator account and refreshes its password from environment values.

The dedicated command:

- defaults to read-only preflight (`npm run db:seed:exhibition`);
- only accepts the exact Neon hostname supplied through
  `EXHIBITION_SEED_EXPECTED_DATABASE_HOST`;
- requires `--apply` plus
  `EXHIBITION_SEED_CONFIRM=PUBLISH_147_LISTINGS` before writing;
- uses the existing active administrator and its existing seller account;
- touches only the 147 fixture slugs, not manually created listings;
- does not create users or change the administrator password;
- disables PHONE and WHATSAPP contact methods for fixture listings so the
  administrator's login phone is not published automatically;
- writes the generated image files to the isolated, ignored directory
  `apps/api/var/exhibition-seed-storage`.

PowerShell, from the backend directory:

```powershell
$env:EXHIBITION_SEED_EXPECTED_DATABASE_HOST = "ep-spring-glade-a70s8q2q-pooler.ap-southeast-2.aws.neon.tech"
npm run db:seed:exhibition
```

Review the dry-run report first. To apply the seed:

```powershell
$env:EXHIBITION_SEED_CONFIRM = "PUBLISH_147_LISTINGS"
npm run db:seed:exhibition -- --apply
```

Then upload only those isolated image files to Neon Object Storage:

```powershell
$env:LOCAL_STORAGE_PATH = Join-Path (Get-Location) "apps\\api\\var\\exhibition-seed-storage"
npm run media:migrate:neon -- --dry-run
npm run media:migrate:neon
```

Review the dry-run file count before uploading. The upload command preserves the
local originals. Do not switch the public site to this data until the uploaded
original and WebP variant URLs have been checked.

## Retention

Do not automatically destroy Neon, Neon Object Storage, or hosting services on
22 December. Listing expiration is a separate lifecycle rule. Keep the demo
infrastructure until a manual post-event review and verified backup.
