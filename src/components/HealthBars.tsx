// src/components/HealthBars.tsx
import { type HealthBarState } from '../hooks/useGameLogic'; // FIX: Update import path

interface HealthBarsProps {
  healthBars: HealthBarState;
  playerName?: string;
}

export const HealthBars = ({ healthBars, playerName = "YOU" }: HealthBarsProps) => {
  const { userConfidence, viperPatience, lastViperReaction } = healthBars;

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
                  : 'linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
              }}
            />
            {/* Glossy effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex-none px-2">
          <span className="text-red-600 font-black text-2xl italic tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
            VS
          </span>
        </div>

        {/* Viper Side */}
        <div className="flex-1 text-right">
          <div className="flex justify-between items-center mb-1">
            <span className="text-red-400 font-mono text-xs">
              {viperPatience}%
            </span>
            <span className="text-red-400 font-bold text-sm tracking-wider">
              VIPER
            </span>
          </div>

          {/* Viper Health Bar */}
          <div className="h-6 bg-gray-800 rounded-sm border-2 border-red-900 overflow-hidden relative">
            <div
              className="h-full transition-all duration-500 ease-out float-right"
              style={{
                width: `${viperPatience}%`,
                background: viperPatience < 30
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
    </div>
  );
};