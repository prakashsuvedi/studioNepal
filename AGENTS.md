# NepalAI Studio - Agent Guidelines & Project Baseline

This file locks the architectural baseline, confirmed working AI services, and developer guidelines for all future agent sessions.

---

## 🔒 Locked Core Pillars (Verified & Production Ready)

The following four core pipelines have been manually and automatically tested and verified with real live credentials and payloads:

### 1. Audio Generation Studio (`/api/generate/audio`)
- **Primary Engine**: Hugging Face SpeechT5 neural text-to-speech (`microsoft/speecht5_tts`).
- **Nepali Voice Support**: Pre-configured acoustic speaker profiles and localized phoneme mappings.
- **Secondary Engine**: Azure Speech Services (`AZURE_SPEECH` / `AZURE_SPEECH_KEY`, region `eastus`).
- **Output**: Base64 WAV audio buffer (`data:audio/wav;base64,...`) directly ingestible into timeline audio tracks.
- **Rule**: Never break or replace the base64 audio response schema expected by `VoiceStudioView.tsx`.

### 2. Image Generation Studio (`/api/images/azure`, `/api/generate/image`)
- **Primary Engine**: OpenAI `gpt-image-1.5` on Azure AI Foundry (`https://prakashsuvedi-7749-resource.services.ai.azure.com`).
  - **CRITICAL Azure Parameter**: Quality parameter MUST be `'low'`, `'medium'`, `'high'`, or `'auto'` (DO NOT send legacy `'standard'` or `'hd'` to Azure `gpt-image-1.5`, as Azure returns HTTP 400).
  - Default size: `1024x1024`.
- **Secondary Engine**: Hugging Face FLUX.1 Schnell (`black-forest-labs/FLUX.1-schnell`).
- **Free/Zero-Quota Engine**: Pollinations Turbo (`pollinations-free`) for unauthenticated or rate-limited guests.
- **Storage/Serving**: Generated base64 images are written to `/dist/uploads/` and served via `/api/storage/file/:filename`.

### 3. Video Generation Studio (`/api/video/azure`, `/api/generate/video`)
- **Primary Engine**: Azure OpenAI `sora-2` (`https://prakashsuvedi-7749-resource.services.ai.azure.com/openai/v1/videos`).
- **Lifecycle Flow**:
  1. POST job request -> returns `jobId` and `status: "in_progress"`.
  2. Polling loop -> `GET /api/video/status/:jobId` (checks Azure job completion).
  3. Video Streaming -> `GET /api/video/content/:jobId` proxies the Azure video MP4 stream with byte-range headers (`Range: bytes=0-`) so HTML5 video players can scrub and play without CORS or token leakage.
  4. Guest/Fallback -> High-res preview video reels when Azure credits or credentials are not present.

### 4. HamroAI Multilingual Chat (`/api/ai/chat`)
- **Primary Model**: Azure OpenAI `gpt-4o` and `gpt-5-mini` on the Azure AI Foundry resource.
- **System Identity**: Culturally aware AI assistant fluent in Nepali (Devanagari), Romanized Nepali, Hindi, and English.
- **Fallback**: Server-side Google Gemini 2.5 Flash if Azure endpoints are unreachable.
- **Rule**: Retain cultural knowledge of Nepal (festivals, geography, constitution, Newari/Himalayan arts, tourism, history).

---

## ⚙️ Environment & Credential Management
- **Azure OpenAI Key**: Resolved via `process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY || process.env.AZURE_API_KEY`.
- **Hugging Face Token**: `process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN`.
- **Azure Speech**: `process.env.AZURE_SPEECH || process.env.AZURE_SPEECH_KEY`, region `process.env.AZURE_SPEECH_REGION || 'eastus'`.
- **Gemini API**: `process.env.GEMINI_API_KEY` (server-side only).
- **Rule**: Never expose raw secret keys to client-side code (`import.meta.env`). All generation calls MUST route through server `/api/*` endpoints.

---

## 🛡️ Admin & Operational Rules
1. **Admin Bypass**: Requests from admin users or containing `adminBypass: true` must never be blocked by local credit quotas.
2. **Diagnostic Endpoint**: `GET /api/diagnostic/ai-credentials` provides real-time verification of Azure Foundry models, connection status, and Hugging Face authentication. Always keep this working for automated audits.
3. **Timeline Compatibility**: All generated assets (audio WAVs, generated PNGs, Sora MP4s) must remain 100% compatible with the multi-track timeline editor (`TimelineTrack`, `TimelineClip`).
4. **No Regressions**: When building new features, never delete or degrade existing working endpoints.
