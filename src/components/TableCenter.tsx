import { useGameStore } from '../store/gameStore';
import { Card } from './Card';

export function TableCenter() {
  const state = useGameStore((s) => s.state);
  const topDeck = state.deck[state.deck.length - 1];
  return (
    <div className="bg-slate-900/60 border border-amber-500/30 rounded-lg p-4 flex items-center gap-6">
      <div className="text-center">
        <div className="text-xs text-slate-400 mb-1">牌库 ({state.deck.length})</div>
        <Card card={topDeck} faceDown size="md" />
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400 mb-1">弃牌堆 ({state.discard.length})</div>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {state.discard.slice(-5).map((c) => (
            <Card key={c.id} card={c} size="sm" />
          ))}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400 mb-1">移除 ({state.removed.length + state.removedPublic.length})</div>
        <div className="flex gap-1">
          {state.removed.slice(-2).map((c) => (
            <Card key={c.id} card={c} faceDown size="sm" />
          ))}
          {state.removedPublic.map((c) => (
            <Card key={c.id} card={c} size="sm" />
          ))}
        </div>
        {state.removedPublic.length > 0 && (
          <div className="text-[10px] text-amber-400 mt-1">2 人局公开移除</div>
        )}
      </div>
    </div>
  );
}
