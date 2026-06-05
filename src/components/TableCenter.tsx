import { useGameStore } from '../store/gameStore';
import { Card } from './Card';

export function TableCenter() {
  const state = useGameStore((s) => s.state);
  const topDeck = state.deck[state.deck.length - 1];

  return (
    <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl p-2 sm:p-4 flex flex-col min-w-0 w-full h-full max-w-2xl relative overflow-hidden">
      {/* 牌库 - 左下（顶张不可看） */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-col items-center gap-1 z-10">
        <Card card={topDeck} size="sm" />
        <div className="text-[10px] sm:text-xs text-slate-400 mt-1">牌库 {state.deck.length}</div>
      </div>

      {/* 移除堆 - 右下（hover/点按 翻牌查看） */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col items-center gap-1 z-10">
        <div className="flex gap-1 flex-wrap justify-end max-w-[140px] sm:max-w-[200px]">
          {state.removed.slice(-3).map((c) => (
            <Card key={c.id} card={c} size="sm" peekOnHover />
          ))}
          {state.removedPublic.map((c) => (
            <Card key={c.id} card={c} size="sm" forceFaceUp />
          ))}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
          移除 {state.removed.length + state.removedPublic.length}
        </div>
        {state.removedPublic.length > 0 && (
          <div className="text-[10px] text-amber-400">2人局公开</div>
        )}
        {state.removed.length > 0 && (
          <div className="text-[10px] text-slate-500 hidden sm:block">hover 看牌</div>
        )}
      </div>

      {/* 中央装饰 */}
      <div className="flex-1 flex items-center justify-center min-h-[80px] sm:min-h-[180px]">
        <div className="text-slate-600 text-xs sm:text-sm select-none px-12 text-center">
          弃牌在各玩家位旁
        </div>
      </div>
    </div>
  );
}

