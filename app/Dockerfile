# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:26.13.1-alpine3.24

# ---- base: shared settings, owned by the non-root node user ----
FROM ${NODE_IMAGE} AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN chown node:node /app
USER node

# ---- deps: full dependency tree from the lockfile ----
FROM base AS deps
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --no-audit --no-fund

# ---- dev: used by docker-compose.dev.yml (source is bind-mounted) ----
FROM deps AS dev
COPY --chown=node:node . .
# Pre-create .next so the anonymous volume mounted there inherits node ownership.
RUN npx prisma generate && mkdir -p .next
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- migrate: one-shot Prisma CLI image for migrate deploy and db seed ----
FROM deps AS migrate
COPY --chown=node:node prisma.config.ts tsconfig.json ./
COPY --chown=node:node prisma ./prisma
RUN npx prisma generate
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- builder: generate the Prisma client and build the standalone server ----
FROM deps AS builder
COPY --chown=node:node . .
RUN npx prisma generate && npm run build

# ---- runner: minimal runtime, no npm, no Prisma CLI, no source ----
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
