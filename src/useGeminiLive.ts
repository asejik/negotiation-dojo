import { useState, useEffect, useRef, useCallback } from 'react';

// FIX 1: Use 'ArrayBufferLike' to solve the TypeScript error
function arrayBufferToBase64(buffer: ArrayBufferLike) {
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
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const nextStartTimeRef = useRef<number>(0);
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const stopNegotiation = useCallback(() => {
    setIsConnected(false);
    setIsSpeaking(false);
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    processorRef.current?.disconnect();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const playTestSound = (ctx: AudioContext) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    gain.gain.value = 0.05;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  };

  const startNegotiation = useCallback(async () => {
    if (!API_KEY) return console.error("Missing API Key");

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      nextStartTimeRef.current = audioContext.currentTime;

      const mainGain = audioContext.createGain();
      mainGain.gain.value = 5.0;
      mainGain.connect(audioContext.destination);
      gainNodeRef.current = mainGain;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      playTestSound(audioContext);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 512, height: 512 }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        setVolumeLevel(Math.sqrt(sum / inputData.length) * 100);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const pcmData = downsampleBuffer(inputData, audioContext.sampleRate, 16000);
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
        console.log("Connected to Gemini");

        // 1. SETUP
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generation_config: {
              response_modalities: ["AUDIO"],
              speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } }
            },
            system_instruction: {
              parts: [{
                text: `You are 'Viper', a negotiator.
                Task: Intimidate the user.
                IMMEDIATE ACTION: As soon as you see the first message, say "I don't have all day. What's your offer?"
                Output Audio only.`
              }]
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));

        // 2. KICKSTART (Text based - safer)
        setTimeout(() => {
             console.log("Sending Text Kickstart...");
             const kickstartMessage = {
                 client_content: {
                     turns: [{
                         role: "user",
                         parts: [{ text: "Hello Viper, I am ready." }]
                     }],
                     turn_complete: true
                 }
             };
             ws.send(JSON.stringify(kickstartMessage));
        }, 1000); // 1 second delay to be safe

        // Video Loop
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        intervalRef.current = window.setInterval(() => {
          if (ctx && videoRef.current && ws.readyState === WebSocket.OPEN) {
            ctx.drawImage(videoRef.current, 0, 0, 512, 512);
            const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
            ws.send(JSON.stringify({ realtime_input: { media_chunks: [{ data: base64, mime_type: 'image/jpeg' }] } }));
          }
        }, 1000);
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
            if (data.server_content?.model_turn?.parts) {
                for (const part of data.server_content.model_turn.parts) {
                    if (part.inline_data) {
                        setIsSpeaking(true);
                        const pcmData = new Int16Array(
                            Uint8Array.from(atob(part.inline_data.data), c => c.charCodeAt(0)).buffer
                        );
                        scheduleAudioChunk(pcmData, 24000);
                    }
                }
                setTimeout(() => setIsSpeaking(false), 2000);
            }
        } catch (e) {
            console.error("Parse Error", e);
        }
      };

      ws.onclose = (ev) => {
        console.log("WebSocket Closed", ev.code, ev.reason);
        setIsConnected(false);
      };

    } catch (error) {
      console.error("Start Error", error);
    }
  }, [API_KEY]);

  const scheduleAudioChunk = (pcmData: Int16Array, sampleRate: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;

    const buffer = ctx.createBuffer(1, pcmData.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNodeRef.current);

    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  useEffect(() => {
    return () => stopNegotiation();
  }, [stopNegotiation]);

  return { isConnected, volumeLevel, isSpeaking, startNegotiation, stopNegotiation, videoRef };
};

// HELPER: Downsample
function downsampleBuffer(buffer: Float32Array, sourceRate: number, targetRate: number): Int16Array {
  if (sourceRate === targetRate) {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = Math.max(-32768, Math.min(32767, buffer[i] * 32768));
    }
    return result;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]; count++;
    }
    result[offsetResult] = Math.max(-32768, Math.min(32767, (accum / count) * 32768));
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}