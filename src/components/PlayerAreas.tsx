import type { Player } from '../types';
import PlayerArea from '../PlayerArea';
import { useGameStore } from '../store/gameStore';

interface PlayerAreasProps {
  showTargetSelector: boolean;
  validTargets: Player[];
}

export default function PlayerAreas({ showTargetSelector, validTargets }: PlayerAreasProps) {
  const { gameState, handlePlayerSelect } = useGameStore();

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className="flex justify-center gap-3 flex-wrap p-2">
      {gameState.players.map(player => (
        <PlayerArea
          key={player.id}
          player={player}
          isCurrentPlayer={player.id === currentPlayer.id}
          isHuman={player.type === 'human'}
          showHand={true}
          onSelectPlayer={
            showTargetSelector && player.id !== currentPlayer.id && !player.isEliminated && !player.isProtected
              ? () => handlePlayerSelect(player.id)
              : undefined
          }
          selectable={
            !!(
              showTargetSelector &&
              player.id !== currentPlayer.id &&
              !player.isEliminated &&
              !player.isProtected &&
              validTargets.some(t => t.id === player.id)
            )
          }
        />
      ))}
    </div>
  );
}