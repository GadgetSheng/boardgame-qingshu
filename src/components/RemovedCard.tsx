import { useGameStore } from '../store/gameStore';
import Card from '../Card';

export default function RemovedCard() {
  const { gameState } = useGameStore();

  if (!gameState) return null;
  if (!gameState.removedCard) return null;

  return (
    <div className="fixed left-4 bottom-4 w-[80px] bg-amber-100 rounded-lg border-2 border-amber-700 flex flex-col overflow-hidden">
      <div className="px-2 py-1 text-xs font-bold font-serif text-gray-700 bg-amber-200 border-b border-amber-700 text-center">
        移出
      </div>
      <div className="p-2 flex justify-center">
        <Card name={gameState.removedCard} small />
      </div>
    </div>
  );
}