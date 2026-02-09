// src/useGeminiLive.ts

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

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
    for (let j = start; j < end && j < buffer.length; j++) {
      sum += buffer[j];
    }
    const avg = sum / (end - start);
    const s = Math.max(-1, Math.min(1, avg));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  return result;
}

// ============================================
// TYPES
// ============================================

export interface BodyLanguageState {
  eyeContact: 'strong' | 'weak' | 'none' | 'unknown';
  posture: 'confident' | 'nervous' | 'slouching' | 'unknown';
  expression: 'calm' | 'nervous' | 'confident' | 'fearful' | 'unknown';
  lastObservation: string;
  isAnalyzing: boolean;
}

export interface HealthBarState {
  userConfidence: number;
  viperPatience: number;
  lastUserAction: string;
  lastViperReaction: string;
  roundNumber: number;
  gameStatus: 'idle' | 'active' | 'won' | 'lost';
}

export interface KeyMoment {
  timestamp: number;
  type: 'confidence_drop' | 'confidence_boost' | 'patience_drop' | 'body_language' | 'round_start';
  description: string;
  healthSnapshot: {
    confidence: number;
    patience: number;
  };
}

export interface SessionStats {
  totalDuration: number;
  totalRounds: number;
  startingConfidence: number;
  endingConfidence: number;
  startingPatience: number;
  endingPatience: number;
  biggestConfidenceDrop: number;
  biggestPatienceDrop: number;
  keyMoments: KeyMoment[];
  outcome: 'won' | 'lost' | 'abandoned';
}

export interface RecordingState {
  isRecording: boolean;
  recordingDuration: number;
  recordingBlob: Blob | null;
  recordingUrl: string | null;
  sessionStats: SessionStats | null;
}

// ============================================
// MAIN HOOK
// ============================================

export const useGeminiLive = () => {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Health Bar State
  const [healthBars, setHealthBars] = useState<HealthBarState>({
    userConfidence: 100,
    viperPatience: 100,
    lastUserAction: '',
    lastViperReaction: '',
    roundNumber: 0,
    gameStatus: 'idle'
  });

  // Body Language State
  const [bodyLanguage, setBodyLanguage] = useState<BodyLanguageState>({
    eyeContact: 'unknown',
    posture: 'unknown',
    expression: 'unknown',
    lastObservation: '',
    isAnalyzing: false
  });

  // Recording State
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    recordingDuration: 0,
    recordingBlob: null,
    recordingUrl: null,
    sessionStats: null
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isReadyToStreamRef = useRef<boolean>(false);

  // Silence tracking refs
  const lastSpeakTimeRef = useRef<number>(Date.now());
  const silenceCheckIntervalRef = useRef<number | null>(null);
  const averageVolumeRef = useRef<number[]>([]);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<number | null>(null);
  const keyMomentsRef = useRef<KeyMoment[]>([]);
  const biggestConfidenceDropRef = useRef<number>(0);
  const biggestPatienceDropRef = useRef<number>(0);

  // 🔧 FIX: Add flag to prevent race conditions
  const isStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);

  // 🔧 FIX: Use refs to access latest state in callbacks without dependencies
  const healthBarsRef = useRef(healthBars);
  const recordingRef = useRef(recording);

  // Keep refs in sync with state
  useEffect(() => {
    healthBarsRef.current = healthBars;
  }, [healthBars]);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // ============================================
  // RECORDING FUNCTIONS
  // ============================================

  const addKeyMoment = useCallback((
    type: KeyMoment['type'],
    description: string,
    confidence: number,
    patience: number
  ) => {
    const moment: KeyMoment = {
      timestamp: Date.now() - recordingStartTimeRef.current,
      type,
      description,
      healthSnapshot: { confidence, patience }
    };
    keyMomentsRef.current.push(moment);
    console.log(`📍 Key moment: ${description}`);
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) {
      console.error("❌ No stream available for recording");
      return;
    }

    try {
      const recordingStream = new MediaStream();
      stream.getVideoTracks().forEach(track => recordingStream.addTrack(track));
      stream.getAudioTracks().forEach(track => recordingStream.addTrack(track));

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let mediaRecorder: MediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(recordingStream, options);
      } catch {
        mediaRecorder = new MediaRecorder(recordingStream);
      }

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      keyMomentsRef.current = [];
      biggestConfidenceDropRef.current = 0;
      biggestPatienceDropRef.current = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("🎥 Recording stopped, processing...");
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        setRecording(prev => ({
          ...prev,
          isRecording: false,
          recordingBlob: blob,
          recordingUrl: url
        }));
      };

      mediaRecorder.start(1000);
      recordingStartTimeRef.current = Date.now();

      recordingIntervalRef.current = window.setInterval(() => {
        setRecording(prev => ({
          ...prev,
          recordingDuration: Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        }));
      }, 1000);

      setRecording(prev => ({
        ...prev,
        isRecording: true,
        recordingDuration: 0,
        recordingBlob: null,
        recordingUrl: null,
        sessionStats: null
      }));

      addKeyMoment('round_start', 'Negotiation started', 100, 100);
      console.log("🎥 Recording started");

    } catch (error) {
      console.error("❌ Failed to start recording:", error);
    }
  }, [addKeyMoment]);

  const stopRecording = useCallback((outcome: 'won' | 'lost' | 'abandoned') => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const currentHealthBars = healthBarsRef.current;

    const stats: SessionStats = {
      totalDuration: Math.floor((Date.now() - recordingStartTimeRef.current) / 1000),
      totalRounds: currentHealthBars.roundNumber,
      startingConfidence: 100,
      endingConfidence: currentHealthBars.userConfidence,
      startingPatience: 100,
      endingPatience: currentHealthBars.viperPatience,
      biggestConfidenceDrop: biggestConfidenceDropRef.current,
      biggestPatienceDrop: biggestPatienceDropRef.current,
      keyMoments: [...keyMomentsRef.current],
      outcome
    };

    setRecording(prev => ({
      ...prev,
      sessionStats: stats
    }));

    console.log("📊 Session stats generated:", stats);
  }, []);

  const downloadRecording = useCallback(() => {
    const currentRecording = recordingRef.current;
    if (!currentRecording.recordingUrl) return;

    const a = document.createElement('a');
    a.href = currentRecording.recordingUrl;
    a.download = `negotiation-dojo-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("💾 Recording downloaded");
  }, []);

  const clearRecording = useCallback(() => {
    const currentRecording = recordingRef.current;
    if (currentRecording.recordingUrl) {
      URL.revokeObjectURL(currentRecording.recordingUrl);
    }
    setRecording({
      isRecording: false,
      recordingDuration: 0,
      recordingBlob: null,
      recordingUrl: null,
      sessionStats: null
    });
    keyMomentsRef.current = [];
  }, []);

  // ============================================
  // HEALTH BAR MODIFIERS
  // ============================================

  const modifyUserConfidence = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newConfidence = Math.max(0, Math.min(100, prev.userConfidence + amount));
      const newStatus = newConfidence <= 0 ? 'lost' : prev.gameStatus;

      console.log(`💚 Confidence ${amount >= 0 ? '+' : ''}${amount}: ${reason} (${newConfidence}%)`);

      if (amount <= -5) {
        addKeyMoment('confidence_drop', reason, newConfidence, prev.viperPatience);
        if (Math.abs(amount) > biggestConfidenceDropRef.current) {
          biggestConfidenceDropRef.current = Math.abs(amount);
        }
      } else if (amount >= 3) {
        addKeyMoment('confidence_boost', reason, newConfidence, prev.viperPatience);
      }

      return {
        ...prev,
        userConfidence: newConfidence,
        lastUserAction: reason,
        gameStatus: newStatus
      };
    });
  }, [addKeyMoment]);

  const modifyViperPatience = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newPatience = Math.max(0, Math.min(100, prev.viperPatience + amount));
      const newStatus = newPatience <= 0 ? 'won' : prev.gameStatus;

      console.log(`❤️ Viper Patience ${amount >= 0 ? '+' : ''}${amount}: ${reason} (${newPatience}%)`);

      if (amount <= -8) {
        addKeyMoment('patience_drop', reason, prev.userConfidence, newPatience);
        if (Math.abs(amount) > biggestPatienceDropRef.current) {
          biggestPatienceDropRef.current = Math.abs(amount);
        }
      }

      return {
        ...prev,
        viperPatience: newPatience,
        lastViperReaction: reason,
        gameStatus: newStatus
      };
    });
  }, [addKeyMoment]);

  const incrementRound = useCallback(() => {
    setHealthBars(prev => {
      const newRound = prev.roundNumber + 1;

      if (newRound > 1 && newRound % 3 === 0) {
        addKeyMoment('round_start', `Round ${newRound} started`, prev.userConfidence, prev.viperPatience);
      }

      return {
        ...prev,
        roundNumber: newRound
      };
    });
  }, [addKeyMoment]);

  // ============================================
  // BODY LANGUAGE ANALYSIS
  // ============================================

  const parseBodyLanguageFromText = useCallback((text: string) => {
    const lowerText = text.toLowerCase();

    setBodyLanguage(prev => ({ ...prev, isAnalyzing: true }));

    const weakEyeContactPhrases = [
      'look away', 'looking away', 'avoiding eye', 'can\'t even look',
      'eyes darting', 'not looking', 'look at me', 'eyes down',
      'staring at the floor', 'look up', 'where are you looking',
      'distracted', 'not focused', 'wandering eyes'
    ];

    const strongEyeContactPhrases = [
      'strong eye contact', 'looking right at', 'staring me down',
      'eyes locked', 'not backing down', 'steady gaze', 'focused',
      'looking confident', 'direct eye'
    ];

    for (const phrase of weakEyeContactPhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          eyeContact: 'weak',
          lastObservation: `Eye contact issue: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyUserConfidence(-5, `Weak eye contact detected`);
        return;
      }
    }

    for (const phrase of strongEyeContactPhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          eyeContact: 'strong',
          lastObservation: `Strong eye contact: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyViperPatience(-5, `Your eye contact is intimidating`);
        return;
      }
    }

    const badPosturePhrases = [
      'slouching', 'slumped', 'hunched', 'shrinking',
      'small', 'curled up', 'cowering', 'leaning back',
      'sinking', 'deflated', 'shoulders down', 'caved in'
    ];

    const goodPosturePhrases = [
      'sitting up', 'straight back', 'confident posture',
      'shoulders back', 'standing tall', 'leaning forward',
      'engaged', 'upright', 'commanding presence', 'strong stance'
    ];

    for (const phrase of badPosturePhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          posture: 'slouching',
          lastObservation: `Poor posture: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyUserConfidence(-4, `Poor posture detected`);
        return;
      }
    }

    for (const phrase of goodPosturePhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          posture: 'confident',
          lastObservation: `Confident posture: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyViperPatience(-4, `Your posture shows confidence`);
        return;
      }
    }

    const nervousPhrases = [
      'nervous', 'fidgeting', 'sweating', 'shaking',
      'trembling', 'anxious', 'worried', 'scared',
      'uncomfortable', 'squirming', 'twitching', 'biting',
      'playing with', 'touching face', 'rubbing', 'scratching'
    ];

    const confidentPhrases = [
      'calm', 'composed', 'relaxed', 'steady',
      'confident smile', 'smirking', 'unfazed', 'cool',
      'collected', 'poker face', 'stone cold', 'unshaken'
    ];

    for (const phrase of nervousPhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          expression: 'nervous',
          lastObservation: `Nervousness detected: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyUserConfidence(-3, `Nervous behavior detected`);
        return;
      }
    }

    for (const phrase of confidentPhrases) {
      if (lowerText.includes(phrase)) {
        setBodyLanguage(prev => ({
          ...prev,
          expression: 'confident',
          lastObservation: `Confident demeanor: "${phrase}"`,
          isAnalyzing: false
        }));
        modifyViperPatience(-3, `Your calm demeanor is unnerving`);
        return;
      }
    }

    setBodyLanguage(prev => ({ ...prev, isAnalyzing: false }));

  }, [modifyUserConfidence, modifyViperPatience]);

  // ============================================
  // VOICE ANALYSIS
  // ============================================

  const analyzeVoiceConfidence = useCallback((volume: number) => {
    averageVolumeRef.current.push(volume);
    if (averageVolumeRef.current.length > 50) {
      averageVolumeRef.current.shift();
    }

    if (volume > 2) {
      lastSpeakTimeRef.current = Date.now();

      if (volume > 5) {
        if (Math.random() < 0.05) {
          modifyUserConfidence(1, "Speaking confidently");
        }
      }
    }
  }, [modifyUserConfidence]);

  // ============================================
  // PARSE VIPER'S RESPONSE
  // ============================================

  const parseViperResponse = useCallback((transcript: string) => {
    const lowerText = transcript.toLowerCase();

    parseBodyLanguageFromText(transcript);

    const impressedPhrases = [
      'interesting', 'fair point', 'not bad', 'impressive',
      'you drive a hard bargain', 'respect that', 'good answer',
      'touché', 'well played'
    ];

    const dismissivePhrases = [
      'pathetic', 'weak', 'disappointing', 'is that all',
      'you can do better', 'seriously?', 'laughable',
      'wasting my time', 'unprepared', 'amateur'
    ];

    const frustratedPhrases = [
      'fine', 'alright', 'very well', 'you win this round',
      'i suppose', 'acceptable', 'let me think',
      'you\'re persistent', 'stubborn'
    ];

    for (const phrase of impressedPhrases) {
      if (lowerText.includes(phrase)) {
        modifyViperPatience(-8, `Viper is impressed: "${phrase}"`);
        return;
      }
    }

    for (const phrase of frustratedPhrases) {
      if (lowerText.includes(phrase)) {
        modifyViperPatience(-12, `Viper is frustrated: "${phrase}"`);
        return;
      }
    }

    for (const phrase of dismissivePhrases) {
      if (lowerText.includes(phrase)) {
        modifyUserConfidence(-10, `Viper mocked you: "${phrase}"`);
        return;
      }
    }

    modifyViperPatience(-2, "Negotiation continues...");

  }, [modifyUserConfidence, modifyViperPatience, parseBodyLanguageFromText]);

  // ============================================
  // SILENCE CHECKER
  // ============================================

  const startSilenceChecker = useCallback(() => {
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
    }

    silenceCheckIntervalRef.current = window.setInterval(() => {
      if (!isReadyToStreamRef.current) return;

      const silenceDuration = Date.now() - lastSpeakTimeRef.current;

      if (silenceDuration > 5000) {
        modifyUserConfidence(-3, "Awkward silence - speak up!");
        lastSpeakTimeRef.current = Date.now();
      }
    }, 3000);
  }, [modifyUserConfidence]);

  const stopSilenceChecker = useCallback(() => {
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // CLEANUP HELPER (No dependencies)
  // ============================================

  const cleanupResources = useCallback(() => {
    isReadyToStreamRef.current = false;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // STOP NEGOTIATION
  // ============================================

  const stopNegotiation = useCallback(() => {
    // 🔧 FIX: Prevent multiple stops
    if (isStoppingRef.current) {
      return;
    }
    isStoppingRef.current = true;
    isStartingRef.current = false;

    console.log("🛑 Stopping negotiation...");

    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const currentHealthBars = healthBarsRef.current;
      const outcome = currentHealthBars.gameStatus === 'won' ? 'won'
        : currentHealthBars.gameStatus === 'lost' ? 'lost'
        : 'abandoned';
      stopRecording(outcome);
    }

    cleanupResources();

    setIsConnected(false);
    setIsSessionReady(false);
    setIsSpeaking(false);

    // Reset flag after a short delay
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  }, [cleanupResources, stopRecording]);

  // ============================================
  // RESET GAME
  // ============================================

  const resetGame = useCallback(() => {
    setHealthBars({
      userConfidence: 100,
      viperPatience: 100,
      lastUserAction: '',
      lastViperReaction: '',
      roundNumber: 0,
      gameStatus: 'idle'
    });
    setBodyLanguage({
      eyeContact: 'unknown',
      posture: 'unknown',
      expression: 'unknown',
      lastObservation: '',
      isAnalyzing: false
    });
    clearRecording();
    averageVolumeRef.current = [];
    lastSpeakTimeRef.current = Date.now();
  }, [clearRecording]);

  // ============================================
  // PLAY TEST SOUND
  // ============================================

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

  // ============================================
  // SCHEDULE AUDIO PLAYBACK
  // ============================================

  const scheduleAudioChunk = useCallback((pcmData: Int16Array, sampleRate: number) => {
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

  // ============================================
  // START MEDIA STREAMING
  // ============================================

  const startMediaStreaming = useCallback(async () => {
    console.log("🎤 Starting media streaming with AudioWorklet...");

    const audioContext = audioContextRef.current;
    const stream = streamRef.current;
    const ws = wsRef.current;

    if (!audioContext || !stream || !ws) {
      console.error("❌ Missing dependencies for streaming");
      return;
    }

    try {
      await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');
      console.log("✅ AudioWorklet module loaded");

      const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        const { type, audioData, volumeLevel: vol } = event.data;

        if (type === 'audio') {
          setVolumeLevel(vol);
          analyzeVoiceConfidence(vol);

          if (isReadyToStreamRef.current && ws.readyState === WebSocket.OPEN) {
            const pcmData = downsampleBuffer(audioData, audioContext.sampleRate, 16000);
            const base64Audio = arrayBufferToBase64(pcmData.buffer);

            ws.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  data: base64Audio,
                  mimeType: "audio/pcm;rate=16000"
                }]
              }
            }));
          }
        }
      };

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);

      console.log("✅ AudioWorklet pipeline connected");

      // Video capture loop
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      intervalRef.current = window.setInterval(() => {
        if (isReadyToStreamRef.current && ctx && videoRef.current && ws.readyState === WebSocket.OPEN) {
          ctx.drawImage(videoRef.current, 0, 0, 512, 512);
          const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                data: base64,
                mimeType: "image/jpeg"
              }]
            }
          }));
        }
      }, 1000);

      console.log("✅ Media streaming initialized (waiting for session ready)");

    } catch (error) {
      console.error("❌ Failed to setup AudioWorklet:", error);
      console.warn("💡 Make sure 'audio-processor.worklet.js' exists in your /public folder");
    }
  }, [analyzeVoiceConfidence]);

  // ============================================
  // START NEGOTIATION
  // ============================================

  const startNegotiation = useCallback(async () => {
    // 🔧 FIX: Prevent multiple starts
    if (isStartingRef.current || isStoppingRef.current) {
      console.log("⏳ Already starting or stopping, ignoring...");
      return;
    }
    isStartingRef.current = true;

    if (!API_KEY) {
      console.error("❌ Missing API Key");
      isStartingRef.current = false;
      return;
    }

    console.log("🥋 Starting Negotiation Dojo...");

    // Reset state first
    setHealthBars({
      userConfidence: 100,
      viperPatience: 100,
      lastUserAction: '',
      lastViperReaction: '',
      roundNumber: 0,
      gameStatus: 'active'
    });
    setBodyLanguage({
      eyeContact: 'unknown',
      posture: 'unknown',
      expression: 'unknown',
      lastObservation: '',
      isAnalyzing: false
    });

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
      console.log("✅ [1/4] AudioContext ready");

      // 🔧 FIX: Check if we should continue
      if (!isStartingRef.current) {
        console.log("⏹️ Start cancelled");
        cleanupResources();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: 512,
          height: 512
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      console.log("✅ [2/4] Media stream acquired");

      // 🔧 FIX: Check again if we should continue
      if (!isStartingRef.current) {
        console.log("⏹️ Start cancelled after media");
        cleanupResources();
        return;
      }

      // Start recording
      startRecording();

      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        // 🔧 FIX: Check if we should continue
        if (!isStartingRef.current) {
          console.log("⏹️ Start cancelled at WebSocket open");
          ws.close();
          return;
        }

        console.log("✅ [3/4] WebSocket connected");
        setIsConnected(true);

        const setupMessage = {
          setup: {
            model: "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede"
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{
                text: `You are 'VIPER', a ruthless corporate negotiator in a salary negotiation training simulation.

PERSONALITY:
- Intimidating, impatient, and condescending
- You've crushed thousands of negotiations
- You smell weakness and exploit it
- But you RESPECT strength and persistence

YOUR TACTICS:
- Start with lowball offers
- Use silence as a weapon
- Challenge every number they give
- Mock weak responses with phrases like "pathetic", "disappointing", "is that all?"
- When impressed, grudgingly admit it: "not bad", "fair point", "interesting"
- When frustrated by their persistence: "fine", "very well", "you're stubborn"

BODY LANGUAGE ANALYSIS:
You can SEE the candidate through their camera. Comment on their body language regularly:

NEGATIVE (call them out):
- Looking away: "Look at me when I'm talking to you!"
- Nervous/fidgeting: "Stop fidgeting, you're making me nervous"
- Slouching: "Sit up straight, this isn't a therapy session"

POSITIVE (acknowledge grudgingly):
- Eye contact: "At least you can look me in the eye"
- Confident posture: "Good posture, but that won't save you"
- Calm demeanor: "You're calm, I'll give you that"

RULES:
1. Comment on body language every 2-3 responses
2. Keep responses SHORT (1-2 sentences)
3. Never break character
4. SPEAK all observations

START by saying: "I don't have all day. What's your number?"`
              }]
            }
          }
        };

        console.log("📤 Sending setup message...");
        ws.send(JSON.stringify(setupMessage));

        await startMediaStreaming();
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
          console.log("📥 Received:", Object.keys(data));

          if (data.setupComplete) {
            console.log("✅ [4/4] Setup complete - Session is LIVE!");
            setIsSessionReady(true);
            isReadyToStreamRef.current = true;
            isStartingRef.current = false; // 🔧 FIX: Mark starting complete

            startSilenceChecker();
            lastSpeakTimeRef.current = Date.now();

            setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log("📤 Sending kickstart...");
                const kickstart = {
                  clientContent: {
                    turns: [{
                      role: "user",
                      parts: [{ text: "Hello Viper, I'm here to negotiate my salary." }]
                    }],
                    turnComplete: true
                  }
                };
                wsRef.current.send(JSON.stringify(kickstart));
                incrementRound();
              }
            }, 100);

            return;
          }

          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.inlineData) {
                console.log("🔊 Received audio chunk");
                setIsSpeaking(true);

                const pcmData = new Int16Array(
                  Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0)).buffer
                );
                scheduleAudioChunk(pcmData, 24000);
              }

              if (part.text) {
                console.log("📝 Viper said:", part.text);
                parseViperResponse(part.text);
              }
            }
          }

          if (data.serverContent?.turnComplete) {
            console.log("🎤 Viper finished speaking");
            setTimeout(() => setIsSpeaking(false), 500);
            incrementRound();
          }

        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        isStartingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log(`🚪 WebSocket closed: code=${event.code}, reason="${event.reason}"`);
        isReadyToStreamRef.current = false;
        isStartingRef.current = false;
        setIsConnected(false);
        setIsSessionReady(false);
        stopSilenceChecker();
      };

    } catch (error) {
      console.error("❌ Startup error:", error);
      isStartingRef.current = false;
      cleanupResources();
    }
  }, [API_KEY, startMediaStreaming, scheduleAudioChunk, startSilenceChecker, stopSilenceChecker, incrementRound, parseViperResponse, startRecording, cleanupResources]);

  // ============================================
  // WATCH FOR GAME END
  // ============================================

  useEffect(() => {
    if ((healthBars.gameStatus === 'won' || healthBars.gameStatus === 'lost') && isConnected) {
      // Stop recording with the game outcome
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopRecording(healthBars.gameStatus);
      }
    }
  }, [healthBars.gameStatus, isConnected, stopRecording]);

  // ============================================
  // CLEANUP ON UNMOUNT ONLY
  // ============================================

  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, cleaning up...");
      cleanupResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = only run on unmount

  // ============================================
  // RETURN
  // ============================================

  return {
    isConnected,
    isSessionReady,
    volumeLevel,
    isSpeaking,
    healthBars,
    bodyLanguage,
    recording,
    downloadRecording,
    clearRecording,
    startNegotiation,
    stopNegotiation,
    resetGame,
    videoRef
  };
};