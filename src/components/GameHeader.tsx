import type { Player } from '../types';

interface GameHeaderProps {
  players: Player[];
  onRestart: () => void;
}

export default function GameHeader({ players, onRestart }: GameHeaderProps) {
  return (
    <div className="flex justify-between items-center p-2 px-4 bg-amber-100 rounded-lg border-2 border-amber-700">
      <div className="flex gap-5 text-sm text-gray-700 font-serif">
        <span className="px-2 py-1 bg-amber-100/50 rounded">本局21张牌</span>
      </div>
      <div className="flex gap-2">
        {players.filter(p => p.tokens > 0).map(p => (
          <span key={p.id} className="px-2 py-1 bg-amber-200 rounded text-sm font-serif">{p.name}: {p.tokens}❤️</span>
        ))}
      </div>
      <button
        className="px-4 py-2 text-sm font-serif bg-red-700 text-white border border-amber-500 rounded-md cursor-pointer hover:bg-red-900 transition"
        onClick={onRestart}
      >
        重新开始
      </button>
    </div>
  );
}