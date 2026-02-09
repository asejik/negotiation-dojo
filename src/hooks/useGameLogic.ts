// src/hooks/useGameLogic.ts
import { useState, useCallback, useRef, useEffect } from 'react';

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

export const useGameLogic = () => {
  const [healthBars, setHealthBars] = useState<HealthBarState>({
    userConfidence: 100,
    viperPatience: 100,
    lastUserAction: '',
    lastViperReaction: '',
    roundNumber: 0,
    gameStatus: 'idle'
  });

  const [bodyLanguage, setBodyLanguage] = useState<BodyLanguageState>({
    eyeContact: 'unknown',
    posture: 'unknown',
    expression: 'unknown',
    lastObservation: '',
    isAnalyzing: false
  });

  const lastSpeakTimeRef = useRef<number>(Date.now());
  const silenceIntervalRef = useRef<number | null>(null);

  const modifyUserConfidence = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newConfidence = Math.max(0, Math.min(100, prev.userConfidence + amount));
      const newStatus = newConfidence <= 0 ? 'lost' : prev.gameStatus;

      console.log(`💚 Confidence ${amount >= 0 ? '+' : ''}${amount}: ${reason} (${newConfidence}%)`);

      return {
        ...prev,
        userConfidence: newConfidence,
        lastUserAction: reason,
        gameStatus: newStatus
      };
    });
  }, []);

  const modifyViperPatience = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newPatience = Math.max(0, Math.min(100, prev.viperPatience + amount));
      const newStatus = newPatience <= 0 ? 'won' : prev.gameStatus;

      console.log(`❤️ Patience ${amount >= 0 ? '+' : ''}${amount}: ${reason} (${newPatience}%)`);

      return {
        ...prev,
        viperPatience: newPatience,
        lastViperReaction: reason,
        gameStatus: newStatus
      };
    });
  }, []);

  const incrementRound = useCallback(() => {
    setHealthBars(prev => ({
      ...prev,
      roundNumber: prev.roundNumber + 1
    }));
  }, []);

  // Silence penalty checker
  const startSilenceChecker = useCallback(() => {
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

    silenceIntervalRef.current = window.setInterval(() => {
      const silenceDuration = Date.now() - lastSpeakTimeRef.current;
      if (silenceDuration > 5000) {
        modifyUserConfidence(-3, "Awkward silence - speak up!");
        setBodyLanguage(prev => ({
          ...prev,
          expression: 'nervous',
          lastObservation: 'Extended silence detected'
        }));
        lastSpeakTimeRef.current = Date.now();
      }
    }, 3000);
  }, [modifyUserConfidence]);

  const stopSilenceChecker = useCallback(() => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  }, []);

  // ✅ FIXED: Only tracks that user is speaking, NO confidence boost
  // Let Viper be the judge of whether they sound confident
  const registerSpeaking = useCallback((volume: number) => {
    if (volume > 2) {
      lastSpeakTimeRef.current = Date.now();
      // ❌ REMOVED: No more fake "Speaking confidently" boost
      // Viper will tell us if the user sounds confident or weak
    }
  }, []);

  const resetGameLogic = useCallback(() => {
    stopSilenceChecker();
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
    lastSpeakTimeRef.current = Date.now();
    startSilenceChecker();
  }, [startSilenceChecker, stopSilenceChecker]);

  const forceWin = useCallback(() => {
    setHealthBars(prev => ({
      ...prev,
      viperPatience: 0,
      gameStatus: 'won',
      lastViperReaction: 'DEBUG: Forced Win'
    }));
  }, []);

  useEffect(() => {
    return () => stopSilenceChecker();
  }, [stopSilenceChecker]);

  return {
    healthBars,
    bodyLanguage,
    setBodyLanguage,
    modifyUserConfidence,
    modifyViperPatience,
    incrementRound,
    resetGameLogic,
    forceWin,
    registerSpeaking,
    startSilenceChecker,
    stopSilenceChecker
  };
};