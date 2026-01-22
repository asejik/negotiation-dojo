import { useState, useEffect } from 'react';
import { useGeminiLive } from './useGeminiLive';
import { Mic, MicOff, Shield, Activity, Zap } from 'lucide-react';

export default function App() {
  const { isConnected, volumeLevel, isSpeaking, startNegotiation, stopNegotiation, videoRef } = useGeminiLive();
  const [confidence, setConfidence] = useState(100);
  const [patience, setPatience] = useState(85);

  // Simulator Effect: Makes bars move alive
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setConfidence(c => Math.max(0, c - (Math.random() > 0.7 ? 1 : 0)));
      setPatience(p => Math.max(0, p - (Math.random() > 0.8 ? 2 : 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-white overflow-hidden">

      {/* 1. HEADER */}
      <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-slate-700 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
          <h1 className="text-xl font-bold tracking-wider">NEGOTIATION<span className="text-red-500">DOJO</span></h1>
        </div>
        <div className="text-sm font-mono text-slate-400">SCENARIO: VIPER_001</div>
      </header>

      {/* 2. MAIN BATTLEFIELD (Split Screen) */}
      <main className="flex-1 flex flex-col md:flex-row">

        {/* LEFT: PLAYER SIDE */}
        <section className="flex-1 relative border-r border-slate-700 bg-black flex items-center justify-center p-4">

          {/* Player HUD */}
          <div className="absolute top-4 left-4 z-10 w-64">
             <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-1">
                <Shield size={14} /> Confidence
             </div>
             <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
               <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${confidence}%` }} />
             </div>
          </div>

          {/* Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-lg aspect-square object-cover rounded-lg border-2 border-slate-700 shadow-2xl transform scale-x-[-1]"
          />

          <div className="absolute bottom-4 left-4 text-slate-500 font-mono text-xs">YOU (CANDIDATE)</div>
        </section>

        {/* RIGHT: AI SIDE */}
        <section className="flex-1 relative bg-slate-900 flex items-center justify-center p-4">

          {/* AI HUD */}
          <div className="absolute top-4 right-4 z-10 w-64 text-right">
             <div className="flex items-center justify-end gap-2 text-red-400 font-bold text-xs uppercase mb-1">
                Patience <Activity size={14} />
             </div>
             <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
               <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${patience}%` }} />
             </div>
          </div>

          {/* Avatar / Visualizer */}
          <div className="relative">
            {/* Pulse Ring */}
            <div
              className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl transition-all duration-100"
              style={{ transform: `scale(${1 + volumeLevel/80})`, opacity: volumeLevel > 1 ? 1 : 0 }}
            />
            {/* Avatar Icon */}
            <div className={`w-48 h-48 rounded-full bg-slate-800 border-4 border-slate-600 flex items-center justify-center relative z-10 ${isSpeaking ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : ''}`}>
               <Zap size={64} className="text-slate-200" />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-red-500 font-mono text-xs font-bold">VIPER (AI)</div>
        </section>

      </main>

      {/* 3. FOOTER CONTROLS */}
      <footer className="h-24 flex-none bg-slate-950 flex items-center justify-center border-t border-slate-800">
        <button
          onClick={isConnected ? stopNegotiation : startNegotiation}
          className={`
            flex items-center gap-3 px-8 py-3 rounded-full font-bold text-lg transition-all
            ${isConnected
              ? 'bg-red-600 text-white hover:bg-red-700 ring-4 ring-red-900/30'
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 ring-4 ring-emerald-900/30'
            }
          `}
        >
          {isConnected ? <><MicOff size={20} /> END SESSION</> : <><Mic size={20} /> START NEGOTIATION</>}
        </button>
      </footer>

    </div>
  );
}