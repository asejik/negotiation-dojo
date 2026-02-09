import { Video } from 'lucide-react';

interface HeaderProps {
  isSessionReady: boolean;
  isConnected: boolean;
  roundNumber: number;
  recording: { isRecording: boolean; recordingDuration: number };
}

export const Header = ({ isSessionReady, isConnected, roundNumber, recording }: HeaderProps) => {
  const formatDuration = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-slate-700 bg-slate-950">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full transition-all ${
          isSessionReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
          isConnected ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
        }`} />
        <h1 className="text-xl font-bold tracking-wider">NEGOTIATION<span className="text-red-500">DOJO</span></h1>
      </div>

      <div className="flex items-center gap-4">
        {recording.isRecording && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-1 rounded border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <Video size={14} />
            <span className="font-mono">{formatDuration(recording.recordingDuration)}</span>
          </div>
        )}
        {isConnected && <div className="text-yellow-500 font-mono text-sm px-3 py-1 bg-yellow-500/10 rounded">ROUND {roundNumber}</div>}
      </div>
    </header>
  );
};