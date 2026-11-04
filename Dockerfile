# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
# Prisma 7 config requires DATABASE_URL even for client generation/build.
# This build-only URL is never used by the running container.
ENV DATABASE_URL=postgresql://familytree:build-only@127.0.0.1:5432/familytree
RUN npm run db:generate
RUN npm run build

FROM dependencies AS migrate
COPY prisma ./prisma
COPY prisma7.config.ts ./
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "db:migrate"]

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
