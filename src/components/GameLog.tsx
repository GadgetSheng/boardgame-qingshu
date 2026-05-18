import { useGameStore } from '../store/gameStore';

export default function GameLog() {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  return (
    <div className="fixed right-4 top-20 w-[200px] max-h-[400px] bg-amber-100 rounded-lg border-2 border-amber-700 flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-sm font-bold font-serif text-gray-700 bg-amber-200 border-b border-amber-700">
        游戏日志
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {gameState.log.map((entry, i) => (
          <div key={i} className="text-[11px] font-serif text-gray-700 py-1 border-b border-amber-200/30">
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}