import { useEffect } from 'react';
import type { PlayerType } from './types';
import { useGameStore } from './store/gameStore';
import GameHeader from './components/GameHeader';
import PlayerAreas from './components/PlayerAreas';
import TableCenter from './components/TableCenter';
import CardPlayer from './components/CardPlayer';
import ChancellorPhase from './components/ChancellorPhase';
import DrawPhase from './components/DrawPhase';
import WaitingConfirm from './components/WaitingConfirm';
import GameLog from './components/GameLog';
import CardTracker from './components/CardTracker';
import GameOverModal from './components/GameOverModal';
import RemovedCard from './components/RemovedCard';
import { getValidTargets } from './gameLogic';

interface GameProps {
  aiTypes: PlayerType[];
  onRestart: () => void;
}

export default function Game({ aiTypes, onRestart }: GameProps) {
  const {
    gameState,
    initGame,
    executeAITurn,
  } = useGameStore();

  useEffect(() => {
    initGame(aiTypes);
  }, [initGame, aiTypes]);

  // 自动抽牌
  useEffect(() => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.phase === 'select-target' || gameState.waitingForNextTurn) return;
    if (gameState.handChoices.length > 0) return;
    if (gameState.deck.length === 0) return;

    if (currentPlayer.type !== 'human' && gameState.phase === 'playing') {
      const timeout = setTimeout(() => executeAITurn(), 1200);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase, executeAITurn, gameState?.deck.length]);

  // AI回合自动执行
  useEffect(() => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (currentPlayer.type !== 'human' && !gameState.waitingForNextTurn && gameState.phase === 'playing') {
      const timeout = setTimeout(() => executeAITurn(), 1200);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.currentPlayerIndex, gameState?.phase]);

  if (!gameState) {
    return <div className="min-h-screen flex items-center justify-center text-2xl text-amber-900">加载中...</div>;
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer.type === 'human' && (gameState.phase === 'playing' || gameState.phase === 'select-target');
  const isChancellorPhase = gameState.handChoices.length > 0 && currentPlayer.type === 'human' && gameState.phase !== 'select-card';

  const selectedCard = useGameStore.getState().selectedCard;
  const showTargetSelector = selectedCard && ['Priest', 'Baron', 'Prince', 'King'].includes(selectedCard);
  const validTargets = showTargetSelector ? getValidTargets(gameState, selectedCard) : [];

  return (
    <div className="min-h-screen bg-[length:20px_20px] bg-[linear-gradient(45deg,#e8e8e8_25%,transparent_25%),linear-gradient(-45deg,#e8e8e8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f5f5f5_75%),linear-gradient(-45deg,transparent_75%,#f5f5f5_75%)] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-4 flex flex-col gap-3">
      <GameHeader players={gameState.players} onRestart={onRestart} />

      <div className="text-center p-3 text-lg font-serif text-amber-900 bg-amber-100/80 backdrop-blur-sm rounded-lg border border-amber-500">
        {gameState.message}
      </div>

      <PlayerAreas showTargetSelector={!!showTargetSelector} validTargets={validTargets} />

      <TableCenter />

      {isChancellorPhase && <ChancellorPhase />}

      {isHumanTurn && !isChancellorPhase && gameState.phase === 'select-card' && gameState.handChoices.length > 0 && (
        <DrawPhase />
      )}

      {isHumanTurn && !isChancellorPhase && gameState.phase !== 'select-card' && (
        <CardPlayer />
      )}

      {isHumanTurn && gameState.waitingForNextTurn && <WaitingConfirm />}

      <GameLog />
      <CardTracker />
      <RemovedCard />
      <GameOverModal onRestart={onRestart} />
    </div>
  );
}