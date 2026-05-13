# ── Stage 1: build ────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Build
COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────
FROM joseluisq/static-web-server:2

# Copy compiled static files into the server's document root
COPY --from=builder /app/dist /public

# Server configuration
ENV SERVER_ROOT=/public
ENV SERVER_PORT=80
# SPA fallback: all unknown routes return index.html (client-side routing)
ENV SERVER_PAGE_FALLBACK=/public/index.html

EXPOSE 80
