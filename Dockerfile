# ── Dependency install ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
# Install only the web package.json — api/ is a separate service with its own image.
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# API_URL is used by next.config.ts rewrites() at build time.
# In production the API runs on the internal Docker network as http://api:3001.
ARG API_URL=http://api:3001
ENV API_URL=${API_URL}
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output includes a condensed node_modules — no npm install needed.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# API_URL is injected at runtime via Docker environment.
# next.config.ts reads it when the server starts (not baked in at build time).
CMD ["node", "server.js"]
