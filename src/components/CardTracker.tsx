import type { CardName } from '../types';
import { CARDS, CARD_NAMES_CN } from '../types';
import { useGameStore } from '../store/gameStore';

export default function CardTracker() {
  const { gameState } = useGameStore();

  if (!gameState) return null;

  return (
    <div className="fixed left-4 top-20 w-[160px] bg-amber-100 rounded-lg border-2 border-amber-700 flex flex-col overflow-hidden">
      <div className="px-3 py-2 text-sm font-bold font-serif text-gray-700 bg-amber-200 border-b border-amber-700">
        记牌器
      </div>
      <div className="p-2 flex flex-col gap-0.5">
        {CARDS.map(card => {
          const totalInGame = card.count;
          const otherPlayersHands = gameState.players.slice(1).map(p => p.hand).filter((h): h is CardName => h !== null);
          const inOthersHands = otherPlayersHands.filter(c => c === card.name).length;
          const inDiscard = gameState.discardPile.filter(c => c === card.name).length;
          const revealed = inDiscard + inOthersHands;

          return (
            <div
              key={card.name}
              className={`flex justify-between text-xs font-serif py-0.5 ${revealed === totalInGame ? 'text-red-500 font-bold' : 'text-gray-600'}`}
            >
              <span>{CARD_NAMES_CN[card.name]}</span>
              <span>{revealed}/{totalInGame}</span>
            </div>
          );
        })}
        <div className="mt-2 pt-2 border-t border-amber-300 flex justify-between text-xs font-serif py-0.5 text-gray-700 font-bold">
          <span>牌堆</span>
          <span>{gameState.deck.length}张</span>
        </div>
      </div>
    </div>
  );
}