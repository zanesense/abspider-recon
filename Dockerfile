# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM nginx:1.25-alpine@sha256:b70da50a0f1b60534c6f276d6b887424c51533981eed2900b2d1c9b1e2993cbc AS runner
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

CMD ["nginx", "-g", "daemon off;"]