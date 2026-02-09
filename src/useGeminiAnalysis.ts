// src/useGeminiAnalysis.ts
// Gemini 3 Integration for Advanced Post-Session Analysis

import { useState, useCallback } from 'react';
import type { SessionStats } from './useGeminiLive';

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
        .map(m => `[${Math.floor(m.timestamp / 1000)}s] ${m.type}: ${m.description} (Confidence: ${m.healthSnapshot.confidence}%, Patience: ${m.healthSnapshot.patience}%)`)
        .join('\n');

      const prompt = `You are an expert negotiation coach analyzing a salary negotiation training session.

SESSION DATA:
- Duration: ${sessionStats.totalDuration} seconds
- Rounds of exchange: ${sessionStats.totalRounds}
- Outcome: ${outcome.toUpperCase()}
- Starting Confidence: ${sessionStats.startingConfidence}%
- Ending Confidence: ${sessionStats.endingConfidence}%
- Starting Opponent Patience: ${sessionStats.startingPatience}%
- Ending Opponent Patience: ${sessionStats.endingPatience}%
- Biggest Confidence Drop: ${sessionStats.biggestConfidenceDrop} points
- Biggest Patience Drop (damage dealt): ${sessionStats.biggestPatienceDrop} points

KEY MOMENTS TIMELINE:
${momentsText || "No key moments recorded"}

Based on this data, provide a comprehensive analysis in the following JSON format:
{
  "overallAssessment": "2-3 sentence overall assessment of performance",
  "strengthsIdentified": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "tacticalBreakdown": {
    "anchoring": "Assessment of anchoring/first offer strategy",
    "silenceUsage": "Assessment of comfort with silence",
    "bodyLanguage": "Assessment based on body language events",
    "vocalConfidence": "Assessment of speaking confidence"
  },
  "personalizedTips": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "nextScenarioRecommendation": "What type of scenario they should practice next",
  "coachingScript": "A 2-3 sentence motivational message as if you're their coach",
  "score": {
    "overall": 75,
    "confidence": 70,
    "strategy": 80,
    "composure": 72
  }
}

Be specific, actionable, and encouraging. Scores should be 0-100.`;

      console.log("🧠 Sending to Gemini 3 for analysis...");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error("No response from Gemini 3");
      }

      console.log("📊 Gemini 3 raw response:", textResponse);

      // Parse JSON from response (handle markdown code blocks)
      let jsonStr = textResponse;
      const jsonMatch = textResponse.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // Try to find JSON object directly
        const objMatch = textResponse.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonStr = objMatch[0];
        }
      }

      const analysisResult: AnalysisResult = JSON.parse(jsonStr);

      console.log("✅ Gemini 3 analysis complete:", analysisResult);
      setAnalysis(analysisResult);
      setIsAnalyzing(false);

      return analysisResult;

    } catch (err) {
      console.error("❌ Gemini 3 analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setIsAnalyzing(false);
      return null;
    }
  }, [API_KEY]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    analysis,
    error,
    analyzeSession,
    clearAnalysis
  };
};