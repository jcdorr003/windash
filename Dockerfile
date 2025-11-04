# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (include tsx for running TypeScript server files)
RUN pnpm install --prod --frozen-lockfile \
  && rm -rf /root/.cache/node/corepack

# Copy built assets from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/app ./app
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./
COPY scripts ./scripts

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S windash -u 1001 && \
    chown -R windash:nodejs /app

# Switch to non-root user
USER windash

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "scripts/start-production.cjs"]
