# 🥋 Negotiation Dojo
> **Master the art of high-stakes salary negotiation with "Viper"—a ruthless AI trainer.**

![React](https://img.shields.io/badge/React-18-blue)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Live-magenta)
![Gemini](https://img.shields.io/badge/Gemini-3_Flash-purple)
![Vite](https://img.shields.io/badge/Vite-Fast-yellow)

## 💡 The Problem
Salary negotiation is terrifying. Most people lose thousands of dollars in lifetime earnings simply because they are afraid to ask, or they crumble under pressure. Reading articles isn't enough—you need **combat training**.

## 🚀 The Solution: Negotiation Dojo
Negotiation Dojo is an immersive, real-time "Boss Battle" simulator. You face **Viper**, an AI persona programmed to be intimidating, impatient, and dismissive.

Unlike standard chatbots, Viper is powered by **Google's Multimodal Live API**. He doesn't just read your text; he **hears the tremor in your voice** and (via simulation) judges your confidence levels in real-time.



## ✨ Key Features

### 🎙️ Real-Time "Vibe" Analysis
* **Live Audio Streaming:** Uses `AudioWorklet` for low-latency, 16kHz PCM audio processing.
* **Confidence vs. Patience:** A fighting-game style health system.
    * **Your Health (Confidence):** Drops if you stay silent too long (>8s), stutter, or get insulted.
    * **Enemy Health (Patience):** Drops only when you speak clearly, hold your ground, and make strong counter-offers.

### 🧠 Dual-AI Architecture
* **The Opponent (Gemini 2.5 Live):** Optimized for speed (`gemini-2.5-flash-native-audio-latest`). Handles the real-time conversation, voice synthesis, and game logic triggers.
* **The Coach (Gemini 3 Flash):** Optimized for reasoning. After the session, this model analyzes the entire transcript to provide a tactical breakdown, spotting weak anchors and missed opportunities.

### 📹 Full Session Recording
* Automatically records your video and audio during the battle.
* Downloads a `.webm` file upon victory or defeat for self-review.

## 🛠️ Tech Stack

* **Frontend:** React 18 (TypeScript) + Vite
* **Styling:** Tailwind CSS v3.4 (Glassmorphism UI)
* **AI Real-time:** Google Gemini Multimodal Live WebSocket API
* **AI Analysis:** Google Gemini 3 Flash REST API
* **Audio Engine:** Native Web Audio API (`AudioContext`, `AudioWorklet`, `MediaStream`)
* **State Management:** Custom React Hooks (Composer Pattern)

## ⚙️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/negotiation-dojo.git](https://github.com/yourusername/negotiation-dojo.git)
    cd negotiation-dojo
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_google_api_key_here
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 🎮 How to Play
1.  **Enter the Dojo:** Click "Start Negotiation".
2.  **Survive Viper:** He will start with a lowball offer. Do not accept it.
3.  **Speak Up:** If you stay silent for more than 8 seconds, you lose Confidence.
4.  **Win:** Wear down Viper's "Patience" bar to 0% by maintaining a strong frame.
5.  **Review:** Get a detailed coaching report from Gemini 3 at the end.

## 🏗️ Architecture Highlight
This project moves away from "Spaghetti Code" by using a **Composer Hook** pattern:
* `useGeminiLive.ts`: The conductor that orchestrates the app.
* `useGeminiSocket.ts`: Manages the fragile WebSocket connection and "Stale Closure" prevention using Refs.
* `useGameLogic.ts`: Pure business logic for the Health Bar system.
* `useAudioStream.ts`: Handles the raw PCM audio conversions (Float32 -> Int16).

## 🏆 Hackathon Notes
* **Challenge:** The biggest technical hurdle was handling the `1000 Normal Closure` and `1007` errors from the experimental Live API.
* **Solution:** We implemented a strict "Gatekeeper" logic that prevents audio streaming until the `setupComplete` signal is received from Google, and utilized `AudioWorklet` to prevent main-thread blocking.

## 📄 License
MIT License. Built for the Google Gemini Developer Competition.