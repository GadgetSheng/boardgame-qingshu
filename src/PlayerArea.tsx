import type { Player as PlayerType, CardName } from './types';
import Card from './Card';

interface PlayerAreaProps {
  player: PlayerType;
  isCurrentPlayer: boolean;
  isHuman: boolean;
  knownCard?: CardName;
  onSelectPlayer?: () => void;
  showHand?: boolean;
  selectable?: boolean;
}

export default function PlayerArea({
  player,
  isCurrentPlayer,
  isHuman,
  knownCard,
  onSelectPlayer,
  showHand = false,
  selectable = false,
}: PlayerAreaProps) {
  const displayCard = showHand && player.hand ? player.hand : (knownCard || (player.hand && isHuman ? player.hand : null));
  const faceDown = !displayCard && player.hand !== null;

  const baseClass = 'flex flex-col items-center p-2 rounded-lg transition-all';
  const currentClass = isCurrentPlayer ? 'border-2 border-amber-500 bg-amber-100/60 shadow-lg shadow-amber-500/30' : 'border-2 border-transparent bg-yellow-50/30';
  const eliminatedClass = player.isEliminated ? 'opacity-50' : '';
  const protectedClass = player.isProtected ? 'bg-green-100/20' : '';
  const selectableClass = selectable ? 'border-2 border-green-600 bg-green-200/30 shadow-lg shadow-green-500/50 cursor-pointer hover:bg-green-200/50' : '';

  return (
    <div
      className={`${baseClass} ${currentClass} ${eliminatedClass} ${protectedClass} ${selectableClass}`}
      onClick={onSelectPlayer}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm font-bold text-gray-700 font-serif">{player.name}</span>
        {player.type === 'easy-ai' && <span className="text-xs text-gray-500">(简单)</span>}
        {player.type === 'normal-ai' && <span className="text-xs text-gray-500">(普通)</span>}
        {player.isProtected && <span>🛡️</span>}
      </div>

      <div className="min-h-[90px] flex items-center justify-center">
        {player.isEliminated ? (
          <div className="text-gray-400 line-through italic">已淘汰</div>
        ) : displayCard ? (
          <Card name={displayCard} faceDown={faceDown && !isHuman} small />
        ) : (
          <div className="w-[60px] h-[84px] rounded bg-red-800 border-2 border-amber-500 flex items-center justify-center">
            <span className="text-amber-500 text-xl font-bold">?</span>
          </div>
        )}
      </div>

      {isCurrentPlayer && <div className="mt-1 text-xs text-red-700 font-bold">当前回合</div>}
    </div>
  );
}