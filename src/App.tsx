// src/App.tsx

import { useEffect } from 'react';
import { useGeminiLive } from './useGeminiLive';
import { useGeminiAnalysis } from './useGeminiAnalysis';
import {
  Mic, MicOff, Shield, Activity, Zap, RotateCcw, Trophy, Skull,
  Eye, User, Smile, Video, Download, Target, TrendingDown,
  Brain, Lightbulb, TrendingUp, Award, Loader2
} from 'lucide-react';

export default function App() {
  const {
    isConnected,
    isSessionReady,
    volumeLevel,
    isSpeaking,
    healthBars,
    bodyLanguage,
    recording,
    downloadRecording,
    startNegotiation,
    stopNegotiation,
    resetGame,
    videoRef
  } = useGeminiLive();

  const {
    isAnalyzing,
    analysis,
    analyzeSession,
    clearAnalysis
  } = useGeminiAnalysis();

  const {
    userConfidence,
    viperPatience,
    roundNumber,
    gameStatus,
    lastUserAction,
    lastViperReaction
  } = healthBars;

  // 🧠 Trigger Gemini 3 analysis when game ends
  useEffect(() => {
    if ((gameStatus === 'won' || gameStatus === 'lost') && recording.sessionStats && !analysis && !isAnalyzing) {
      console.log("🧠 Triggering Gemini 3 post-session analysis...");
      analyzeSession(recording.sessionStats, gameStatus);
    }
  }, [gameStatus, recording.sessionStats, analysis, isAnalyzing, analyzeSession]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Body language color helpers
  const getEyeContactColor = () => {
    switch (bodyLanguage.eyeContact) {
      case 'strong': return 'text-emerald-400';
      case 'weak': return 'text-red-400';
      case 'none': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const getPostureColor = () => {
    switch (bodyLanguage.posture) {
      case 'confident': return 'text-emerald-400';
      case 'slouching': return 'text-red-400';
      case 'nervous': return 'text-yellow-400';
      default: return 'text-slate-500';
    }
  };

  const getExpressionColor = () => {
    switch (bodyLanguage.expression) {
      case 'confident': return 'text-emerald-400';
      case 'calm': return 'text-emerald-400';
      case 'nervous': return 'text-yellow-400';
      case 'fearful': return 'text-red-400';
      default: return 'text-slate-500';
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    clearAnalysis();
    startNegotiation();
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white overflow-hidden relative">

      {/* ==========================================
          🏆 WIN OVERLAY WITH GEMINI 3 ANALYSIS
          ========================================== */}
      {gameStatus === 'won' && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-y-auto py-8">
          <div className="text-center space-y-6 max-w-4xl mx-4">
            <Trophy size={80} className="mx-auto text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
            <h2 className="text-5xl font-black text-emerald-400 tracking-wider">
              VICTORY!
            </h2>
            <p className="text-xl text-slate-300">
              Viper's patience crumbled. You negotiated like a champion!
            </p>

            {/* 🧠 Gemini 3 Analysis Section */}
            <div className="bg-slate-800/50 rounded-lg p-6 text-left border border-emerald-500/30">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-4">
                <Brain size={20} /> AI Coach Analysis
                <span className="text-xs text-slate-500 font-normal">(Powered by Gemini 3)</span>
              </h3>

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                  <span className="text-slate-400">Gemini 3 is analyzing your performance...</span>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                        {analysis.score.overall}
                      </div>
                      <div className="text-xs text-slate-400">Overall</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.confidence)}`}>
                        {analysis.score.confidence}
                      </div>
                      <div className="text-xs text-slate-400">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.strategy)}`}>
                        {analysis.score.strategy}
                      </div>
                      <div className="text-xs text-slate-400">Strategy</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.composure)}`}>
                        {analysis.score.composure}
                      </div>
                      <div className="text-xs text-slate-400">Composure</div>
                    </div>
                  </div>

                  {/* Overall Assessment */}
                  <div className="p-3 bg-slate-700/30 rounded">
                    <p className="text-slate-300 italic">"{analysis.overallAssessment}"</p>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                        <TrendingUp size={14} /> Strengths
                      </h4>
                      <ul className="space-y-1">
                        {analysis.strengthsIdentified.map((s, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-2">
                        <Lightbulb size={14} /> Areas to Improve
                      </h4>
                      <ul className="space-y-1">
                        {analysis.areasForImprovement.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-yellow-400">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Coach Message */}
                  <div className="p-3 bg-emerald-500/10 rounded border border-emerald-500/30">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1">
                      <Award size={14} /> Coach's Message
                    </h4>
                    <p className="text-sm text-slate-300">{analysis.coachingScript}</p>
                  </div>

                  {/* Next Recommendation */}
                  <div className="text-xs text-slate-500">
                    <strong>Next:</strong> {analysis.nextScenarioRecommendation}
                  </div>
                </div>
              )}

              {!isAnalyzing && !analysis && (
                <p className="text-slate-500 text-sm">Analysis unavailable</p>
              )}
            </div>

            {/* Session Stats */}
            {recording.sessionStats && (
              <div className="bg-slate-800/30 rounded-lg p-4 text-left border border-slate-700">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-2">
                  <Target size={14} /> Session Stats
                </h4>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Duration:</span>
                    <span className="ml-1 text-white font-mono">{formatDuration(recording.sessionStats.totalDuration)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rounds:</span>
                    <span className="ml-1 text-white font-mono">{recording.sessionStats.totalRounds}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Final Confidence:</span>
                    <span className="ml-1 text-emerald-400 font-mono">{recording.sessionStats.endingConfidence}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Viper's Patience:</span>
                    <span className="ml-1 text-red-400 font-mono">{recording.sessionStats.endingPatience}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {recording.recordingUrl && (
                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all"
                >
                  <Download size={18} /> Download Recording
                </button>
              )}
              <button
                onClick={handlePlayAgain}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-slate-900 rounded-full font-bold hover:bg-emerald-400 transition-all"
              >
                <RotateCcw size={20} /> PLAY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          💀 LOSE OVERLAY WITH GEMINI 3 ANALYSIS
          ========================================== */}
      {gameStatus === 'lost' && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-y-auto py-8">
          <div className="text-center space-y-6 max-w-4xl mx-4">
            <Skull size={80} className="mx-auto text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse" />
            <h2 className="text-5xl font-black text-red-500 tracking-wider">
              DEFEATED
            </h2>
            <p className="text-xl text-slate-300">
              Your confidence shattered. Viper wins this round.
            </p>

            {/* 🧠 Gemini 3 Analysis Section */}
            <div className="bg-slate-800/50 rounded-lg p-6 text-left border border-red-500/30">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-4">
                <Brain size={20} /> AI Coach Analysis
                <span className="text-xs text-slate-500 font-normal">(Powered by Gemini 3)</span>
              </h3>

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 size={24} className="animate-spin text-red-400" />
                  <span className="text-slate-400">Gemini 3 is analyzing what went wrong...</span>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  {/* Scores */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                        {analysis.score.overall}
                      </div>
                      <div className="text-xs text-slate-400">Overall</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.confidence)}`}>
                        {analysis.score.confidence}
                      </div>
                      <div className="text-xs text-slate-400">Confidence</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.strategy)}`}>
                        {analysis.score.strategy}
                      </div>
                      <div className="text-xs text-slate-400">Strategy</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score.composure)}`}>
                        {analysis.score.composure}
                      </div>
                      <div className="text-xs text-slate-400">Composure</div>
                    </div>
                  </div>

                  {/* Overall Assessment */}
                  <div className="p-3 bg-slate-700/30 rounded">
                    <p className="text-slate-300 italic">"{analysis.overallAssessment}"</p>
                  </div>

                  {/* What Went Wrong + Tips */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2">
                        <TrendingDown size={14} /> What Went Wrong
                      </h4>
                      <ul className="space-y-1">
                        {analysis.areasForImprovement.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-red-400">✗</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-2">
                        <Lightbulb size={14} /> Tips for Next Time
                      </h4>
                      <ul className="space-y-1">
                        {analysis.personalizedTips.map((t, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-yellow-400">💡</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Coach Message */}
                  <div className="p-3 bg-red-500/10 rounded border border-red-500/30">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-1">
                      <Award size={14} /> Coach's Message
                    </h4>
                    <p className="text-sm text-slate-300">{analysis.coachingScript}</p>
                  </div>

                  {/* Next Recommendation */}
                  <div className="text-xs text-slate-500">
                    <strong>Recommended Practice:</strong> {analysis.nextScenarioRecommendation}
                  </div>
                </div>
              )}

              {!isAnalyzing && !analysis && (
                <p className="text-slate-500 text-sm">Analysis unavailable</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {recording.recordingUrl && (
                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all"
                >
                  <Download size={18} /> Download Recording
                </button>
              )}
              <button
                onClick={handlePlayAgain}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-500 transition-all"
              >
                <RotateCcw size={20} /> TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          1. HEADER
          ========================================== */}
      <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-slate-700 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-all ${
            isSessionReady
              ? 'bg-green-500 shadow-[0_0_10px_#22c55e]'
              : isConnected
                ? 'bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse'
                : 'bg-red-500'
          }`} />
          <h1 className="text-xl font-bold tracking-wider">
            NEGOTIATION<span className="text-red-500">DOJO</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {recording.isRecording && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-1 rounded border border-red-500/30">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <Video size={14} />
              <span className="font-mono">{formatDuration(recording.recordingDuration)}</span>
            </div>
          )}

          {isConnected && (
            <div className="text-yellow-500 font-mono text-sm px-3 py-1 bg-yellow-500/10 rounded border border-yellow-500/30">
              ROUND {roundNumber}
            </div>
          )}
          <div className="text-sm font-mono text-slate-400">SCENARIO: VIPER_001</div>
        </div>
      </header>

      {/* ==========================================
          2. MAIN BATTLEFIELD (Split Screen)
          ========================================== */}
      <main className="flex-1 flex flex-col md:flex-row">

        {/* LEFT: PLAYER SIDE */}
        <section className="flex-1 relative border-r border-slate-700 bg-black flex items-center justify-center p-4">

          {/* Player HUD - Confidence Bar */}
          <div className="absolute top-4 left-4 z-10 w-72">
            <div className="flex items-center justify-between text-blue-400 font-bold text-xs uppercase mb-1">
              <div className="flex items-center gap-2">
                <Shield size={14} /> Confidence
              </div>
              <span className="font-mono">{userConfidence}%</span>
            </div>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600 relative">
              <div
                className="h-full transition-all duration-500 ease-out"
                style={{
                  width: `${userConfidence}%`,
                  background: userConfidence > 50
                    ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                    : userConfidence > 25
                      ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                      : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none" />
            </div>

            <p className="text-xs text-slate-500 mt-1 truncate h-4 italic">
              {lastUserAction}
            </p>
          </div>

          {/* Body Language Indicators */}
          {isConnected && (
            <div className="absolute top-24 left-4 z-10 space-y-2">
              <div className="text-xs uppercase text-slate-500 font-bold mb-1">
                📹 Body Language
                {bodyLanguage.isAnalyzing && (
                  <span className="ml-2 text-yellow-500 animate-pulse">Analyzing...</span>
                )}
              </div>

              <div className={`flex items-center gap-2 text-xs ${getEyeContactColor()}`}>
                <Eye size={12} />
                <span className="capitalize">
                  Eyes: {bodyLanguage.eyeContact === 'unknown' ? '...' : bodyLanguage.eyeContact}
                </span>
              </div>

              <div className={`flex items-center gap-2 text-xs ${getPostureColor()}`}>
                <User size={12} />
                <span className="capitalize">
                  Posture: {bodyLanguage.posture === 'unknown' ? '...' : bodyLanguage.posture}
                </span>
              </div>

              <div className={`flex items-center gap-2 text-xs ${getExpressionColor()}`}>
                <Smile size={12} />
                <span className="capitalize">
                  Expression: {bodyLanguage.expression === 'unknown' ? '...' : bodyLanguage.expression}
                </span>
              </div>

              {bodyLanguage.lastObservation && (
                <p className="text-xs text-slate-600 italic mt-1 max-w-48 truncate">
                  {bodyLanguage.lastObservation}
                </p>
              )}
            </div>
          )}

          {/* Low Confidence Warning */}
          {userConfidence <= 30 && isConnected && (
            <div className="absolute top-20 right-4 z-10 text-red-400 text-xs font-bold animate-pulse">
              ⚠️ CONFIDENCE CRITICAL!
            </div>
          )}

          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`
              w-full max-w-lg aspect-square object-cover rounded-lg border-2 shadow-2xl transform scale-x-[-1]
              ${userConfidence <= 30
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                : 'border-slate-700'
              }
            `}
          />

          {/* Camera Active Indicator */}
          {isConnected && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">LIVE</span>
            </div>
          )}

          {/* Volume Indicator */}
          {isConnected && (
            <div className="absolute bottom-16 left-4 flex items-center gap-2">
              <Mic size={14} className={volumeLevel > 2 ? 'text-emerald-400' : 'text-slate-600'} />
              <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, volumeLevel * 10)}%` }}
                />
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 text-slate-500 font-mono text-xs">
            YOU (CANDIDATE)
          </div>
        </section>

        {/* RIGHT: AI SIDE */}
        <section className="flex-1 relative bg-slate-900 flex items-center justify-center p-4">

          {/* AI HUD - Patience Bar */}
          <div className="absolute top-4 right-4 z-10 w-72 text-right">
            <div className="flex items-center justify-end gap-2 text-red-400 font-bold text-xs uppercase mb-1">
              <span className="font-mono">{viperPatience}%</span>
              <div className="flex items-center gap-2">
                Patience <Activity size={14} />
              </div>
            </div>

            <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600 relative">
              <div
                className="h-full transition-all duration-500 ease-out ml-auto"
                style={{
                  width: `${viperPatience}%`,
                  background: viperPatience > 50
                    ? 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
                    : viperPatience > 25
                      ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                      : 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none" />
            </div>

            <p className="text-xs text-slate-500 mt-1 truncate h-4 italic">
              {lastViperReaction}
            </p>
          </div>

          {/* Viper Breaking Warning */}
          {viperPatience <= 30 && isConnected && (
            <div className="absolute top-20 right-4 z-10 text-emerald-400 text-xs font-bold animate-pulse">
              🎯 VIPER IS BREAKING!
            </div>
          )}

          {/* Avatar / Visualizer */}
          <div className="relative">
            <div
              className={`
                absolute inset-0 rounded-full blur-2xl transition-all duration-100
                ${viperPatience <= 30 ? 'bg-emerald-500/30' : 'bg-red-500/30'}
              `}
              style={{
                transform: `scale(${1 + (isSpeaking ? 0.3 : 0) + volumeLevel/80})`,
                opacity: isSpeaking ? 1 : 0.3
              }}
            />

            <div className={`
              w-48 h-48 rounded-full bg-slate-800 border-4 flex items-center justify-center relative z-10 transition-all duration-300
              ${isSpeaking
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                : viperPatience <= 30
                  ? 'border-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                  : 'border-slate-600'
              }
            `}>
              <Zap size={64} className={`
                transition-colors duration-300
                ${viperPatience <= 30 ? 'text-emerald-400' : 'text-slate-200'}
              `} />
            </div>

            {isSpeaking && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 text-red-500 font-mono text-xs font-bold">
            VIPER (AI) 🐍
          </div>
        </section>

      </main>

      {/* ==========================================
          3. FOOTER CONTROLS
          ========================================== */}
      <footer className="h-24 flex-none bg-slate-950 flex items-center justify-center gap-4 border-t border-slate-800">

        {isConnected && !isSessionReady && (
          <span className="text-yellow-500 text-sm animate-pulse">
            Connecting to Viper...
          </span>
        )}

        <button
          onClick={isConnected ? stopNegotiation : startNegotiation}
          disabled={gameStatus === 'won' || gameStatus === 'lost'}
          className={`
            flex items-center gap-3 px-8 py-3 rounded-full font-bold text-lg transition-all
            ${isConnected
              ? 'bg-red-600 text-white hover:bg-red-700 ring-4 ring-red-900/30'
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 ring-4 ring-emerald-900/30'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isConnected
            ? <><MicOff size={20} /> END SESSION</>
            : <><Mic size={20} /> START NEGOTIATION</>
          }
        </button>

        {isSessionReady && (
          <div className="text-slate-500 text-xs">
            Session active • {volumeLevel.toFixed(1)} dB
          </div>
        )}
      </footer>

    </div>
  );
}