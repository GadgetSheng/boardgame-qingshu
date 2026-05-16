import { useState, useEffect, useCallback } from 'react';
import type { GameState, CardName, PlayerType } from './types';
import { setupGame, drawCard, playCard, getValidTargets, getValidGuesses, chancellorChooseCard, getCardPoints, chooseDrawnCard } from './gameLogic';
import { makeAIDecision, makeChancellorChoice } from './ai';
import Card from './Card';
import PlayerArea from './PlayerArea';
import { CARD_NAMES_CN } from './types';

interface GameProps {
  aiTypes: PlayerType[];
  onRestart: () => void;
}

export default function Game({ aiTypes, onRestart }: GameProps) {
  const [state, setState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardName | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<number | null>(null);
  const [guardGuess, setGuardGuess] = useState<CardName | null>(null);
  const [showGuessSelector, setShowGuessSelector] = useState(false);
  const [showDrawnCards, setShowDrawnCards] = useState(false);
  const [selectedDrawnCard, setSelectedDrawnCard] = useState<CardName | null>(null);
  const [isChancellorPlayed, setIsChancellorPlayed] = useState(false);

  const initGame = useCallback(() => {
    const playerTypes: PlayerType[] = ['human', ...aiTypes];
    const gameState = setupGame(playerTypes);
    setState(gameState);
    setSelectedCard(null);
    setTargetPlayerId(null);
    setGuardGuess(null);
    setShowGuessSelector(false);
    setShowDrawnCards(false);
    setSelectedDrawnCard(null);
    setIsChancellorPlayed(false);
  }, [aiTypes]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!state) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'human') {
      const timeout = setTimeout(() => {
        executeAITurn();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [state?.currentPlayerIndex, state?.phase, state?.handChoices.length]);

  const executeAITurn = useCallback(() => {
    if (!state) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;

    let gameState = state;

    if (gameState.handChoices.length > 0) {
      const keptCard = makeChancellorChoice(gameState);
      gameState = chancellorChooseCard(gameState, keptCard);
      setState({ ...gameState });
      return;
    }

    if (gameState.deck.length > 0 && currentPlayer.hand === null) {
      gameState = drawCard(gameState);
      setState({ ...gameState });
      return;
    }

    const decision = makeAIDecision(gameState);

    if (decision.cardName && currentPlayer.hand) {
      gameState = playCard(gameState, decision.cardName, decision.targetId, decision.guess);
      if (decision.cardName === 'Chancellor') {
        setIsChancellorPlayed(true);
      }
      setState({ ...gameState });

      if (gameState.handChoices.length > 0) {
        setTimeout(() => executeAITurn(), 1000);
        return;
      }

      // After playing a non-Chancellor card, auto-draw if hand is null
      const afterPlayPlayer = gameState.players[gameState.currentPlayerIndex];
      if (afterPlayPlayer.hand === null && gameState.deck.length > 0) {
        gameState = drawCard(gameState);
        setState({ ...gameState });
        setTimeout(() => executeAITurn(), 500);
        return;
      }

      const nextPlayer = gameState.players[gameState.currentPlayerIndex];
      if (nextPlayer.type !== 'human' && gameState.phase === 'playing') {
        setTimeout(() => executeAITurn(), 1000);
      }
    }
  }, [state]);

  const autoDrawIfNeeded = useCallback(() => {
    if (!state) return;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'human' || state.phase !== 'playing') return;
    if (state.deck.length > 0) {
      const newState = drawCard(state);
      setState(newState);
    }
  }, [state]);

  useEffect(() => {
    autoDrawIfNeeded();
  }, [state?.currentPlayerIndex, autoDrawIfNeeded]);

  const handleCardClick = (cardName: CardName) => {
    if (!state) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;
    if (currentPlayer.hand !== cardName) return;

    setSelectedCard(cardName);

    const cardNeedsTarget = ['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(cardName);
    if (cardNeedsTarget) {
      const targets = getValidTargets(state, cardName);
      if (targets.length === 1) {
        setTargetPlayerId(targets[0].id);
      } else {
        setTargetPlayerId(null);
      }
    }

    if (cardName === 'Guard') {
      setShowGuessSelector(true);
    }
  };

  const handlePlayerSelect = (playerId: number) => {
    if (!state || !selectedCard) return;
    setTargetPlayerId(playerId);
  };

  const handleGuessSelect = (guess: CardName) => {
    setGuardGuess(guess);
    setShowGuessSelector(false);
  };

  const handleChancellorSelect = (keptCard: CardName) => {
    if (!state) return;
    const newState = chancellorChooseCard(state, keptCard);
    setState(newState);
    setIsChancellorPlayed(false);
  };

  const handlePlayCard = () => {
    if (!state || !selectedCard) return;

    let targetId: number | undefined;

    if (['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(selectedCard)) {
      if (targetPlayerId !== null) {
        targetId = targetPlayerId;
      } else {
        const targets = getValidTargets(state, selectedCard);
        if (targets.length === 1) {
          targetId = targets[0].id;
        } else {
          return;
        }
      }
    }

    if (selectedCard === 'Guard' && guardGuess === null) {
      return;
    }

    const newState = playCard(state, selectedCard, targetId, guardGuess ?? undefined);
    setState(newState);
    setSelectedCard(null);
    setTargetPlayerId(null);
    setGuardGuess(null);
    setShowGuessSelector(false);

    if (newState.phase === 'gameover') {
      return;
    }

    if (newState.handChoices.length > 0) {
      return;
    }

    // Auto-draw if hand is null after playing
    const afterPlayPlayer = newState.players[newState.currentPlayerIndex];
    if (afterPlayPlayer.hand === null && newState.deck.length > 0) {
      const drawnState = drawCard(newState);
      setState(drawnState);
      return;
    }

    const nextPlayer = newState.players[newState.currentPlayerIndex];
    if (nextPlayer.type !== 'human' && newState.phase === 'playing') {
      setTimeout(() => {
        setState(drawCard(newState));
      }, 500);
    }
  };

  const handleDrawnCardClick = (cardName: CardName) => {
    if (!state) return;
    setSelectedDrawnCard(cardName);
  };

  const handleConfirmDrawnCard = () => {
    if (!state || !selectedDrawnCard) return;
    const newState = chooseDrawnCard(state, selectedDrawnCard);
    setState(newState);
    setSelectedCard(null);
    setTargetPlayerId(null);
    setGuardGuess(null);
    setShowGuessSelector(false);
    setShowDrawnCards(false);
    setSelectedDrawnCard(null);
  };

  if (!state) return <div className="min-h-screen flex items-center justify-center text-2xl text-amber-100">加载中...</div>;

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer.type === 'human' && state.phase === 'playing';
  const isChancellorPhase = state.handChoices.length > 0 && isChancellorPlayed && currentPlayer.type === 'human';

  const showTargetSelector = selectedCard && ['Priest', 'Baron', 'Prince', 'King'].includes(selectedCard);
  const validTargets = showTargetSelector ? getValidTargets(state, selectedCard) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-950 to-red-900 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center p-2 px-4 bg-amber-100 rounded-lg border-2 border-amber-700">
        <div className="flex gap-5 text-sm text-gray-700 font-serif">
          <span className="px-2 py-1 bg-amber-100/50 rounded">牌堆: {state.deck.length}张</span>
          <span className="px-2 py-1 bg-amber-100/50 rounded">弃牌: {state.discardPile.length}张</span>
        </div>
        <div className="flex gap-2">
          {state.players.filter(p => p.tokens > 0).map(p => (
            <span key={p.id} className="px-2 py-1 bg-amber-200 rounded text-sm font-serif">{p.name}: {p.tokens}分</span>
          ))}
        </div>
        <button className="px-4 py-2 text-sm font-serif bg-red-700 text-amber-100 border border-amber-500 rounded-md cursor-pointer hover:bg-red-900 transition" onClick={onRestart}>重新开始</button>
      </div>

      {/* Message */}
      <div className="text-center p-3 text-lg font-serif text-amber-100 bg-red-900/60 rounded-lg border border-amber-500">{state.message}</div>

      {/* Players */}
      <div className="flex justify-center gap-3 flex-wrap p-2">
        {state.players.map(player => (
          <PlayerArea
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            isHuman={player.type === 'human'}
            showHand={player.type === 'human' ? true : (player.id === state.currentPlayerIndex && player.hand ? true : false)}
            onSelectPlayer={
              showTargetSelector && player.id !== currentPlayer.id && !player.isEliminated && !player.isProtected
                ? () => handlePlayerSelect(player.id)
                : undefined
            }
            selectable={!!(showTargetSelector && player.id !== currentPlayer.id && !player.isEliminated && !player.isProtected && validTargets.some(t => t.id === player.id))}
          />
        ))}
      </div>

      {/* Table Center */}
      <div className="flex justify-center items-center gap-10 p-5 bg-amber-900/20 rounded-2xl border-2 border-amber-500/30">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-[120px] h-[168px] rounded-lg bg-red-800 border-2 border-amber-500 flex items-center justify-center">
              <div className="w-[90%] h-[85%] border border-amber-500 rounded flex items-center justify-center text-amber-500 text-3xl bg-amber-500/10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(218,165,32,0.1)_5px,rgba(218,165,32,0.1)_10px)]">?</div>
            </div>
          </div>
          <div className="text-sm text-amber-500 font-bold font-serif">{state.deck.length}</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-amber-400 font-serif">弃牌区</div>
          <div className="flex flex-wrap gap-1 max-w-[200px] justify-center">
            {state.discardPile.map((card, i) => (
              <Card key={`${card}-${i}`} name={card} small />
            ))}
          </div>
        </div>
      </div>

      {/* Chancellor Phase */}
      {isChancellorPhase && (
        <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
          <div className="font-bold font-serif text-gray-700">大臣发动！选择保留的卡牌</div>
          <div className="flex gap-4 justify-center">
            {(state.handChoicesOrder || state.handChoices.map((_, i) => i)).map(idx => (
              <Card key={`${state.handChoices[idx]}-${idx}`} name={state.handChoices[idx]} onClick={() => handleChancellorSelect(state.handChoices[idx])} />
            ))}
          </div>
        </div>
      )}

      {/* Draw Phase */}
      {isHumanTurn && !isChancellorPhase && showDrawnCards && state.handChoices.length > 0 && (
        <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
          <div className="font-bold font-serif text-gray-700">抽牌！选择1张打出</div>
          <div className="flex gap-4 justify-center">
            {state.handChoices.map((card, i) => (
              <Card key={`${card}-${i}`} name={card} onClick={() => handleDrawnCardClick(card)} selected={selectedDrawnCard === card} />
            ))}
          </div>
          <button
            className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-red-800 to-red-900 text-amber-100 border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={handleConfirmDrawnCard}
            disabled={!selectedDrawnCard}
          >
            打出 {selectedDrawnCard ? CARD_NAMES_CN[selectedDrawnCard] : ''}
          </button>
        </div>
      )}

      {/* Human Turn */}
      {isHumanTurn && !isChancellorPhase && !showDrawnCards && (
        <div className="flex flex-col items-center gap-4 p-5 bg-amber-100 rounded-xl border-2 border-amber-700">
          <div className="font-bold font-serif text-gray-700">你的手牌</div>
          <div className="flex items-center gap-4">
            {currentPlayer.hand ? (
              <Card name={currentPlayer.hand} onClick={() => handleCardClick(currentPlayer.hand!)} />
            ) : (
              <div className="w-[120px] h-[168px] flex items-center justify-center text-gray-400 font-serif">无手牌</div>
            )}
          </div>

          {selectedCard && (
            <div className="flex flex-col items-center gap-3">
              {selectedCard === 'Guard' && showGuessSelector ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-gray-700 font-serif">猜测对方的卡牌:</div>
                  <div className="flex flex-wrap gap-1 justify-center max-w-[400px]">
                    {getValidGuesses().map((guess: CardName) => (
                      <button key={guess} className="px-3 py-1.5 text-xs bg-amber-100 border border-amber-700 rounded cursor-pointer hover:bg-amber-200 transition" onClick={() => handleGuessSelect(guess)}>
                        {CARD_NAMES_CN[guess]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  className="px-8 py-4 text-lg font-serif bg-gradient-to-b from-red-800 to-red-900 text-amber-100 border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  onClick={handlePlayCard}
                  disabled={selectedCard === 'Guard' && !guardGuess}
                >
                  出牌 {CARD_NAMES_CN[selectedCard]}
                </button>
              )}
            </div>
          )}

          {showTargetSelector && validTargets.length > 1 && (
            <div className="text-sm text-gray-600 font-serif">点击选择目标玩家</div>
          )}

          {selectedCard && ['Priest', 'Baron', 'Prince', 'King'].includes(selectedCard) && targetPlayerId !== null && (
            <div className="text-sm text-red-700 font-serif">目标: {state.players.find(p => p.id === targetPlayerId)?.name}</div>
          )}
        </div>
      )}

      {/* Game Log */}
      <div className="fixed right-4 top-20 w-[200px] max-h-[400px] bg-amber-100 rounded-lg border-2 border-amber-700 flex flex-col overflow-hidden">
        <div className="px-3 py-2 text-sm font-bold font-serif text-gray-700 bg-amber-200 border-b border-amber-700">游戏日志</div>
        <div className="flex-1 overflow-y-auto p-2">
          {state.log.slice(-20).map((entry, i) => (
            <div key={i} className="text-[11px] font-serif text-gray-700 py-1 border-b border-amber-200/30">{entry}</div>
          ))}
        </div>
      </div>

      {/* Game Over */}
      {state.phase === 'gameover' && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center gap-6 z-50">
          <div className="text-4xl font-serif text-amber-500 drop-shadow-lg">{state.message}</div>
          <div className="bg-amber-100 rounded-xl p-6 border-2 border-amber-700">
            {state.players
              .filter(p => !p.isEliminated)
              .sort((a, b) => {
                const aPts = a.hand ? getCardPoints(a.hand) : 0;
                const bPts = b.hand ? getCardPoints(b.hand) : 0;
                return bPts - aPts;
              })
              .map(player => (
                <div key={player.id} className="flex justify-between gap-10 py-2 text-lg font-serif text-gray-700 border-b border-amber-300/30">
                  <span>{player.name} {player.tokens > 0 ? `(+${player.tokens})` : ''}</span>
                  <span>{player.hand ? CARD_NAMES_CN[player.hand] : '-'}</span>
                </div>
              ))}
          </div>
          <button className="px-8 py-4 text-xl font-serif bg-gradient-to-b from-red-800 to-red-900 text-amber-100 border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition" onClick={onRestart}>再来一局</button>
        </div>
      )}
    </div>
  );
}