import { useGameStore } from '../store/gameStore';

export function GameHeader() {
  const state = useGameStore((s) => s.state);
  return (
    <header
      className="bg-slate-900/80 backdrop-blur border-b border-amber-500/30 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 shrink-0"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <h1 className="text-lg sm:text-2xl font-bold text-amber-300 truncate">【情书】桌游</h1>
      <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="text-slate-300 whitespace-nowrap">
          <span className="text-slate-500">回合</span> {state.round}·{state.turn}
        </div>
        <div className="text-slate-300 whitespace-nowrap hidden sm:inline">
          <span className="text-slate-500">牌</span> {state.deck.length}
        </div>
        <div className="text-slate-300 whitespace-nowrap hidden sm:inline">
          <span className="text-slate-500">弃</span> {state.discard.length}
        </div>
        <div className="text-slate-300 whitespace-nowrap hidden sm:inline">
          <span className="text-slate-500">移</span> {state.removed.length + state.removedPublic.length}
        </div>
        <div className="text-amber-300 font-bold whitespace-nowrap">
          🎯 {state.targetTokens}
        </div>
      </div>
    </header>
  );
}

