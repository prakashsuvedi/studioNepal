# Multi-Stage Dockerfile for Web Server and Dedicated FFmpeg Render Worker

# Stage 1: Base & Dependencies
FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libx264-dev \
    libx265-dev \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Web Application Container
FROM base AS web
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "start"]

# Stage 3: Dedicated Render Worker Container
FROM base AS render-worker
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/server/worker.ts"]
