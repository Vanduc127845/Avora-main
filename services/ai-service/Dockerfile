# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/ai-service/package.json ./services/ai-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter @ai4a/ai-service... --filter @ai4a/shared...

COPY services/ai-service ./services/ai-service
COPY packages/shared ./packages/shared
RUN pnpm --filter @ai4a/ai-service build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/services/ai-service/dist ./dist

RUN chown -R nodejs:nodejs /app
USER nodejs

ENV PORT=4001
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
