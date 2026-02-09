// src/App.tsx

import { useGeminiLive } from './useGeminiLive';
import {
  Mic, MicOff, Shield, Activity, Zap, RotateCcw, Trophy, Skull,
  Eye, User, Smile, Video, Download, X, Clock, Target, TrendingDown
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
    clearRecording,
    startNegotiation,
    stopNegotiation,
    resetGame,
    videoRef
  } = useGeminiLive();

  const {
    userConfidence,
    viperPatience,
    roundNumber,
    gameStatus,
    lastUserAction,
    lastViperReaction
  } = healthBars;

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
    startNegotiation();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white overflow-hidden relative">

      {/* ==========================================
          🏆 WIN OVERLAY
          ========================================== */}
      {gameStatus === 'won' && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-y-auto py-8">
          <div className="text-center space-y-6 max-w-2xl mx-4">
            <Trophy size={100} className="mx-auto text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
            <h2 className="text-5xl font-black text-emerald-400 tracking-wider">
              VICTORY!
            </h2>
            <p className="text-xl text-slate-300">
              Viper's patience crumbled. You negotiated like a champion!
            </p>

            {/* 📊 Session Stats */}
            {recording.sessionStats && (
              <div className="bg-slate-800/50 rounded-lg p-6 text-left space-y-4 border border-emerald-500/30">
                <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <Target size={20} /> Session Summary
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white font-mono">{formatDuration(recording.sessionStats.totalDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-slate-400" />
                    <span className="text-slate-400">Rounds:</span>
                    <span className="text-white font-mono">{recording.sessionStats.totalRounds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-slate-400">Final Confidence:</span>
                    <span className="text-emerald-400 font-mono">{recording.sessionStats.endingConfidence}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-red-400" />
                    <span className="text-slate-400">Viper's Patience:</span>
                    <span className="text-red-400 font-mono">{recording.sessionStats.endingPatience}%</span>
                  </div>
                </div>

                {/* Key Moments */}
                {recording.sessionStats.keyMoments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <TrendingDown size={16} /> Key Moments
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {recording.sessionStats.keyMoments.slice(-5).map((moment, i) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span className="text-slate-500 font-mono w-12">
                            {formatDuration(Math.floor(moment.timestamp / 1000))}
                          </span>
                          <span className={`
                            ${moment.type === 'confidence_drop' ? 'text-red-400' : ''}
                            ${moment.type === 'patience_drop' ? 'text-emerald-400' : ''}
                            ${moment.type === 'body_language' ? 'text-yellow-400' : ''}
                            ${moment.type === 'confidence_boost' ? 'text-blue-400' : ''}
                            ${moment.type === 'round_start' ? 'text-slate-400' : ''}
                          `}>
                            {moment.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🎥 Recording Controls */}
            {recording.recordingUrl && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all"
                >
                  <Download size={18} /> Download Recording
                </button>
                <button
                  onClick={clearRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-all"
                >
                  <X size={18} /> Dismiss
                </button>
              </div>
            )}

            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-slate-900 rounded-full font-bold hover:bg-emerald-400 transition-all mx-auto"
            >
              <RotateCcw size={20} /> PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          💀 LOSE OVERLAY
          ========================================== */}
      {gameStatus === 'lost' && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-y-auto py-8">
          <div className="text-center space-y-6 max-w-2xl mx-4">
            <Skull size={100} className="mx-auto text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse" />
            <h2 className="text-5xl font-black text-red-500 tracking-wider">
              DEFEATED
            </h2>
            <p className="text-xl text-slate-300">
              Your confidence shattered. Viper wins this round.
            </p>

            {/* 📊 Session Stats */}
            {recording.sessionStats && (
              <div className="bg-slate-800/50 rounded-lg p-6 text-left space-y-4 border border-red-500/30">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <Target size={20} /> Session Summary
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white font-mono">{formatDuration(recording.sessionStats.totalDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-slate-400" />
                    <span className="text-slate-400">Rounds:</span>
                    <span className="text-white font-mono">{recording.sessionStats.totalRounds}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-slate-400">Final Confidence:</span>
                    <span className="text-red-400 font-mono">{recording.sessionStats.endingConfidence}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-red-400" />
                    <span className="text-slate-400">Viper's Patience:</span>
                    <span className="text-slate-400 font-mono">{recording.sessionStats.endingPatience}%</span>
                  </div>
                </div>

                {/* Key Moments - What Went Wrong */}
                {recording.sessionStats.keyMoments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                      <TrendingDown size={16} /> What Went Wrong
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {recording.sessionStats.keyMoments
                        .filter(m => m.type === 'confidence_drop' || m.type === 'body_language')
                        .slice(-5)
                        .map((moment, i) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span className="text-slate-500 font-mono w-12">
                            {formatDuration(Math.floor(moment.timestamp / 1000))}
                          </span>
                          <span className="text-red-400">
                            {moment.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🎥 Recording Controls */}
            {recording.recordingUrl && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={downloadRecording}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all"
                >
                  <Download size={18} /> Download Recording
                </button>
                <button
                  onClick={clearRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-all"
                >
                  <X size={18} /> Dismiss
                </button>
              </div>
            )}

            <button
              onClick={handlePlayAgain}
              className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-500 transition-all mx-auto"
            >
              <RotateCcw size={20} /> TRY AGAIN
            </button>
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
          {/* 🎥 Recording Indicator */}
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

        {/* ----------------------------------------
            LEFT: PLAYER SIDE
            ---------------------------------------- */}
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

          {/* 📹 Body Language Indicators */}
          {isConnected && (
            <div className="absolute top-24 left-4 z-10 space-y-2">
              <div className="text-xs uppercase text-slate-500 font-bold mb-1">
                📹 Body Language
                {bodyLanguage.isAnalyzing && (
                  <span className="ml-2 text-yellow-500 animate-pulse">Analyzing...</span>
                )}
              </div>

              {/* Eye Contact */}
              <div className={`flex items-center gap-2 text-xs ${getEyeContactColor()}`}>
                <Eye size={12} />
                <span className="capitalize">
                  Eyes: {bodyLanguage.eyeContact === 'unknown' ? '...' : bodyLanguage.eyeContact}
                </span>
              </div>

              {/* Posture */}
              <div className={`flex items-center gap-2 text-xs ${getPostureColor()}`}>
                <User size={12} />
                <span className="capitalize">
                  Posture: {bodyLanguage.posture === 'unknown' ? '...' : bodyLanguage.posture}
                </span>
              </div>

              {/* Expression */}
              <div className={`flex items-center gap-2 text-xs ${getExpressionColor()}`}>
                <Smile size={12} />
                <span className="capitalize">
                  Expression: {bodyLanguage.expression === 'unknown' ? '...' : bodyLanguage.expression}
                </span>
              </div>

              {/* Last Observation */}
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

          {/* 📹 Camera Active Indicator */}
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

        {/* ----------------------------------------
            RIGHT: AI SIDE
            ---------------------------------------- */}
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
            {/* Pulse Ring */}
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

            {/* Avatar Icon */}
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

            {/* Speaking Indicator */}
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

        {/* Connection Status */}
        {isConnected && !isSessionReady && (
          <span className="text-yellow-500 text-sm animate-pulse">
            Connecting to Viper...
          </span>
        )}

        {/* Main Action Button */}
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

        {/* Session Info */}
        {isSessionReady && (
          <div className="text-slate-500 text-xs">
            Session active • {volumeLevel.toFixed(1)} dB
          </div>
        )}
      </footer>

    </div>
  );
}