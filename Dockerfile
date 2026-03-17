# syntax=docker/dockerfile:1

# Monorepo workspace build for the Accessible Colors SSR Node app.
# Output layout:
# - backend/dist/server.js
# - backend/dist/frontend/**
# - backend/dist/ssr/**

FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copy only manifests first for better layer caching
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN npm ci

FROM deps AS build
WORKDIR /app

COPY frontend ./frontend
COPY backend ./backend

RUN npm run build

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
# Cloud Run sets PORT; default to 8080 for local docker runs.
ENV PORT=8080
WORKDIR /app

# Install prod dependencies (SSR runtime deps are in the frontend workspace)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN npm ci --omit=dev

# Copy built server + built frontend assets
COPY --from=build /app/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "dist/server.js"]
