import { useGameStore } from '../store/gameStore';

export default function WaitingConfirm() {
  const { gameState, handleConfirmTurn } = useGameStore();

  if (!gameState) return null;
  if (!gameState.waitingForNextTurn) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.type !== 'human') return null;

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
      <button
        className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-green-700 to-green-900 text-white border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition"
        onClick={handleConfirmTurn}
      >
        继续 - 到下一玩家回合
      </button>
    </div>
  );
}