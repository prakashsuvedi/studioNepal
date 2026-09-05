FROM node:20-slim

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

# Build frontend and server backend
RUN npm run build

# Environment settings for Hugging Face
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
