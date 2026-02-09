// src/components/PlayerView.tsx
import { Shield, Eye, User, Mic } from 'lucide-react';
import { type BodyLanguageState } from '../hooks/useGameLogic';

interface PlayerViewProps {
  confidence: number;
  lastAction: string;
  bodyLanguage: BodyLanguageState;
  // FIX: Explicitly allow 'null' to match the useRef definition
  videoRef: React.RefObject<HTMLVideoElement | null>;
  volumeLevel: number;
  isConnected: boolean;
}

export const PlayerView = ({ confidence, lastAction, bodyLanguage, videoRef, volumeLevel, isConnected }: PlayerViewProps) => {
  return (
    <section className="flex-1 relative border-r border-slate-700 bg-black flex items-center justify-center p-4">
      {/* Confidence Bar */}
      <div className="absolute top-4 left-4 z-10 w-72">
        <div className="flex justify-between text-blue-400 font-bold text-xs uppercase mb-1">
          <div className="flex items-center gap-2"><Shield size={14}/> Confidence</div>
          <span className="font-mono">{confidence}%</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
           <div className="h-full transition-all duration-500" style={{ width: `${confidence}%`, background: confidence > 50 ? '#3b82f6' : '#ef4444' }} />
        </div>
        <p className="text-xs text-slate-500 mt-1 truncate">{lastAction}</p>
      </div>

      {/* Body Language */}
      {isConnected && (
        <div className="absolute top-24 left-4 z-10 space-y-2">
           <div className="text-xs uppercase text-slate-500 font-bold">📹 Body Language</div>
           <div className="flex gap-2 text-xs text-slate-400"><Eye size={12}/> Eyes: {bodyLanguage.eyeContact}</div>
           <div className="flex gap-2 text-xs text-slate-400"><User size={12}/> Posture: {bodyLanguage.posture}</div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        autoPlay
        muted
        playsInline
        className="w-full max-w-lg aspect-square object-cover rounded-lg border-2 border-slate-700 transform scale-x-[-1]"
      />

      {/* Volume */}
      {isConnected && (
        <div className="absolute bottom-16 left-4 flex gap-2 items-center">
           <Mic size={14} className={volumeLevel > 2 ? 'text-emerald-400' : 'text-slate-600'} />
           <div className="w-24 h-1 bg-slate-800 rounded"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, volumeLevel * 10)}%` }}/></div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 text-slate-500 font-mono text-xs">YOU (CANDIDATE)</div>
    </section>
  );
};