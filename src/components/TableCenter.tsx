import { useGameStore } from '../store/gameStore';
import Card from '../Card';

export default function TableCenter() {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  return (
    <div className="flex justify-center items-center gap-10 p-5 bg-amber-900/20 rounded-2xl border-2 border-amber-500/30">
      {/* Deck */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-[120px] h-[168px] rounded-lg bg-red-800 border-2 border-amber-500 flex items-center justify-center">
            <div className="w-[90%] h-[85%] border border-amber-500 rounded flex items-center justify-center text-amber-500 text-3xl bg-amber-500/10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(218,165,32,0.1)_5px,rgba(218,165,32,0.1)_10px)]">
              ?
            </div>
          </div>
        </div>
        <div className="text-sm text-amber-500 font-bold font-serif">{gameState.deck.length}</div>
      </div>

      {/* Discard */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-amber-400 font-serif">弃牌区</div>
        <div className="flex flex-wrap gap-1 max-w-[200px] justify-center">
          {gameState.discardPile.map((card, i) => (
            <Card key={`${card}-${i}`} name={card} small />
          ))}
        </div>
      </div>
    </div>
  );
}