# syntax=docker/dockerfile:1.7
# Builder: Node 20 LTS to match the engines field in package.json and CI.
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat is required by some native deps (e.g. esbuild) on Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./
# Install all deps (including devDeps) — `npm run build` needs them.
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the production bundle into dist/
ENV NODE_ENV=production
RUN npm run build \
    && echo "Build OK — dist/ contents:" \
    && ls -la dist

# Production image: static assets served by Nginx
FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built application from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Drop root privileges: run nginx as an unprivileged user.
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown app:app /var/run/nginx.pid

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]