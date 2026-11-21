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
- Sign in with a pre-seeded exhibition account and confirm the storefront pages
  show the five approved public names. Seeded users remain phone-unverified;
  do not claim they have passed OTP verification. Do not put passwords in this
  repository or on the event poster.
- Check Netlify and Neon Object Storage usage after the public demo.
- Keep local PostgreSQL and media backups until cloud copies are verified.


## Exhibition listing seed

Run the dedicated exhibition command from the `weshbazar-backend` directory.
Do not use `npm run db:seed`: the general seed also upserts the administrator
account and may refresh its password from environment values.

The exhibition seed creates five independent USER logins and five public
INDIVIDUAL seller profiles. The public storefront names and fixture allocation
are fixed as follows:

| Public seller profile | Listings | Credential key |
| --- | ---: | --- |
| بازار موتر پامیر | 18 | `pamir` |
| خانه و املاک آریانا | 27 | `ariana` |
| فروشگاه تجهیزات نوین | 36 | `novin` |
| فروشگاه خانواده | 31 | `family` |
| بازار خدمات و زراعت | 35 | `services` |
| **Total** | **147** | |

The login phone/password pairs are associated with these credential keys in
the same order supplied by the project owner; they do not determine the public
storefront names. No new API endpoint, database migration, or OpenAPI change
is involved.

### Local credentials

Create this file locally:

`prisma/exhibition-seller-credentials.local.json`

Its required shape is:

```json
[
  { "key": "pamir", "phone": "AF_PHONE_1", "password": "LOCAL_PASSWORD_1" },
  { "key": "ariana", "phone": "AF_PHONE_2", "password": "LOCAL_PASSWORD_2" },
  { "key": "novin", "phone": "AF_PHONE_3", "password": "LOCAL_PASSWORD_3" },
  { "key": "family", "phone": "AF_PHONE_4", "password": "LOCAL_PASSWORD_4" },
  { "key": "services", "phone": "AF_PHONE_5", "password": "LOCAL_PASSWORD_5" }
]
```

Replace the placeholders with the five phone/password pairs supplied by the
project owner. The file is ignored by Git. Never paste its contents into a
commit, pull request, issue, or deployment environment. The seeder hashes
new passwords with the same Argon2id parameters as the application and never
prints passwords or full phone numbers.

If a phone already belongs to an active USER account, the supplied password
must verify against the existing hash; otherwise the command stops without
resetting it. A matching account and its existing seller profile are reused
without changing the password or personal fields. If the phone belongs to an
ADMIN, inactive, deleted, or otherwise ineligible account, the command stops. Newly created users remain phone-unverified until
a real OTP verification occurs; the seed does not forge `phoneVerifiedAt`.
They can sign in with their passwords, but normal phone-verified publishing
still requires actual verification.

### Dry run and apply

Set the exact Neon database hostname, then run the read-only preflight:

```powershell
$env:EXHIBITION_SEED_EXPECTED_DATABASE_HOST = "ep-spring-glade-a70s8q2q-pooler.ap-southeast-2.aws.neon.tech"
npm run db:seed:exhibition
```

Review all five seller counts, base-category/location checks, attribute
validation, existing slug ownership, and the 50-active-listing limit. The
command does not modify the database in dry-run mode.

After reviewing the full report, explicitly authorize the write:

```powershell
$env:EXHIBITION_SEED_CONFIRM = "PUBLISH_147_LISTINGS"
npm run db:seed:exhibition -- --apply
```

The apply run takes a PostgreSQL advisory lock and commits all account,
listing, revision, moderation, contact, and image-record writes in one
transaction. A failure rolls the database transaction back and removes that
run's local staging directory. Listings are built as DRAFT, submitted, and
approved before the transaction commits; incomplete listings are never made
public. Archived fixture listings follow the restore/submit/approve revision
sequence. Expired active fixtures receive a RENEW revision and a fresh expiry.

The five seller profiles are attached to their own logins. The administrator
account is used only as the moderation actor; its password and account fields
are not updated. Fixture PHONE, WHATSAPP, and TELEGRAM contact methods remain disabled so
the login phone numbers are not exposed as seller contact details.

### Neon Object Storage

After the seed command has exited successfully, copy the exact staging
directory printed at the end of its output. The seed writes a temporary
`.seed-in-progress` marker while it is running; the media migration refuses
to upload a directory that still contains this marker.

```powershell
$env:LOCAL_STORAGE_PATH = "PASTE_THE_EXACT_STAGING_DIRECTORY_FROM_THE_SEED_OUTPUT"
npm run media:migrate:neon -- --dry-run
```

Verify that the dry-run reports the expected files (one original plus three
WebP variants per listing image). Then upload:

```powershell
npm run media:migrate:neon
```

The upload command preserves local originals. Do not run it in another
terminal until the seed command has fully exited. Verify original and
thumbnail/medium/large public URLs in an incognito browser before considering
the media copy complete.

### Safety and rollback

Never delete or overwrite manually created listings. Fixture slugs are stable;
a slug owned by a different seller stops the seed. Existing seller passwords
are never overwritten. Do not publish login phone numbers through listing
contact methods. Archived-image cleanup remains disabled.

If a seed fails before commit, the database transaction rolls back. If a
completed exhibition needs to be taken down later, archive only the 147
fixture slugs and retain their image history according to the listing
retention policy; do not hard-delete user or listing rows.
