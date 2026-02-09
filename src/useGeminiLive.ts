// src/useGeminiLive.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { useAudioStream } from './hooks/useAudioStream';
import { useRecording } from './hooks/useRecording';
import { useGeminiSocket } from './hooks/useGeminiSocket';

export const useGeminiLive = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // 1. Initialize Logic Hooks
  const {
    healthBars, bodyLanguage, setBodyLanguage,
    modifyUserConfidence, modifyViperPatience, incrementRound,
    resetGameLogic, forceWin  } = useGameLogic();

  const {
    volumeLevel, setVolumeLevel, videoRef, streamRef, audioContextRef,
    workletNodeRef, lastSpeakTimeRef,
    initializeAudio, cleanupAudio, playAudioChunk
  } = useAudioStream();

  const {
    recording, startRecordingSession, stopRecordingSession,
    downloadRecording
      } = useRecording();

  // 2. Define Socket Callbacks
  const handleViperAudio = useCallback((pcmData: Int16Array) => {
    setIsSpeaking(true);
    playAudioChunk(pcmData, 24000);
  }, [playAudioChunk]);

  const handleViperText = useCallback((text: string) => {
    // Parsing logic for body language & health bars
    const lower = text.toLowerCase();

    // Body Language Parsing
    if (lower.includes('look away') || lower.includes('look at me')) {
      setBodyLanguage(prev => ({ ...prev, eyeContact: 'weak' }));
      modifyUserConfidence(-5, "Viper noticed weak eye contact");
    }
    // ... (rest of parsing logic matching original useGeminiLive.ts) ...
    // Note: You can copy the full parsing logic block here if needed

    // Patience Parsing
    if (lower.includes('pathetic') || lower.includes('disappointing')) {
      modifyUserConfidence(-10, "Viper mocked you");
    } else if (lower.includes('interesting') || lower.includes('fair point')) {
      modifyViperPatience(-8, "Viper is impressed");
    } else {
      modifyViperPatience(-2, "Negotiation continues");
    }
  }, [modifyUserConfidence, modifyViperPatience, setBodyLanguage]);

  const handleTurnComplete = useCallback(() => {
    setTimeout(() => setIsSpeaking(false), 500);
    incrementRound();
  }, [incrementRound]);

  const handleSetupComplete = useCallback(() => {
    // Start video loop and kickstart
    if (workletNodeRef.current && socket.sendAudioChunk) {
       workletNodeRef.current.port.onmessage = (event) => {
         const { type, audioData, volumeLevel: vol } = event.data;
         if (type === 'audio') {
           setVolumeLevel(vol);
           // Voice confidence check
           if (vol > 2) lastSpeakTimeRef.current = Date.now();
           if (audioContextRef.current) {
              socket.sendAudioChunk(audioData, audioContextRef.current.sampleRate);
           }
         }
       };
    }

    // Video Loop
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
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
    setTimeout(() => socket.sendKickstart(), 500);

    // Start Recording
    if (streamRef.current) startRecordingSession(streamRef.current);
  }, [videoRef, setVolumeLevel, streamRef, startRecordingSession]);

  // 3. Initialize Socket Hook
  const socket = useGeminiSocket({
    onAudioData: handleViperAudio,
    onTextData: handleViperText,
    onTurnComplete: handleTurnComplete,
    onSetupComplete: handleSetupComplete
  });

  // 4. Main Start/Stop Functions
  const startNegotiation = async () => {
    resetGameLogic();
    await initializeAudio();
    await socket.connect();
  };

  const stopNegotiation = useCallback(() => {
    const outcome = healthBars.gameStatus === 'won' ? 'won'
                  : healthBars.gameStatus === 'lost' ? 'lost'
                  : 'abandoned';
    stopRecordingSession(outcome, healthBars);
    socket.disconnect();
    cleanupAudio();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSpeaking(false);
  }, [cleanupAudio, healthBars, socket, stopRecordingSession]);

  // Watch for Win/Lose to auto-stop recording
  useEffect(() => {
    if ((healthBars.gameStatus === 'won' || healthBars.gameStatus === 'lost') && socket.isConnected) {
      stopNegotiation();
    }
  }, [healthBars.gameStatus, socket.isConnected, stopNegotiation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNegotiation();
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