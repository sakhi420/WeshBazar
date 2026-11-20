# =============================================================================
# WeshBazar API — production image (multi-stage, non-root).
#
# Build (from the repository root):
#   docker build -f docker/Dockerfile -t weshbazar-api .
#
# Migrations are intentionally NOT run automatically at container start
# (see docs/deployment.md). Run `prisma migrate deploy` as an explicit
# deployment step.
# =============================================================================

# --- Stage 1: dependencies + build -------------------------------------------
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Install workspace manifests first for better layer caching.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci

# Copy sources required for code generation and the build.
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY apps/api ./apps/api

# Generate Prisma Client and compile the application.
# Prisma's config requires a datasource URL while loading, even though
# `prisma generate` does not connect to the database. Supply build-only
# localhost placeholders so no production credentials enter the image.
RUN DATABASE_URL_UNPOOLED="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    npx prisma generate && npm run build

# --- Stage 2: production dependencies ----------------------------------------
FROM node:24-bookworm-slim AS prod-deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
# The root prepare script invokes Husky, which is a devDependency and is
# intentionally absent from this production-only install. Remove that script
# from this temporary image copy; keep dependency lifecycle scripts enabled.
RUN npm pkg delete scripts.prepare \
    && npm ci --omit=dev \
    && npm cache clean --force

# --- Stage 3: runtime ---------------------------------------------------------
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Run as the unprivileged node user.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
# npm workspaces hoists production dependencies into the root node_modules.
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
