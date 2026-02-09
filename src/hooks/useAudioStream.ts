// src/hooks/useAudioStream.ts
import { useState, useRef, useCallback } from 'react';

export const useAudioStream = () => {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Track average volume for confidence analysis
  const averageVolumeRef = useRef<number[]>([]);
  const lastSpeakTimeRef = useRef<number>(Date.now());

  const initializeAudio = useCallback(async () => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    nextStartTimeRef.current = audioContext.currentTime;

    const mainGain = audioContext.createGain();
    mainGain.gain.value = 5.0; // Boost volume
    mainGain.connect(audioContext.destination);
    gainNodeRef.current = mainGain;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Play Test Sound
    const osc = audioContext.createOscillator();
    const testGain = audioContext.createGain();
    osc.connect(testGain);
    testGain.connect(audioContext.destination);
    osc.frequency.value = 600;
    testGain.gain.value = 0.05;
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);

    // Get Media Stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: { width: 512, height: 512 }
    });

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // Load AudioWorklet
    try {
      await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
      workletNodeRef.current = workletNode;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      // Note: We don't connect worklet to destination to avoid self-echo
    } catch (e) {
      console.error("AudioWorklet setup failed:", e);
    }

    return { audioContext, stream, workletNode: workletNodeRef.current };
  }, []);

  const playAudioChunk = useCallback((pcmData: Int16Array, sampleRate: number) => {
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
  }, []);

  const cleanupAudio = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    workletNodeRef.current?.disconnect();

    streamRef.current = null;
    audioContextRef.current = null;
    workletNodeRef.current = null;
  }, []);

  return {
    volumeLevel,
    setVolumeLevel,
    videoRef,
    streamRef,
    audioContextRef,
    workletNodeRef,
    averageVolumeRef,
    lastSpeakTimeRef,
    initializeAudio,
    cleanupAudio,
    playAudioChunk
  };
};