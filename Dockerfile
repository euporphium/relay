# Build stage
FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Ensure no stale output exists
RUN rm -rf .output

# Build the application
RUN pnpm build

# Migrator stage - includes drizzle-kit for running migrations
FROM node:24-alpine AS migrator

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy drizzle config, schema, and migrations
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/db/schema ./src/db/schema

CMD ["pnpm", "drizzle-kit", "migrate"]

# Production stage - lean image for running the app
FROM node:24-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 relay

# Copy built output from builder
COPY --from=builder --chown=relay:nodejs /app/.output ./.output

USER relay

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
