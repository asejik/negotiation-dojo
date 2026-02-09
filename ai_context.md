# Negotiation Dojo (Hackathon Project)
Last Updated: February 9, 2026

## 1. Tech Stack & Architecture
- **Frontend Framework:** React 18 (Vite) + TypeScript
- **Styling:** Tailwind CSS v3.4.17 (Forced Stable Version) + PostCSS
- **Architecture:** Modular "Composer Hook" Pattern
  - **UI Layer:** Small, presentational components (`src/components/`)
  - **Logic Layer:** Dedicated custom hooks (`src/hooks/`)
  - **Orchestration:** `useGeminiLive.ts` acts as the main controller.
- **AI Integration (Live):** Gemini 2.5 Live API (`gemini-2.5-flash-native-audio-latest`) via WebSocket
- **AI Integration (Analysis):** Gemini 3 Flash (`gemini-3-flash-preview`) via REST API

## 2. Key Features & Rules
- **"Viper" Persona:** Ruthless AI negotiator.
- **Street Fighter UI:** Split-screen layout with health bars.
- **Ref Pattern:** heavily used in `useGeminiSocket` to prevent "Stale Closures" in React Strict Mode.
- **Native Audio:** We use `gemini-2.5-flash-native-audio-latest` with `["AUDIO"]` modality for maximum stability.

## 3. Database Schema & Auth
*Not Applicable (Stateless/Client-side only).*

## 4. File Map
```text
negotiation-dojo/
├── public/
│   └── audio-processor.worklet.js  -> AudioWorklet for off-thread PCM processing
├── src/
│   ├── components/                 -> **UI Components**
│   │   ├── Header.tsx              -> Top bar, recording status
│   │   ├── PlayerView.tsx          -> User video, confidence bar, body language
│   │   ├── ViperView.tsx           -> AI avatar, patience bar, visualizer
│   │   ├── Controls.tsx            -> Start/Stop buttons
│   │   ├── HealthBars.tsx          -> (Deprecated/Legacy)
│   │   └── WinLoseOverlay.tsx      -> End-game screens & Gemini 3 Analysis
│   ├── hooks/                      -> **Logic Hooks**
│   │   ├── useGameLogic.ts         -> Manages Health Bars, Win/Lose state, Scoring
│   │   ├── useAudioStream.ts       -> Manages Mic, AudioWorklet, Volume levels
│   │   ├── useRecording.ts         -> Manages MediaRecorder & Session Stats
│   │   └── useGeminiSocket.ts      -> Manages WebSocket connection & Message parsing
│   ├── App.tsx                     -> Layout container (composes components)
│   ├── useGeminiLive.ts            -> **Main Controller** (composes hooks)
│   └── useGeminiAnalysis.ts        -> Gemini 3 REST API logic
5. Roadmap & Next Steps
[x] Phase 1-2: Foundation & Connection (Fixed WebSocket 1000, 1011)

[x] Phase 3: Stabilization (AudioWorklet, Strict Mode Fixes)

[x] Phase 4-7: Gameplay, Body Language, Recording, Gemini 3 Analysis

[x] Phase 8: Refactoring (COMPLETED)

[x] Split monolithic code into hooks/ and components/

[x] Implement "Composer Hook" pattern

[x] Fix Stale Closure bugs in WebSocket

[ ] Phase 9: Submission

[ ] Record 3-minute demo video (using "Force Win" button)

[ ] Deploy to Vercel

[ ] Submit to Devpost

6. Known Issues
Body Language Text: The gemini-2.5-flash-native-audio-latest model is Audio-Only. Text-based body language detection (via parseViperResponse) is currently limited. Logic exists but relies on audio keywords.