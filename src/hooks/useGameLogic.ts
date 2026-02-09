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
  // ==========================
  // STATE DEFINITIONS
  // ==========================
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

  // ==========================
  // REFS & TIMERS
  // ==========================
  const lastSpeakTimeRef = useRef<number>(Date.now());
  const silenceIntervalRef = useRef<number | null>(null);
  const lastBoostTimeRef = useRef<number>(0); // Throttle for confidence boosting

  // Refs for accessing latest state in callbacks/intervals
  const healthBarsRef = useRef(healthBars);
  healthBarsRef.current = healthBars;

  // ==========================
  // CORE MODIFIERS
  // ==========================
  const modifyUserConfidence = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newConfidence = Math.max(0, Math.min(100, prev.userConfidence + amount));
      const newStatus = newConfidence <= 0 ? 'lost' : prev.gameStatus;

      // Update Body Language based on Confidence Level (Simulation since Audio-Only model)
      if (newConfidence < 40) {
        setBodyLanguage(prevBL => ({ ...prevBL, posture: 'slouching', expression: 'nervous' }));
      } else if (newConfidence > 70) {
        setBodyLanguage(prevBL => ({ ...prevBL, posture: 'confident', expression: 'calm' }));
      }

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
      return {
        ...prev,
        viperPatience: newPatience,
        lastViperReaction: reason,
        gameStatus: newStatus
      };
    });
  }, []);

  const incrementRound = useCallback(() => {
    setHealthBars(prev => {
      // Small patience drop every round naturally (-2)
      const newPatience = Math.max(0, prev.viperPatience - 2);
      const newStatus = newPatience <= 0 ? 'won' : prev.gameStatus;
      return {
        ...prev,
        roundNumber: prev.roundNumber + 1,
        viperPatience: newPatience,
        lastViperReaction: "Viper is evaluating...",
        gameStatus: newStatus
      };
    });
  }, []);

  // ==========================
  // GAME LOOP HELPERS
  // ==========================

  // REWARD MECHANIC: Speaking confidently restores confidence
  const registerSpeaking = useCallback((volume: number) => {
    if (volume > 2) {
      lastSpeakTimeRef.current = Date.now();

      const now = Date.now();
      // Throttle: Only boost once every 2 seconds max
      if (now - lastBoostTimeRef.current > 2000) {
        // 30% Chance to gain +2 Confidence just for speaking up
        if (Math.random() > 0.7) {
           setHealthBars(prev => {
             const newConf = Math.min(100, prev.userConfidence + 2);
             return {
               ...prev,
               userConfidence: newConf,
               lastUserAction: "Speaking with conviction (+2)"
             };
           });
           // Visual feedback
           setBodyLanguage(prev => ({ ...prev, posture: 'confident' }));
        }
        lastBoostTimeRef.current = now;
      }
    }
  }, []);

  const startSilenceChecker = useCallback(() => {
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

    silenceIntervalRef.current = window.setInterval(() => {
      const timeSinceSpeak = Date.now() - lastSpeakTimeRef.current;

      // LENIENT CHECK: Only penalize after 8 seconds (was 5)
      if (timeSinceSpeak > 8000) {
        setHealthBars(prev => {
           // LENIENT PENALTY: Only -2 (was -3)
           const newConf = Math.max(0, prev.userConfidence - 2);
           const newStatus = newConf <= 0 ? 'lost' : prev.gameStatus;

           setBodyLanguage(prevBL => ({
             ...prevBL,
             eyeContact: 'weak',
             lastObservation: 'awkward silence detected'
           }));

           return {
             ...prev,
             userConfidence: newConf,
             lastUserAction: "Hesitation detected (-2)",
             gameStatus: newStatus
           };
        });
      }
    }, 1000);
  }, []);

  const stopSilenceChecker = useCallback(() => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSilenceChecker();
  }, [stopSilenceChecker]);

  return {
    healthBars,
    healthBarsRef,
    bodyLanguage,
    setBodyLanguage,
    modifyUserConfidence,
    modifyViperPatience,
    incrementRound,
    resetGameLogic,
    forceWin,
    setHealthBars,
    registerSpeaking,
    startSilenceChecker,
    stopSilenceChecker
  };
};