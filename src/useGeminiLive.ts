import { useState, useEffect, useRef, useCallback } from 'react';

// Helper: Convert audio buffer to base64 for Gemini API
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const useGeminiLive = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const stopNegotiation = useCallback(() => {
    setIsConnected(false);
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const startNegotiation = useCallback(async () => {
    if (!API_KEY) {
      console.error("Missing API Key in .env.local");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
        video: { width: 512, height: 512 }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolumeLevel(Math.sqrt(sum / inputData.length) * 100);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          const base64Audio = arrayBufferToBase64(pcmData.buffer);
          wsRef.current.send(JSON.stringify({
            realtime_input: { media_chunks: [{ data: base64Audio, mime_type: 'audio/pcm' }] }
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("Sending Setup Message...");

        const setupMessage = {
          setup: {
            // FIX: Use the currently stable Live API model
            model: "models/gemini-2.0-flash-exp",

            generation_config: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } }
              }
            },
            system_instruction: {
              parts: [
                {
                  text: `You are 'Viper', a high-stakes corporate negotiator. Your goal is to intimidate the user into accepting a lowball salary offer.
                  CRITICAL VISUAL & AUDIO INSTRUCTIONS:
                  1. Read Body Language: If the user looks down, touches their face, or fidgets, COMMENT ON IT.
                  2. Listen to Tone: If the user stutters, interrupt them.
                  3. Gameplay: Start by offering $60,000. Only concede if the user maintains eye contact and refuses 3 times.
                  Your output must be Audio. Keep responses short (under 10 seconds).`
                }
              ]
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));

        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');

        intervalRef.current = window.setInterval(() => {
          if (ctx && videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, 512, 512);
            const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                realtime_input: { media_chunks: [{ data: base64, mime_type: 'image/jpeg' }] }
              }));
            }
          }
        }, 1000);
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.server_content?.model_turn?.parts) {
          setIsSpeaking(true);
          const parts = data.server_content.model_turn.parts;
          for (const part of parts) {
            if (part.inline_data) {
                const pcmData = new Int16Array(
                    Uint8Array.from(atob(part.inline_data.data), c => c.charCodeAt(0)).buffer
                );
                const buffer = audioContext.createBuffer(1, pcmData.length, 24000);
                buffer.getChannelData(0).set(new Float32Array(pcmData).map(v => v / 32768));
                const playSource = audioContext.createBufferSource();
                playSource.buffer = buffer;
                playSource.connect(audioContext.destination);
                playSource.start();
            }
          }
          setTimeout(() => setIsSpeaking(false), 2000);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket Closed!", event.code, event.reason); // <--- This will tell us the error
        setIsConnected(false);
        stopNegotiation();
      };
    } catch (error) {
      console.error("Connection failed", error);
    }
  }, [API_KEY, stopNegotiation]); // Added stopNegotiation to deps

  // CLEANUP HOOK (Fixes the linter error)
  useEffect(() => {
    return () => {
      stopNegotiation();
    };
  }, [stopNegotiation]);

  return { isConnected, volumeLevel, isSpeaking, startNegotiation, stopNegotiation, videoRef };
};