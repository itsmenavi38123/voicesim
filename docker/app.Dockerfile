# ========================================
# Base Stage: Alpine Linux with Bun
# ========================================
FROM oven/bun:alpine AS base

# ========================================
# Dependencies Stage: Install Dependencies
# ========================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install turbo globally
RUN bun install -g turbo

COPY package.json bun.lock ./
RUN mkdir -p apps
COPY apps/sim/package.json ./apps/sim/package.json

RUN bun install --omit dev --ignore-scripts

# ========================================
# Builder Stage: Build the Application
# ========================================
FROM base AS builder
WORKDIR /app

# Install turbo globally in builder stage
RUN bun install -g turbo

# Make build args available
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET 
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG ENCRYPTION_KEY
ARG OLLAMA_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NODE_ENV
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG RESEND_API_KEY

# Set environment variables inside the container
ENV DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    BETTER_AUTH_URL=$BETTER_AUTH_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    ENCRYPTION_KEY=$ENCRYPTION_KEY \
    OLLAMA_URL=$OLLAMA_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NODE_ENV=$NODE_ENV \
    GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID \
    GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET \
    RESEND_API_KEY=$RESEND_API_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Installing with full context to prevent missing dependencies error
RUN bun install --omit dev --ignore-scripts

# Required for standalone nextjs build
WORKDIR /app/apps/sim
RUN bun install sharp

ENV NEXT_TELEMETRY_DISABLED=1 \
    VERCEL_TELEMETRY_DISABLED=1 \
    DOCKER_BUILD=1

WORKDIR /app
RUN bun run build

# ========================================
# Runner Stage: Run the actual app
# ========================================

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/sim/public ./apps/sim/public
COPY --from=builder /app/apps/sim/.next/standalone ./
COPY --from=builder /app/apps/sim/.next/static ./apps/sim/.next/static

EXPOSE 3000
ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["bun", "apps/sim/server.js"]