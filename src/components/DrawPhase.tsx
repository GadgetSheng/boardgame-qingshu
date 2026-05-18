import { useGameStore } from '../store/gameStore';
import Card from '../Card';
import { CARD_NAMES_CN } from '../types';

export default function DrawPhase() {
  const { gameState, selectedDrawnCard, handleDrawnCardClick, handleConfirmDrawnCard } = useGameStore();

  if (!gameState) return null;
  if (gameState.phase !== 'select-card') return null;
  if (gameState.handChoices.length === 0) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.type !== 'human') return null;

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
      <div className="font-bold font-serif text-gray-700">抽牌！选择1张打出</div>
      <div className="flex gap-4 justify-center">
        {gameState.handChoices.map((card, i) => (
          <Card
            key={`${card}-${i}`}
            name={card}
            onClick={() => handleDrawnCardClick(card)}
            selected={selectedDrawnCard === card}
          />
        ))}
      </div>
      <button
        className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-red-800 to-red-900 text-white border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        onClick={handleConfirmDrawnCard}
        disabled={!selectedDrawnCard}
      >
        打出 {selectedDrawnCard ? CARD_NAMES_CN[selectedDrawnCard] : ''}
      </button>
    </div>
  );
}