// src/useGeminiLive.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { useAudioStream } from './hooks/useAudioStream';
import { useRecording } from './hooks/useRecording';
import { useGeminiSocket } from './hooks/useGeminiSocket';

export const useGeminiLive = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const {
    healthBars,
    bodyLanguage,
    setBodyLanguage,
    modifyUserConfidence,
    modifyViperPatience,
    incrementRound,
    resetGameLogic,
    forceWin,
    registerSpeaking,
    startSilenceChecker
  } = useGameLogic();

  const {
    volumeLevel,
    setVolumeLevel,
    videoRef,
    streamRef,
    audioContextRef,
    workletNodeRef,
    initializeAudio,
    cleanupAudio,
    playAudioChunk
  } = useAudioStream();

  const {
    recording,
    startRecordingSession,
    stopRecordingSession,
    downloadRecording
  } = useRecording();

  // Track if this is the first response (for initial body language)
  const isFirstResponseRef = useRef(true);

  const handleViperAudio = useCallback((pcmData: Int16Array) => {
    setIsSpeaking(true);
    playAudioChunk(pcmData, 24000);

    // Set body language to "analyzing" while Viper speaks
    setBodyLanguage(prev => ({
      ...prev,
      isAnalyzing: true
    }));
  }, [playAudioChunk, setBodyLanguage]);

  // This would be called if we ever get text (keeping for future compatibility)
  const handleViperText = useCallback((text: string) => {
    const lower = text.toLowerCase();
    console.log("📝 Viper said:", text);

    // ========== VOICE/TONE DETECTION ==========
    if (lower.includes('fear in your voice') || lower.includes('voice is shaking') ||
        lower.includes('sound nervous') || lower.includes('crying') || lower.includes('emotional')) {
      setBodyLanguage(prev => ({
        ...prev,
        expression: 'fearful',
        lastObservation: 'Viper detected fear in voice',
        isAnalyzing: false
      }));
      modifyUserConfidence(-8, "Viper heard fear in your voice");
      return;
    }

    if (lower.includes('steady voice') || lower.includes('confident tone')) {
      setBodyLanguage(prev => ({
        ...prev,
        expression: 'confident',
        lastObservation: 'Viper noticed confident voice',
        isAnalyzing: false
      }));
      modifyViperPatience(-5, "Your voice sounds confident");
      return;
    }

    // ========== EYE CONTACT DETECTION ==========
    if (lower.includes('look away') || lower.includes('looking away') ||
        lower.includes('eye contact') || lower.includes('look at me') ||
        lower.includes('avoiding')) {
      setBodyLanguage(prev => ({
        ...prev,
        eyeContact: 'weak',
        lastObservation: 'Viper noticed poor eye contact',
        isAnalyzing: false
      }));
      modifyUserConfidence(-5, "Viper noticed weak eye contact");
      return;
    }

    if (lower.includes('good eye contact') || lower.includes('looking right at')) {
      setBodyLanguage(prev => ({
        ...prev,
        eyeContact: 'strong',
        lastObservation: 'Strong eye contact noted',
        isAnalyzing: false
      }));
      modifyViperPatience(-3, "Your eye contact is intimidating");
      return;
    }

    // ========== POSTURE DETECTION ==========
    if (lower.includes('slouch') || lower.includes('posture') ||
        lower.includes('sit up') || lower.includes('leaning back')) {
      setBodyLanguage(prev => ({
        ...prev,
        posture: 'slouching',
        lastObservation: 'Viper noticed poor posture',
        isAnalyzing: false
      }));
      modifyUserConfidence(-4, "Viper noticed poor posture");
      return;
    }

    if (lower.includes('confident posture') || lower.includes('sitting tall')) {
      setBodyLanguage(prev => ({
        ...prev,
        posture: 'confident',
        lastObservation: 'Confident posture noted',
        isAnalyzing: false
      }));
      modifyViperPatience(-3, "Your posture shows confidence");
      return;
    }

    // ========== NERVOUSNESS/FIDGETING ==========
    if (lower.includes('fidget') || lower.includes('nervous') ||
        lower.includes('sweat') || lower.includes('scared') ||
        lower.includes('touching your face') || lower.includes('shaking')) {
      setBodyLanguage(prev => ({
        ...prev,
        expression: 'nervous',
        posture: 'nervous',
        lastObservation: 'Viper noticed nervousness',
        isAnalyzing: false
      }));
      modifyUserConfidence(-5, "Viper noticed you're nervous");
      return;
    }

    // ========== VIPER MOOD DETECTION ==========
    if (lower.includes('pathetic') || lower.includes('weak') ||
        lower.includes('disappointing') || lower.includes('is that all') ||
        lower.includes('wasting my time')) {
      modifyUserConfidence(-10, "Viper mocked you");
      setBodyLanguage(prev => ({ ...prev, isAnalyzing: false }));
      return;
    }

    if (lower.includes('interesting') || lower.includes('fair point') ||
        lower.includes('not bad') || lower.includes('respect')) {
      modifyViperPatience(-8, "Viper is impressed");
      setBodyLanguage(prev => ({
        ...prev,
        eyeContact: 'strong',
        posture: 'confident',
        expression: 'confident',
        lastObservation: 'Showing confidence',
        isAnalyzing: false
      }));
      return;
    }

    if (lower.includes('fine') || lower.includes('very well') ||
        lower.includes('stubborn') || lower.includes('persistent')) {
      modifyViperPatience(-12, "Viper is frustrated");
      setBodyLanguage(prev => ({ ...prev, isAnalyzing: false }));
      return;
    }

    // Default: stop analyzing
    setBodyLanguage(prev => ({ ...prev, isAnalyzing: false }));
  }, [modifyUserConfidence, modifyViperPatience, setBodyLanguage]);

  const handleTurnComplete = useCallback(() => {
    console.log("🎤 Viper finished speaking");
    setTimeout(() => setIsSpeaking(false), 500);
    incrementRound();

    // Apply small patience reduction once per turn
    modifyViperPatience(-2, "Negotiation continues...");

    // Stop analyzing after turn completes
    setBodyLanguage(prev => ({ ...prev, isAnalyzing: false }));

    // On first response, set initial body language to neutral
    if (isFirstResponseRef.current) {
      setBodyLanguage(prev => ({
        ...prev,
        eyeContact: 'strong',
        posture: 'confident',
        expression: 'calm',
        lastObservation: 'Session started'
      }));
      isFirstResponseRef.current = false;
    }
  }, [incrementRound, modifyViperPatience, setBodyLanguage]);

  const handleSetupComplete = useCallback(() => {
    console.log("✅ Setup complete - starting streams");

    isFirstResponseRef.current = true;
    startSilenceChecker();

    if (workletNodeRef.current) {
      workletNodeRef.current.port.onmessage = (event) => {
        const { type, audioData, volumeLevel: vol } = event.data;
        if (type === 'audio') {
          setVolumeLevel(vol);
          registerSpeaking(vol);

          if (audioContextRef.current) {
            socket.sendAudioChunk(audioData, audioContextRef.current.sampleRate);
          }
        }
      };
    }

    // Video Loop
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (ctx && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, 512, 512);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        socket.sendImageChunk(base64);
      }
    }, 1000);

    // Send Kickstart
    setTimeout(() => {
      socket.sendKickstart();
      incrementRound();
    }, 500);

    // Start Recording
    if (streamRef.current) {
      startRecordingSession(streamRef.current);
    }
  }, [videoRef, setVolumeLevel, streamRef, startRecordingSession, workletNodeRef, audioContextRef, incrementRound, registerSpeaking, startSilenceChecker]);

  const socket = useGeminiSocket({
    onAudioData: handleViperAudio,
    onTextData: handleViperText,
    onTurnComplete: handleTurnComplete,
    onSetupComplete: handleSetupComplete
  });

  const startNegotiation = useCallback(async () => {
    resetGameLogic();
    await initializeAudio();
    await socket.connect();
  }, [resetGameLogic, initializeAudio, socket]);

  const stopNegotiation = useCallback(() => {
    const outcome = healthBars.gameStatus === 'won' ? 'won'
                  : healthBars.gameStatus === 'lost' ? 'lost'
                  : 'abandoned';
    stopRecordingSession(outcome, healthBars);
    socket.disconnect();
    cleanupAudio();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSpeaking(false);
  }, [cleanupAudio, healthBars, socket, stopRecordingSession]);

  useEffect(() => {
    if ((healthBars.gameStatus === 'won' || healthBars.gameStatus === 'lost') && socket.isConnected) {
      stopNegotiation();
    }
  }, [healthBars.gameStatus, socket.isConnected, stopNegotiation]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isConnected: socket.isConnected,
    isSessionReady: socket.isSessionReady,
    volumeLevel,
    isSpeaking,
    healthBars,
    bodyLanguage,
    recording,
    videoRef,
    startNegotiation,
    stopNegotiation,
    resetGame: resetGameLogic,
    forceWin,
    downloadRecording
  };
};