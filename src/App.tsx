import { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { Game } from './components/Game';
import { GameOverModal } from './components/GameOverModal';
import { useGameStore } from './store/gameStore';

export function App() {
  const [started, setStarted] = useState(false);
  const state = useGameStore((s) => s.state);
  const newGame = useGameStore((s) => s.actions.newGame);

  if (!started) {
    return <SetupScreen onStart={(aiCount) => { newGame(aiCount); setStarted(true); }} />;
  }
  return (
    <>
      <Game />
      {state.phase === 'GAME_OVER' && state.winner != null && (
        <GameOverModal
          winnerName={state.players[state.winner].name}
          onRestart={() => { setStarted(false); }}
        />
      )}
    </>
  );
}
