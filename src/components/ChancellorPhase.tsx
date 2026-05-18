import { useGameStore } from '../store/gameStore';
import Card from '../Card';

export default function ChancellorPhase() {
  const { gameState, handleChancellorSelect } = useGameStore();

  if (!gameState) return null;
  if (gameState.handChoices.length === 0) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.type !== 'human') return null;

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
      <div className="font-bold font-serif text-gray-700">大臣发动！选择保留的卡牌</div>
      <div className="flex gap-4 justify-center">
        {(gameState.handChoicesOrder || gameState.handChoices.map((_, i) => i)).map(idx => (
          <Card
            key={`${gameState.handChoices[idx]}-${idx}`}
            name={gameState.handChoices[idx]}
            onClick={() => handleChancellorSelect(gameState.handChoices[idx])}
          />
        ))}
      </div>
    </div>
  );
}