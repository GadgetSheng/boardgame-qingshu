import { getCardInfo, CARD_NAMES_CN } from '../types';
import { useGameStore } from '../store/gameStore';

interface GameOverModalProps {
  onRestart: () => void;
}

export default function GameOverModal({ onRestart }: GameOverModalProps) {
  const { gameState } = useGameStore();

  if (!gameState) return null;
  if (gameState.phase !== 'gameover') return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center gap-6 z-50">
      <div className="text-4xl font-serif text-amber-500 drop-shadow-lg">{gameState.message}</div>
      <div className="bg-amber-100 rounded-xl p-6 border-2 border-amber-700">
        {gameState.players
          .filter(p => !p.isEliminated)
          .sort((a, b) => {
            const aPts = a.hand ? getCardInfo(a.hand).points : 0;
            const bPts = b.hand ? getCardInfo(b.hand).points : 0;
            return bPts - aPts;
          })
          .map(player => (
            <div
              key={player.id}
              className="flex justify-between gap-10 py-2 text-lg font-serif text-gray-700 border-b border-amber-300/30"
            >
              <span>
                {player.name} {player.tokens > 0 ? `(+${player.tokens})` : ''}
              </span>
              <span>{player.hand ? CARD_NAMES_CN[player.hand] : '-'}</span>
            </div>
          ))}
      </div>
      <button
        className="px-8 py-4 text-xl font-serif bg-gradient-to-b from-red-800 to-red-900 text-white border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition"
        onClick={onRestart}
      >
        再来一局
      </button>
    </div>
  );
}