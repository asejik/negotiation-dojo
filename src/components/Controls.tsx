import { Mic, MicOff } from 'lucide-react';

export const Controls = ({ isConnected, onStart, onStop, disabled }: any) => (
  <footer className="h-24 flex-none bg-slate-950 flex items-center justify-center gap-4 border-t border-slate-800">
    <button
      onClick={isConnected ? onStop : onStart}
      disabled={disabled}
      className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold text-lg transition-all ${
        isConnected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
      } disabled:opacity-50`}
    >
      {isConnected ? <><MicOff size={20}/> END SESSION</> : <><Mic size={20}/> START NEGOTIATION</>}
    </button>
  </footer>
);