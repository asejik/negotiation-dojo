import { Activity, Zap } from 'lucide-react';

interface ViperViewProps {
  patience: number;
  lastReaction: string;
  isSpeaking: boolean;
  volumeLevel: number;
}

export const ViperView = ({ patience, lastReaction, isSpeaking }: ViperViewProps) => {
  return (
    <section className="flex-1 relative bg-slate-900 flex items-center justify-center p-4">
      {/* Patience Bar */}
      <div className="absolute top-4 right-4 z-10 w-72 text-right">
        <div className="flex justify-end gap-2 text-red-400 font-bold text-xs uppercase mb-1">
          <span className="font-mono">{patience}%</span>
          <div className="flex gap-2">Patience <Activity size={14}/></div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
           <div className="h-full bg-red-500 transition-all duration-500 ml-auto" style={{ width: `${patience}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-1 truncate">{lastReaction}</p>
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={`w-48 h-48 rounded-full bg-slate-800 border-4 flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'border-red-500 shadow-red-500/50 shadow-lg' : 'border-slate-600'}`}>
           <Zap size={64} className={isSpeaking ? 'text-red-500' : 'text-slate-500'} />
        </div>
      </div>
      <div className="absolute bottom-4 right-4 text-red-500 font-mono text-xs font-bold">VIPER (AI) 🐍</div>
    </section>
  );
};