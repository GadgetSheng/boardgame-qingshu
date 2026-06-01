import { useGameStore } from '../store/gameStore';

export function GameHeader() {
  const state = useGameStore((s) => s.state);
  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-amber-500/30 px-6 py-3 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-amber-300">情书 · 2019 扩展版</h1>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-slate-300">
          <span className="text-slate-500">回合</span> {state.round} · {state.turn}
        </div>
        <div className="text-slate-300">
          <span className="text-slate-500">牌库</span> {state.deck.length}
        </div>
        <div className="text-slate-300">
          <span className="text-slate-500">弃牌</span> {state.discard.length}
        </div>
        <div className="text-slate-300">
          <span className="text-slate-500">移除</span> {state.removed.length + state.removedPublic.length}
        </div>
        <div className="text-amber-300 font-bold">
          目标 {state.targetTokens} 标记
        </div>
      </div>
    </header>
  );
}
