// src/App.tsx
import { useEffect } from 'react';
import { Header } from './components/Header';
import { PlayerView } from './components/PlayerView';
import { ViperView } from './components/ViperView';
import { Controls } from './components/Controls';
import { WinLoseOverlay } from './components/WinLoseOverlay';
import { useGeminiLive } from './useGeminiLive';
import { useGeminiAnalysis } from './useGeminiAnalysis';

export default function App() {
  const {
    isConnected, isSessionReady, volumeLevel, isSpeaking,
    healthBars, bodyLanguage, recording, videoRef,
    startNegotiation, stopNegotiation, resetGame, forceWin, downloadRecording
  } = useGeminiLive();

  const { isAnalyzing, analysis, analyzeSession, clearAnalysis } = useGeminiAnalysis();

  // Trigger analysis on Game End
  useEffect(() => {
    if ((healthBars.gameStatus === 'won' || healthBars.gameStatus === 'lost') && recording.sessionStats && !analysis && !isAnalyzing) {
      analyzeSession(recording.sessionStats, healthBars.gameStatus);
    }
  }, [healthBars.gameStatus, recording.sessionStats]);

  const handlePlayAgain = () => {
    resetGame();
    clearAnalysis();
    startNegotiation();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white overflow-hidden relative">
      <WinLoseOverlay
        gameStatus={healthBars.gameStatus}
        analysis={analysis}
        isAnalyzing={isAnalyzing}
        recording={recording}
        onDownload={downloadRecording}
        onPlayAgain={handlePlayAgain}
      />

      <Header isSessionReady={isSessionReady} isConnected={isConnected} roundNumber={healthBars.roundNumber} recording={recording} />

      {/* DEV CHEAT BUTTON */}
      <button
        onClick={forceWin}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-1 rounded text-xs opacity-50 hover:opacity-100 transition-opacity"
      >
        DEV CHEAT: FORCE WIN
      </button>

      <main className="flex-1 flex flex-col md:flex-row">
        <PlayerView
          confidence={healthBars.userConfidence}
          lastAction={healthBars.lastUserAction}
          bodyLanguage={bodyLanguage}
          videoRef={videoRef}
          volumeLevel={volumeLevel}
          isConnected={isConnected}
        />
        <ViperView
          patience={healthBars.viperPatience}
          lastReaction={healthBars.lastViperReaction}
          isSpeaking={isSpeaking}
          volumeLevel={volumeLevel}
        />
      </main>

      <Controls
        isConnected={isConnected}
        onStart={startNegotiation}
        onStop={stopNegotiation}
        disabled={healthBars.gameStatus === 'won' || healthBars.gameStatus === 'lost'}
      />
    </div>
  );
}