# ==========================================
# 1. Base Stage: System Dependencies & Node Modules
# ==========================================
FROM node:20-slim AS base

WORKDIR /app

# Install system dependencies including FFmpeg and fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libx264-dev \
    libx265-dev \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifest and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# ==========================================
# 2. Builder Stage: Compile Frontend & Bundled Server
# ==========================================
FROM base AS builder

RUN npm run build

# ==========================================
# 3. Web Service Target (Used by docker-compose & Cloud Run)
# ==========================================
FROM base AS web

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]

# ==========================================
# 4. Standalone Render Worker Target (Used by docker-compose render-worker)
# ==========================================
FROM base AS render-worker

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["npm", "run", "worker"]
