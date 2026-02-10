FROM node:22-alpine AS base

RUN corepack enable

WORKDIR /app

ENV PNPM_STORE_DIR=/pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY backend/nestjs/package.json backend/nestjs/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm -C backend/nestjs install

COPY backend/nestjs/prisma backend/nestjs/prisma
COPY backend/nestjs backend/nestjs

WORKDIR /app/backend/nestjs
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public pnpm exec prisma generate
RUN pnpm run build

FROM base AS migrate

WORKDIR /app/backend/nestjs

CMD ["pnpm", "prisma", "migrate", "deploy"]

FROM base AS seed

WORKDIR /app/backend/nestjs

CMD ["node", "dist/src/seed.js"]

FROM node:22-alpine AS runtime

WORKDIR /app/backend/nestjs

ENV NODE_ENV=production

COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/backend/nestjs/node_modules ./node_modules
COPY --from=base /app/backend/nestjs/package.json ./package.json
COPY --from=base /app/backend/nestjs/prisma.config.ts ./prisma.config.ts
COPY --from=base /app/backend/nestjs/dist ./dist
COPY --from=base /app/backend/nestjs/prisma ./prisma

CMD ["node", "dist/src/main.js"]
