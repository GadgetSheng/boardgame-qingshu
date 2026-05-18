import type { CardName } from '../types';
import { CARD_NAMES_CN } from '../types';
import { useGameStore } from '../store/gameStore';
import Card from '../Card';

export default function CardPlayer() {
  const {
    gameState,
    selectedCard,
    targetPlayerId,
    guardGuess,
    handleCardClick,
    handleGuessSelect,
    handlePlayCard,
    canPlayCard,
  } = useGameStore();

  if (!gameState) return null;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.type !== 'human') return null;
  if (currentPlayer.hand === null) {
    return (
      <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
        <div className="w-[120px] h-[168px] flex items-center justify-center text-gray-400 font-serif">无手牌</div>
      </div>
    );
  }

  const showTargetSelector = selectedCard && ['Priest', 'Baron', 'Prince', 'King'].includes(selectedCard);

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
      <div className="font-bold font-serif text-gray-700">你的手牌</div>
      <div className="flex items-center gap-4">
        <Card name={currentPlayer.hand} onClick={() => handleCardClick(currentPlayer.hand!)} />
      </div>

      {selectedCard && (
        <div className="flex flex-col items-center gap-3">
          {selectedCard === 'Guard' && (
            <div className="flex flex-col items-center gap-2">
              {guardGuess === null ? (
                <>
                  <div className="text-sm text-gray-700 font-serif">猜测对方的卡牌:</div>
                  <div className="flex flex-wrap gap-1 justify-center max-w-[400px]">
                    {useGameStore.getState().getValidGuessesList().map((guess: CardName) => (
                      <button
                        key={guess}
                        className="px-3 py-1.5 text-xs bg-amber-700 border border-amber-500 rounded text-white cursor-pointer hover:bg-amber-600 transition"
                        onClick={() => handleGuessSelect(guess)}
                      >
                        {CARD_NAMES_CN[guess]}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-sm text-green-700 font-serif">已选择猜测: {CARD_NAMES_CN[guardGuess]}</div>
              )}
            </div>
          )}

          {selectedCard !== 'Guard' && (
            <button
              className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-red-800 to-red-900 text-white border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={handlePlayCard}
              disabled={!canPlayCard()}
            >
              出牌 {CARD_NAMES_CN[selectedCard]}
            </button>
          )}

          {selectedCard === 'Guard' && guardGuess !== null && (
            <button
              className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-red-800 to-red-900 text-white border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={handlePlayCard}
              disabled={!canPlayCard()}
            >
              出牌 {CARD_NAMES_CN[selectedCard]}
            </button>
          )}
        </div>
      )}

      {showTargetSelector && (
        <div className="text-sm text-gray-600 font-serif">点击选择目标玩家</div>
      )}

      {selectedCard && selectedCard !== 'Guard' && ['Priest', 'Baron', 'Prince', 'King'].includes(selectedCard) && (
        <div className="text-sm text-red-700 font-serif">
          {targetPlayerId !== null
            ? `目标: ${gameState.players.find(p => p.id === targetPlayerId)?.name}`
            : '请选择目标玩家'}
        </div>
      )}
    </div>
  );
}