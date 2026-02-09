// src/hooks/useRecording.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import type { HealthBarState } from './useGameLogic';

export interface KeyMoment {
  timestamp: number;
  type: 'confidence_drop' | 'confidence_boost' | 'patience_drop' | 'body_language' | 'round_start';
  description: string;
  healthSnapshot: { confidence: number; patience: number; };
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

export const useRecording = () => {
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    recordingDuration: 0,
    recordingBlob: null,
    recordingUrl: null,
    sessionStats: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<number | null>(null);
  const keyMomentsRef = useRef<KeyMoment[]>([]);
  const biggestConfidenceDropRef = useRef<number>(0);
  const biggestPatienceDropRef = useRef<number>(0);

  // Keep a ref to the recording state to access in callbacks
  const recordingRef = useRef(recording);
  useEffect(() => { recordingRef.current = recording; }, [recording]);

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
  }, []);

  const startRecordingSession = useCallback((stream: MediaStream) => {
    try {
      const recordingStream = new MediaStream();
      stream.getVideoTracks().forEach(track => recordingStream.addTrack(track));
      stream.getAudioTracks().forEach(track => recordingStream.addTrack(track));

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(recordingStream, options);
      } catch {
        mediaRecorder = new MediaRecorder(recordingStream); // Fallback
      }

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      keyMomentsRef.current = [];
      biggestConfidenceDropRef.current = 0;
      biggestPatienceDropRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
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
        sessionStats: null,
        recordingBlob: null,
        recordingUrl: null
      }));

    } catch (e) {
      console.error("Recording failed to start:", e);
    }
  }, []);

  const stopRecordingSession = useCallback((outcome: 'won' | 'lost' | 'abandoned', healthBars: HealthBarState) => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const stats: SessionStats = {
      totalDuration: Math.floor((Date.now() - recordingStartTimeRef.current) / 1000),
      totalRounds: healthBars.roundNumber,
      startingConfidence: 100,
      endingConfidence: healthBars.userConfidence,
      startingPatience: 100,
      endingPatience: healthBars.viperPatience,
      biggestConfidenceDrop: biggestConfidenceDropRef.current,
      biggestPatienceDrop: biggestPatienceDropRef.current,
      keyMoments: [...keyMomentsRef.current],
      outcome
    };

    setRecording(prev => ({ ...prev, sessionStats: stats }));
  }, []);

  const downloadRecording = useCallback(() => {
    if (!recordingRef.current.recordingUrl) return;
    const a = document.createElement('a');
    a.href = recordingRef.current.recordingUrl;
    a.download = `negotiation-dojo-${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const clearRecording = useCallback(() => {
    if (recordingRef.current.recordingUrl) {
      URL.revokeObjectURL(recordingRef.current.recordingUrl);
    }
    setRecording({
      isRecording: false,
      recordingDuration: 0,
      recordingBlob: null,
      recordingUrl: null,
      sessionStats: null
    });
  }, []);

  return {
    recording,
    startRecordingSession,
    stopRecordingSession,
    downloadRecording,
    clearRecording,
    addKeyMoment,
    biggestConfidenceDropRef,
    biggestPatienceDropRef
  };
};