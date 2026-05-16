import { useState } from 'react';
import type { PlayerType } from './types';
import SetupScreen from './SetupScreen';
import Game from './Game';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [aiTypes, setAiTypes] = useState<PlayerType[]>([]);

  const handleStart = (_count: number, ais: PlayerType[]) => {
    setAiTypes(ais);
    setGameStarted(true);
  };

  const handleRestart = () => {
    setGameStarted(false);
  };

  return (
    <div className="app">
      {!gameStarted ? (
        <SetupScreen onStart={handleStart} />
      ) : (
        <Game aiTypes={aiTypes} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;