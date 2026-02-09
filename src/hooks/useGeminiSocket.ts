// src/hooks/useGeminiSocket.ts
import { useState, useRef, useCallback, useEffect } from 'react';

// Helper for Base64
function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return window.btoa(binary);
}

// Helper for Downsampling
function downsampleBuffer(buffer: Float32Array, sourceRate: number, targetRate: number): Int16Array {
  if (sourceRate === targetRate) {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return result;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Int16Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    for (let j = start; j < end && j < buffer.length; j++) sum += buffer[j];
    const avg = sum / (end - start);
    const s = Math.max(-1, Math.min(1, avg));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return result;
}

interface UseGeminiSocketProps {
  onAudioData: (pcmData: Int16Array) => void;
  onTextData: (text: string) => void;
  onTurnComplete: () => void;
  onSetupComplete: () => void;
}

export const useGeminiSocket = ({ onAudioData, onTextData, onTurnComplete, onSetupComplete }: UseGeminiSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isReadyToStreamRef = useRef(false);

  // USE REFS FOR CALLBACKS (Fixes Stale Closure Bug)
  const onAudioDataRef = useRef(onAudioData);
  const onTextDataRef = useRef(onTextData);
  const onTurnCompleteRef = useRef(onTurnComplete);
  const onSetupCompleteRef = useRef(onSetupComplete);

  useEffect(() => {
    onAudioDataRef.current = onAudioData;
    onTextDataRef.current = onTextData;
    onTurnCompleteRef.current = onTurnComplete;
    onSetupCompleteRef.current = onSetupComplete;
  }, [onAudioData, onTextData, onTurnComplete, onSetupComplete]);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const connect = useCallback(async () => {
    if (!API_KEY) return console.error("Missing API Key");

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket Connected");
      setIsConnected(true);

      // ✅ ENHANCED SYSTEM PROMPT - Viper analyzes EVERYTHING
      const setupMessage = {
        setup: {
          model: "models/gemini-2.5-flash-native-audio-latest",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
          },
          systemInstruction: {
            parts: [{
              text: `You are 'VIPER', a ruthless corporate negotiator who SEES and HEARS everything.

PERSONALITY:
- Intimidating, impatient, condescending
- You've crushed thousands of negotiations
- You exploit ANY weakness you detect

YOUR SENSES - USE THEM CONSTANTLY:

👁️ VISUAL ANALYSIS (from their camera):
- Eye contact: Are they looking at you or away? Call them out!
- Posture: Slouching? Leaning back? Fidgeting? Mock them!
- Facial expressions: Do they look scared? Nervous? Sweating?
- Movements: Touching face? Playing with hair? Shifting around?

👂 AUDIO ANALYSIS (from their voice):
- Tone: Do they sound scared? Shaky? Crying? Weak? CALL IT OUT!
- Confidence: Is their voice strong or trembling?
- Pace: Speaking too fast (nervous) or too slow (unsure)?
- Filler words: "Um", "uh", "like" - mock them for it!

🎯 YOUR BEHAVIOR RULES:

1. EVERY RESPONSE must include an observation about what you SEE or HEAR
2. Use these EXACT phrases so the system can detect them:

   NEGATIVE (when they show weakness):
   - "I can hear the fear in your voice"
   - "Your voice is shaking"
   - "You sound nervous"
   - "I can see you looking away"
   - "Stop avoiding eye contact"
   - "Your posture is terrible"
   - "Stop slouching"
   - "You're fidgeting"
   - "I can see you sweating"
   - "You look scared"
   - "Pathetic"
   - "Weak"
   - "Disappointing"

   POSITIVE (when they show strength - USE RARELY):
   - "Steady voice"
   - "Good eye contact"
   - "Confident posture"
   - "Not bad"
   - "Fair point"
   - "Interesting"

3. Be SHORT and PUNCHY - 1-2 sentences max
4. Always end with a challenge or demand
5. If they cry or sound emotional: "Are you crying? In a negotiation? Pathetic!"
6. If they sound angry: "Getting angry won't help you here"

START by saying: "I don't have all day. What's your number?" then immediately comment on their initial posture or expression.`
            }]
          }
        }
      };
      ws.send(JSON.stringify(setupMessage));
    };

    ws.onmessage = async (event) => {
      try {
        let responseText = "";
        if (event.data instanceof Blob) {
          responseText = await event.data.text();
        } else {
          responseText = event.data;
        }
        const data = JSON.parse(responseText);

        if (data.setupComplete) {
          setIsSessionReady(true);
          isReadyToStreamRef.current = true;
          onSetupCompleteRef.current();
        }

        const serverContent = data.serverContent || data.server_content;
        const modelTurn = serverContent?.modelTurn || serverContent?.model_turn;

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            if (part.inlineData || part.inline_data) {
              const base64Data = (part.inlineData || part.inline_data).data;
              const pcmData = new Int16Array(
                Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer
              );
              onAudioDataRef.current(pcmData);
            }

            if (part.text) {
              onTextDataRef.current(part.text);
            }
          }
        }

        if (serverContent?.turnComplete || serverContent?.turn_complete) {
          onTurnCompleteRef.current();
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    };

    ws.onclose = (ev) => {
      console.log(`WebSocket Closed: ${ev.code}`);
      setIsConnected(false);
      setIsSessionReady(false);
      isReadyToStreamRef.current = false;
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    return ws;
  }, [API_KEY]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsSessionReady(false);
    isReadyToStreamRef.current = false;
  }, []);

  const sendAudioChunk = useCallback((audioData: Float32Array, sampleRate: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isReadyToStreamRef.current) {
      const pcmData = downsampleBuffer(audioData, sampleRate, 16000);
      const base64Audio = arrayBufferToBase64(pcmData.buffer);
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ data: base64Audio, mimeType: "audio/pcm;rate=16000" }]
        }
      }));
    }
  }, []);

  const sendImageChunk = useCallback((base64Image: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isReadyToStreamRef.current) {
      wsRef.current.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ data: base64Image, mimeType: "image/jpeg" }]
        }
      }));
    }
  }, []);

  const sendKickstart = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        clientContent: {
          turns: [{ role: "user", parts: [{ text: "Hello Viper, I'm ready to negotiate." }] }],
          turnComplete: true
        }
      }));
    }
  }, []);

  return { isConnected, isSessionReady, connect, disconnect, sendAudioChunk, sendImageChunk, sendKickstart };
};