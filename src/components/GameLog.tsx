import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function GameLog() {
  const state = useGameStore((s) => s.state);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);

  const me = state.humanPlayerId;

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 h-full flex flex-col">
      <h2 className="text-amber-300 font-bold text-sm mb-2 sticky top-0">📜 游戏日志</h2>
      <div ref={ref} className="flex-1 overflow-y-auto space-y-1 text-xs">
        {state.log.map((e) => {
          const canSeeSecret = !!e.secret && !!e.knownBy?.includes(me);
          const tail = e.secret
            ? canSeeSecret
              ? e.secret
              : ' **'
            : '';
          const display = `${e.text}${tail}`;
          return (
            <div
              key={e.id}
              className={`px-2 py-1 rounded ${
                e.text.includes('出局') || e.text.includes('全局胜利')
                  ? 'bg-rose-900/40 text-rose-200'
                  : e.text.includes('摸') || e.text.includes('打出') || e.text.includes('摸了')
                  ? 'bg-amber-900/20 text-amber-100'
                  : 'text-slate-300'
              }`}
              title={
                e.secret && !canSeeSecret ? '被遮蔽的内容在浏览器控制台有完整记录' : undefined
              }
            >
              {display}
            </div>
          );
        })}
      </div>
    </div>
  );
}
