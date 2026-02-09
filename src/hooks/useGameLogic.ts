// src/hooks/useGameLogic.ts
import { useState, useCallback, useRef } from 'react';

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

  // Refs for accessing latest state in callbacks/intervals
  const healthBarsRef = useRef(healthBars);
  healthBarsRef.current = healthBars;

  const modifyUserConfidence = useCallback((amount: number, reason: string) => {
    setHealthBars(prev => {
      const newConfidence = Math.max(0, Math.min(100, prev.userConfidence + amount));
      const newStatus = newConfidence <= 0 ? 'lost' : prev.gameStatus;
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
    setHealthBars(prev => ({ ...prev, roundNumber: prev.roundNumber + 1 }));
  }, []);

  const resetGameLogic = useCallback(() => {
    setHealthBars({
      userConfidence: 100,
      viperPatience: 100,
      lastUserAction: '',
      lastViperReaction: '',
      roundNumber: 0,
      gameStatus: 'idle' // Reset to idle so we can start fresh
    });
    setBodyLanguage({
      eyeContact: 'unknown',
      posture: 'unknown',
      expression: 'unknown',
      lastObservation: '',
      isAnalyzing: false
    });
  }, []);

  const forceWin = useCallback(() => {
    setHealthBars(prev => ({
      ...prev,
      viperPatience: 0,
      gameStatus: 'won'
    }));
  }, []);

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
    setHealthBars // Exported for fine-grained control if needed
  };
};