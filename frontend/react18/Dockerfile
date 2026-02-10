FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

ENV PNPM_STORE_DIR=/pnpm-store

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY frontend/react18/package.json frontend/react18/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm -C frontend/react18 install

COPY frontend/react18 frontend/react18

WORKDIR /app/frontend/react18

ARG VITE_APP_BASE=/
ARG VITE_APP_API_BASE=/api
ENV VITE_APP_BASE=$VITE_APP_BASE
ENV VITE_APP_API_BASE=$VITE_APP_API_BASE

RUN pnpm run build

FROM nginx:1.27-alpine AS runtime

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/react18/dist /usr/share/nginx/html
