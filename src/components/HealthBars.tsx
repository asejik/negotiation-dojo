// src/components/HealthBars.tsx

import { type HealthBarState } from '../useGeminiLive';

interface HealthBarsProps {
  healthBars: HealthBarState;
  playerName?: string;
}

export const HealthBars = ({ healthBars, playerName = "YOU" }: HealthBarsProps) => {
  const { userConfidence, viperPatience, roundNumber, gameStatus, lastUserAction, lastViperReaction } = healthBars;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Top HUD - Street Fighter Style */}
      <div className="flex justify-between items-center gap-4 mb-2">

        {/* Player Side */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-emerald-400 font-bold text-sm tracking-wider">
              {playerName}
            </span>
            <span className="text-emerald-400 font-mono text-xs">
              {userConfidence}%
            </span>
          </div>

          {/* Player Health Bar */}
          <div className="h-6 bg-gray-800 rounded-sm border-2 border-emerald-900 overflow-hidden relative">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${userConfidence}%`,
                background: userConfidence > 50
                  ? 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)'
                  : userConfidence > 25
                  ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
                  : 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
              }}
            />
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
          </div>

          {/* Last action */}
          <p className="text-xs text-gray-500 mt-1 truncate h-4">
            {lastUserAction}
          </p>
        </div>

        {/* VS / Round Counter */}
        <div className="flex flex-col items-center px-4">
          <span className="text-yellow-500 font-bold text-lg">VS</span>
          <span className="text-gray-500 text-xs">Round {roundNumber}</span>
        </div>

        {/* Viper Side */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-red-400 font-mono text-xs">
              {viperPatience}%
            </span>
            <span className="text-red-400 font-bold text-sm tracking-wider">
              VIPER 🐍
            </span>
          </div>

          {/* Viper Health Bar (reversed direction) */}
          <div className="h-6 bg-gray-800 rounded-sm border-2 border-red-900 overflow-hidden relative">
            <div
              className="h-full transition-all duration-500 ease-out ml-auto"
              style={{
                width: `${viperPatience}%`,
                background: viperPatience > 50
                  ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                  : viperPatience > 25
                  ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
                  : 'linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
          </div>

          {/* Last reaction */}
          <p className="text-xs text-gray-500 mt-1 truncate h-4 text-right">
            {lastViperReaction}
          </p>
        </div>
      </div>

      {/* Game Status Overlay */}
      {gameStatus === 'won' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-emerald-400 mb-4 animate-pulse">
              🏆 YOU WIN!
            </h2>
            <p className="text-xl text-gray-300">Viper's patience broke. You got the deal!</p>
          </div>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-red-500 mb-4 animate-pulse">
              💀 DEFEATED
            </h2>
            <p className="text-xl text-gray-300">Your confidence crumbled. Better luck next time.</p>
          </div>
        </div>
      )}
    </div>
  );
};