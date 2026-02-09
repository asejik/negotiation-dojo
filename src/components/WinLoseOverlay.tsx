// src/components/WinLoseOverlay.tsx
import {
  Trophy, Skull, Brain, Loader2, TrendingUp, Lightbulb,
  Award, Target, Download, RotateCcw, TrendingDown
} from 'lucide-react';

interface GameOverlayProps {
  gameStatus: 'won' | 'lost' | 'idle' | 'active'; // Match your HealthBarState
  analysis: any;
  isAnalyzing: boolean;
  recording: {
    sessionStats: any;
    recordingUrl: string | null;
  };
  onDownload: () => void;     // Renamed to match App.tsx usage
  onPlayAgain: () => void;    // Renamed to match App.tsx usage
}

// Helper functions moved inside or you can pass them as props
const formatDuration = (seconds: number) => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,'0')}`;
const getScoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';

export const WinLoseOverlay = ({ // EXPORTED CORRECTLY
  gameStatus,
  analysis,
  isAnalyzing,
  recording,
  onDownload,
  onPlayAgain
}: GameOverlayProps) => {
  if (gameStatus !== 'won' && gameStatus !== 'lost') return null;

  const isWin = gameStatus === 'won';

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-y-auto py-8">
      <div className="text-center space-y-6 max-w-4xl mx-4">
        {isWin ? (
          <>
            <Trophy size={80} className="mx-auto text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
            <h2 className="text-5xl font-black text-emerald-400 tracking-wider">VICTORY!</h2>
            <p className="text-xl text-slate-300">Viper's patience crumbled. You negotiated like a champion!</p>
          </>
        ) : (
          <>
            <Skull size={80} className="mx-auto text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse" />
            <h2 className="text-5xl font-black text-red-500 tracking-wider">DEFEATED</h2>
            <p className="text-xl text-slate-300">Your confidence shattered. Viper wins this round.</p>
          </>
        )}

        <div className={`bg-slate-800/50 rounded-lg p-6 text-left border ${isWin ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
            <Brain size={20} /> AI Coach Analysis
            <span className="text-xs text-slate-500 font-normal">(Powered by Gemini 3)</span>
          </h3>

          {isAnalyzing && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 size={24} className={`animate-spin ${isWin ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-slate-400">Gemini 3 is analyzing your performance...</span>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Overall', value: analysis.score.overall },
                  { label: 'Confidence', value: analysis.score.confidence },
                  { label: 'Strategy', value: analysis.score.strategy },
                  { label: 'Composure', value: analysis.score.composure },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 bg-slate-700/50 rounded">
                    <div className={`text-2xl font-bold ${getScoreColor(item.value)}`}>{item.value}</div>
                    <div className="text-xs text-slate-400">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-700/30 rounded">
                <p className="text-slate-300 italic">"{analysis.overallAssessment}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className={`text-sm font-bold flex items-center gap-2 mb-2 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isWin ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isWin ? 'Strengths' : 'What Went Wrong'}
                  </h4>
                  <ul className="space-y-1">
                    {(isWin ? analysis.strengthsIdentified : analysis.areasForImprovement).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className={isWin ? "text-emerald-400" : "text-red-400"}>{isWin ? '✓' : '✗'}</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-2">
                    <Lightbulb size={14} /> {isWin ? 'Areas to Improve' : 'Tips for Next Time'}
                  </h4>
                  <ul className="space-y-1">
                    {(isWin ? analysis.areasForImprovement : analysis.personalizedTips).map((item: string, i: number) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-yellow-400">{isWin ? '→' : '💡'}</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={`p-3 rounded border ${isWin ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <h4 className={`text-sm font-bold flex items-center gap-2 mb-1 ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                  <Award size={14} /> Coach's Message
                </h4>
                <p className="text-sm text-slate-300">{analysis.coachingScript}</p>
              </div>

              <div className="text-xs text-slate-500">
                <strong>Next:</strong> {analysis.nextScenarioRecommendation}
              </div>
            </div>
          )}
        </div>

        {recording.sessionStats && (
          <div className="bg-slate-800/30 rounded-lg p-4 text-left border border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-2">
              <Target size={14} /> Session Stats
            </h4>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div><span className="text-slate-500">Duration:</span> <span className="ml-1 text-white font-mono">{formatDuration(recording.sessionStats.totalDuration)}</span></div>
              <div><span className="text-slate-500">Rounds:</span> <span className="ml-1 text-white font-mono">{recording.sessionStats.totalRounds}</span></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {recording.recordingUrl && (
            <button onClick={onDownload} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all">
              <Download size={18} /> Download Recording
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all ${isWin ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400' : 'bg-red-600 text-white hover:bg-red-500'}`}
          >
            <RotateCcw size={20} /> {isWin ? 'PLAY AGAIN' : 'TRY AGAIN'}
          </button>
        </div>
      </div>
    </div>
  );
};