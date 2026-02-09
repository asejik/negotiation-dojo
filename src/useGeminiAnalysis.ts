// src/useGeminiAnalysis.ts
import { useState, useCallback } from 'react';
import type { SessionStats } from './hooks/useRecording'; // FIX: Update import path

export interface AnalysisResult {
  overallAssessment: string;
  strengthsIdentified: string[];
  areasForImprovement: string[];
  tacticalBreakdown: {
    anchoring: string;
    silenceUsage: string;
    bodyLanguage: string;
    vocalConfidence: string;
  };
  personalizedTips: string[];
  nextScenarioRecommendation: string;
  coachingScript: string;
  score: {
    overall: number;
    confidence: number;
    strategy: number;
    composure: number;
  };
}

export const useGeminiAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const analyzeSession = useCallback(async (
    sessionStats: SessionStats,
    outcome: 'won' | 'lost' | 'abandoned'
  ): Promise<AnalysisResult | null> => {
    if (!API_KEY) {
      setError("Missing API Key");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Format key moments for analysis
      const momentsText = sessionStats.keyMoments
        .map((m: any) => `[${Math.floor(m.timestamp / 1000)}s] ${m.type}: ${m.description}`) // FIX: Added type check handled by SessionStats, but explicit cast helps if inference fails
        .join('\n');

      const prompt = `
        ACT AS: An elite negotiation coach reviewing a student's session.
        CONTEXT: The student just negotiated with 'Viper' (an aggressive AI).
        OUTCOME: ${outcome.toUpperCase()}
        STATS:
        - Duration: ${sessionStats.totalDuration}s
        - Rounds: ${sessionStats.totalRounds}
        - Final Confidence: ${sessionStats.endingConfidence}%
        - Final Patience: ${sessionStats.endingPatience}%

        KEY MOMENTS LOG:
        ${momentsText}

        TASK: Analyze their performance. Return ONLY valid JSON with this structure:
        {
          "overallAssessment": "1-2 sentence summary",
          "strengthsIdentified": ["point 1", "point 2"],
          "areasForImprovement": ["point 1", "point 2"],
          "tacticalBreakdown": {
            "anchoring": "analysis",
            "silenceUsage": "analysis",
            "bodyLanguage": "analysis",
            "vocalConfidence": "analysis"
          },
          "personalizedTips": ["tip 1", "tip 2"],
          "nextScenarioRecommendation": "scenario name",
          "coachingScript": "Short motivational message",
          "score": {
            "overall": 0-100,
            "confidence": 0-100,
            "strategy": 0-100,
            "composure": 0-100
          }
        }
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error("No response from Gemini");

      const analysisResult: AnalysisResult = JSON.parse(textResponse);
      setAnalysis(analysisResult);
      setIsAnalyzing(false);
      return analysisResult;

    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setIsAnalyzing(false);
      return null;
    }
  }, [API_KEY]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return { isAnalyzing, analysis, error, analyzeSession, clearAnalysis };
};