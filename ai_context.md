# Negotiation Dojo (Hackathon Project)
Last Updated: 2026-01-22

## 1. Tech Stack & Architecture
- **Frontend Framework:** React 18 (Vite) + TypeScript
- **Styling:** Tailwind CSS v3.4.17 (Forced Stable Version) + PostCSS
- **AI Integration:** Google Gemini Multimodal Live API (`gemini-2.0-flash-exp`) via WebSocket
- **Audio Engine:** Native Web Audio API using `ScriptProcessorNode` (Legacy method for broad compatibility)
- **Architecture:** Client-Direct-to-Cloud (Serverless). The browser connects directly to Google's `generativelanguage.googleapis.com` WebSocket endpoint. No intermediate backend.

## 2. Key Features & Rules
- **"Viper" Persona:** System instructions enforce an aggressive, high-stakes corporate negotiator personality.
- **Street Fighter UI:** A split-screen visual layout with "Health Bars" (Confidence vs. Patience) and retro-gaming aesthetics.
- **Push-to-Talk / Live Mode:** Evolution from a "Hold-to-Speak" button to a fully "Live" open-mic session (currently debugging).
- **Billing Enabled:** Project is linked to a Google Cloud Billing account to bypass the `1011 Quota` error.
- **Rule:** Do not use `AudioWorklet` yet; stick to `ScriptProcessorNode` despite deprecation warnings until audio is stable.
- **Rule:** Audio Input must be downsampled to 16kHz PCM (Int16) for Gemini.
- **Rule:** Audio Output from Gemini (24kHz PCM) must be scheduled in a queue to prevent overlap.

## 3. Database Schema & Auth
*Not Applicable (Current architecture is stateless/client-side only).*

## 4. File Map
- `src/App.tsx` -> Main entry point. Handles the "Street Fighter" UI layout, Health Bars, and Start buttons.
- `src/useGeminiLive.ts` -> **CRITICAL.** The "Brain" of the app. Handles:
    - Microphone/Camera access.
    - WebSocket connection management.
    - Audio resampling (Float32 -> Int16).
    - Audio scheduling/playback.
    - Incoming Blob -> Text conversion.
- `src/index.css` -> Tailwind directives and custom retro font imports.
- `.env.local` -> Stores `VITE_GEMINI_API_KEY`.

## 5. Roadmap & Next Steps
- [x] **Phase 1: Foundation**
    - [x] Setup React + Tailwind v3.
    - [x] Build Street Fighter UI.
    - [x] Fix PostCSS/Tailwind v4 conflict.
- [x] **Phase 2: Connection**
    - [x] Integrate Gemini Live WebSocket.
    - [x] Solve `1011` Quota error (Billing enabled).
    - [x] Fix `Unexpected token 'o'` Blob error.
- [ ] **Phase 3: Stabilization (CURRENT PRIORITY)**
    - [ ] **CRITICAL:** Fix WebSocket `1000` (Normal Closure) error immediately after connection.
    - [ ] Debug audio input "Silence" issue (Gemini hanging up due to empty audio).
    - [ ] Verify two-way audio latency.
- [ ] **Phase 4: Gameplay Mechanics**
    - [ ] Implement "Interrupt Logic" (Stop AI audio when User speaks).
    - [ ] Connect UI Health Bars to real analysis data.
    - [ ] Add "Game Over" / "Win" states.

## 6. Known Issues & Technical Debt
- **WebSocket Closure 1000:** The connection drops cleanly immediately after the "Kickstart" message. Suspected cause: Audio encoding mismatch or aggressive silence detection by Google.
- **Deprecation Warning:** Console shows `ScriptProcessorNode is deprecated`. Ignoring this is a conscious choice for speed, but `AudioWorklet` is the proper long-term fix.
- **TypeScript Error:** `SharedArrayBuffer` vs `ArrayBuffer` type mismatch (patched via `ArrayBufferLike` type assertion).