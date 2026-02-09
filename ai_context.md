# Negotiation Dojo (Hackathon Project)
Last Updated: February 9, 2022

## 1. Tech Stack & Architecture
- **Frontend Framework:** React 18 (Vite) + TypeScript
- **Styling:** Tailwind CSS v3.4.17 (Forced Stable Version) + PostCSS
- **AI Integration (Live):** Gemini 2.5 Live API (`gemini-2.5-flash-native-audio-latest`) via WebSocket
- **AI Integration (Analysis):** Gemini 3 Flash (`gemini-3-flash-preview`) via REST API
- **API Version:** v1beta (`google.ai.generativelanguage.v1beta`)
- **Audio Engine:** Web Audio API using `AudioWorkletNode` (Modern, off-main-thread processing)
- **Recording:** MediaRecorder API for session capture (WebM format)
- **Architecture:** Client-Direct-to-Cloud (Serverless). The browser connects directly to Google's `generativelanguage.googleapis.com` endpoints. No intermediate backend.

## 2. Key Features & Rules

### Completed Features
- **"Viper" Persona:** Ruthless AI negotiator with body language awareness
- **Street Fighter UI:** Split-screen layout with health bars and retro-gaming aesthetics
- **Live Audio/Video Mode:** Real-time bidirectional streaming via Gemini 2.5 Live API
- **Health Bar Game System:** User confidence vs Viper's patience with win/lose conditions
- **Body Language Analysis:** Viper comments on eye contact, posture, and expressions
- **Session Recording:** Full negotiations recorded with key moments, downloadable as WebM
- **Post-Game Summary:** Statistics showing duration, rounds, and key moments
- **Gemini 3 AI Coaching:** Post-session analysis with scores, strengths, weaknesses, and tips

### Strict Rules
- **Rule:** Live API requires `v1beta` version (not v1alpha)
- **Rule:** Live API requires `gemini-2.5-flash-native-audio-latest` model
- **Rule:** Gemini 3 models do NOT support `bidiGenerateContent` (Live API)
- **Rule:** Must wait for `setupComplete` message before streaming audio/video
- **Rule:** Audio must be 16kHz PCM with MIME type `audio/pcm;rate=16000`
- **Rule:** Audio output from Gemini is 24kHz PCM, must be scheduled in queue
- **Rule:** JSON field names must use camelCase (e.g., `realtimeInput`, `mediaChunks`)
- **Rule:** Use refs (`isStartingRef`, `isStoppingRef`) to prevent React Strict Mode race conditions
- **Rule:** Response modalities for Live API must be `["AUDIO"]` only (TEXT not supported)
- **Rule:** Billing must be enabled on Google Cloud account

## 3. Database Schema & Auth
*Not Applicable (Current architecture is stateless/client-side only).*

## 4. File Map

```
negotiation-dojo/
├── public/
│   ├── vite.svg
│   └── audio-processor.worklet.js  -> AudioWorklet for off-thread PCM processing
│                                      Buffers 4096 samples, calculates RMS volume,
│                                      sends audio data to main thread via postMessage
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx                     -> Main UI component:
│   │                                  - Split-screen battlefield layout
│   │                                  - Health bars (Confidence & Patience)
│   │                                  - Body language indicators
│   │                                  - Recording controls
│   │                                  - Win/lose overlays with Gemini 3 analysis
│   │                                  - Session stats display
│   ├── declarations.d.ts
│   ├── index.css                   -> Tailwind directives and custom styles
│   ├── main.tsx                    -> React entry point
│   ├── useGeminiLive.ts            -> **CRITICAL** Core hook for Gemini 2.5 Live API:
│   │                                  - WebSocket connection management
│   │                                  - Audio capture via AudioWorklet
│   │                                  - Video frame capture and streaming
│   │                                  - Health bar state management
│   │                                  - Body language keyword parsing
│   │                                  - Session recording (MediaRecorder)
│   │                                  - Key moments tracking
│   │                                  - Win/lose condition detection
│   │                                  - Silence penalty checker
│   │                                  - Voice confidence analysis
│   └── useGeminiAnalysis.ts        -> Gemini 3 post-session analysis hook:
│                                      - REST API call to gemini-3-flash-preview
│                                      - Performance scoring (overall, confidence, strategy, composure)
│                                      - Strengths/weaknesses identification
│                                      - Tactical breakdown analysis
│                                      - Personalized coaching tips
│                                      - JSON response parsing
├── .env.local                      -> Stores VITE_GEMINI_API_KEY
├── ai_context.md                   -> Project documentation (this file)
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 5. Roadmap & Next Steps

- [x] **Phase 1: Foundation**
    - [x] Setup React + Tailwind v3
    - [x] Build Street Fighter UI
    - [x] Fix PostCSS/Tailwind v4 conflict

- [x] **Phase 2: Connection**
    - [x] Integrate Gemini Live WebSocket
    - [x] Solve `1011` Quota error (Billing enabled)
    - [x] Fix `Unexpected token 'o'` Blob error
    - [x] Fix WebSocket `1000` closure (wait for setupComplete)
    - [x] Discover correct API version (v1beta)
    - [x] Discover correct model (gemini-2.5-flash-native-audio-latest)
    - [x] Fix JSON field casing (snake_case → camelCase)
    - [x] Add sample rate to MIME type

- [x] **Phase 3: Stabilization**
    - [x] Replace ScriptProcessorNode with AudioWorkletNode
    - [x] Fix React Strict Mode race conditions
    - [x] Verify two-way audio communication

- [x] **Phase 4: Gameplay Mechanics**
    - [x] Implement health bar system (Confidence vs Patience)
    - [x] Add silence penalty (-3 confidence after 5s)
    - [x] Add voice confidence detection
    - [x] Parse Viper's responses for scoring keywords
    - [x] Implement win condition (Viper patience = 0)
    - [x] Implement lose condition (User confidence = 0)
    - [x] Add win/lose overlay screens

- [x] **Phase 5: Body Language Analysis**
    - [x] Update system prompt for body language awareness
    - [x] Parse Viper's speech for body language keywords
    - [x] Add eye contact indicator
    - [x] Add posture indicator
    - [x] Add expression indicator
    - [x] Apply health bar effects based on body language

- [x] **Phase 6: Session Recording**
    - [x] Implement MediaRecorder for video capture
    - [x] Track key moments with timestamps
    - [x] Generate post-game statistics
    - [x] Add download recording button
    - [x] Display session summary on win/lose

- [x] **Phase 7: Gemini 3 Integration**
    - [x] Create useGeminiAnalysis hook
    - [x] Implement REST API call to gemini-3-flash-preview
    - [x] Add performance scoring (4 categories)
    - [x] Add strengths/weaknesses identification
    - [x] Add tactical breakdown analysis
    - [x] Add personalized coaching tips
    - [x] Display analysis in win/lose overlays
    - [x] Add loading state during analysis

- [ ] **Phase 8: Hackathon Submission**
    - [ ] Record 3-minute demo video
    - [ ] Deploy to Vercel/Netlify (public URL)
    - [ ] Update GitHub README with setup instructions
    - [ ] Take screenshots for submission
    - [ ] Write 200-word Gemini integration description
    - [ ] Submit on Devpost

- [ ] **Phase 9: Polish & Enhancements (Future)**
    - [ ] Add sound effects for health bar changes
    - [ ] Add combo system for consecutive good responses
    - [ ] Implement difficulty levels (Easy/Medium/Hard Viper)
    - [ ] Add leaderboard/score history (localStorage)
    - [ ] Add negotiation tips/coaching during session
    - [ ] Implement "Interrupt Logic" (Stop AI audio when user speaks)
    - [ ] Add multiple negotiation scenarios
    - [ ] Add multiple AI personalities

## 6. Known Issues & Technical Debt

### Resolved Issues ✅
- ~~WebSocket Closure 1000~~ → Fixed by waiting for `setupComplete`
- ~~ScriptProcessorNode deprecation~~ → Replaced with AudioWorkletNode
- ~~TypeScript ArrayBuffer error~~ → Fixed with `ArrayBufferLike` type
- ~~API version mismatch~~ → Changed to v1beta
- ~~Model not found~~ → Using gemini-2.5-flash-native-audio-latest
- ~~React Strict Mode race conditions~~ → Added ref flags
- ~~TEXT response modality error~~ → Using AUDIO only

### Current Limitations ⚠️
- **No Speech-to-Text:** Body language detection relies on keyword parsing from Viper's speech
- **Response Modality:** Gemini 2.5 Live only supports AUDIO output, not TEXT+AUDIO
- **Recording Audio:** Session recording captures user's mic but not Viper's audio output
- **Gemini 3 Live:** Gemini 3 does not support bidiGenerateContent (Live API)

### Technical Debt 📋
- Consider adding error boundary for WebSocket failures
- Add retry logic for failed connections
- Implement proper loading states during connection
- Add unit tests for health bar logic
- Consider extracting game logic into separate hook
- Add error handling for Gemini 3 analysis failures

## 7. API Reference

### Gemini 2.5 Live API (WebSocket)

**Endpoint:**
```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}
```

**Setup Message:**
```typescript
{
  setup: {
    model: "models/gemini-2.5-flash-native-audio-latest",
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Aoede" }
        }
      }
    },
    systemInstruction: { parts: [{ text: "..." }] }
  }
}
```

**Audio Streaming:**
```typescript
{
  realtimeInput: {
    mediaChunks: [{
      data: base64EncodedPCM,
      mimeType: "audio/pcm;rate=16000"
    }]
  }
}
```

**Video Streaming:**
```typescript
{
  realtimeInput: {
    mediaChunks: [{
      data: base64EncodedJPEG,
      mimeType: "image/jpeg"
    }]
  }
}
```

### Gemini 3 REST API (Analysis)

**Endpoint:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={API_KEY}
```

**Request Body:**
```typescript
{
  contents: [{
    parts: [{ text: analysisPrompt }]
  }],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048
  }
}
```

**Analysis Output Structure:**
```typescript
interface AnalysisResult {
  overallAssessment: string;
  strengthsIdentified: string[];
  areasForImprovement: string[];
  tacticalBreakdown: {
    anchoring: string;
    silenceUsage: string;
    bodyLanguage: string;
    vocalConfidence: string;
  };
  personalizedTips: string[];
  nextScenarioRecommendation: string;
  coachingScript: string;
  score: {
    overall: number;      // 0-100
    confidence: number;   // 0-100
    strategy: number;     // 0-100
    composure: number;    // 0-100
  };
}
```

## 8. Game Mechanics Reference

### Health Bar Effects

| Event | Health Effect |
|-------|---------------|
| Silence > 5 seconds | Confidence -3 |
| Speaking confidently | Confidence +1 (5% chance) |
| Viper says "pathetic", "weak", "disappointing" | Confidence -10 |
| Viper says "interesting", "fair point", "not bad" | Patience -8 |
| Viper says "fine", "very well", "stubborn" | Patience -12 |
| Weak eye contact detected | Confidence -5 |
| Strong eye contact detected | Patience -5 |
| Poor posture detected | Confidence -4 |
| Confident posture detected | Patience -4 |
| Nervous behavior detected | Confidence -3 |
| Calm demeanor detected | Patience -3 |
| Default (negotiation continues) | Patience -2 |

### Win/Lose Conditions

| Condition | Trigger | Result |
|-----------|---------|--------|
| Victory | Viper's Patience ≤ 0 | Win overlay + Gemini 3 analysis |
| Defeat | User's Confidence ≤ 0 | Lose overlay + Gemini 3 analysis |
| Abandoned | User ends session early | Session stats saved |

### Body Language Keywords

**Weak Eye Contact (Confidence -5):**
- "look away", "looking away", "avoiding eye", "can't even look"
- "eyes darting", "not looking", "look at me", "eyes down"
- "distracted", "not focused", "wandering eyes"

**Strong Eye Contact (Patience -5):**
- "strong eye contact", "looking right at", "staring me down"
- "eyes locked", "not backing down", "steady gaze", "focused"

**Poor Posture (Confidence -4):**
- "slouching", "slumped", "hunched", "shrinking"
- "cowering", "leaning back", "deflated", "shoulders down"

**Good Posture (Patience -4):**
- "sitting up", "straight back", "confident posture"
- "shoulders back", "leaning forward", "upright"

**Nervous Expression (Confidence -3):**
- "nervous", "fidgeting", "sweating", "shaking"
- "anxious", "uncomfortable", "squirming", "touching face"

**Confident Expression (Patience -3):**
- "calm", "composed", "relaxed", "steady"
- "confident smile", "unfazed", "collected", "poker face"

## 9. Environment Variables

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Required API Access:**
- Generative Language API (enabled in Google Cloud Console)
- Billing enabled on Google Cloud account
- API key with Generative Language API permissions

## 10. Deployment Checklist

- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Deploy to Vercel/Netlify
- [ ] Set environment variable `VITE_GEMINI_API_KEY` in hosting platform
- [ ] Verify HTTPS (required for camera/mic access)
- [ ] Test on deployed URL
- [ ] Verify audio-processor.worklet.js is served correctly