---
title: NepalAI Studio
emoji: 🎬
colorFrom: rose
colorTo: indigo
sdk: docker
app_port: 3000
pinned: false
---

# 🎬 NepalAI Studio — Full-Stack AI Media Generation Suite

Bilingual Nepali Media Generation Studio powered by FLUX, Sora-2, Azure Speech TTS, and Gemini.

## Features
- **Frontend UI**: Built with React, Vite, Tailwind CSS, Lucide Icons, and Motion.
- **Backend API**: Powered by Node.js & Express, proxying FLUX image generation, Sora video pipelines, and Nepali voiceovers.
- **Full-Stack Container**: Single multi-stage Docker container serving both static frontend assets and REST API routes on port `3000`.

## Local Development
```bash
npm install
npm run dev
```

## Production Docker Build
```bash
docker build -t nepalaistudio .
docker run -p 3000:3000 nepalaistudio
```
