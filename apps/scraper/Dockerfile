# Dockerfile for Unraid Node.js Scraper
FROM node:22-slim

WORKDIR /app

# Copy root workspace configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/scraper ./apps/scraper
COPY tooling ./tooling

# Install pnpm and dependencies
RUN npm install -g pnpm@10.19.0
RUN pnpm install --frozen-lockfile

# Build shared types package
RUN pnpm --filter @acme/shared-types build

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@acme/scraper", "start"]
