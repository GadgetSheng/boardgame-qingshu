import clsx from 'clsx';
import type { Player } from '../types';
import { Card } from './Card';

interface Props {
  player: Player;
  isCurrentTurn: boolean;
  mustDiscard?: boolean;
  onPlayCard?: (cardId: string) => void;
  selectableCardIds?: Set<string>;
  onSelectPlayer?: (playerId: number) => void;
  targetMode?: boolean;
  facing?: 'top' | 'bottom';
}

export function PlayerArea({
  player,
  isCurrentTurn,
  mustDiscard,
  onPlayCard,
  selectableCardIds,
  onSelectPlayer,
  targetMode,
  facing = 'top',
}: Props) {
  if (!player.alive) {
    return (
      <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 opacity-50">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 line-through">{player.name}</span>
          <span className="text-xs text-rose-500">已出局</span>
        </div>
      </div>
    );
  }

  const isTargetable = targetMode && !player.protected && onSelectPlayer;
  const hand = player.hand;

  return (
    <div
      onClick={isTargetable ? () => onSelectPlayer?.(player.id) : undefined}
      className={clsx(
        'rounded-lg p-3 border-2 transition-all',
        isCurrentTurn
          ? 'bg-amber-900/40 border-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800/60 border-slate-700',
        player.protected && 'ring-2 ring-emerald-400',
        isTargetable && 'cursor-pointer hover:border-rose-400 hover:scale-[1.02]',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'font-bold',
              player.isHuman ? 'text-amber-300' : 'text-slate-200',
            )}
          >
            {player.name}
            {player.isHuman && <span className="text-xs ml-1 text-amber-400">(你)</span>}
          </span>
          {player.protected && (
            <span className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded">🛡 免疫</span>
          )}
          {player.usedSpy && (
            <span className="text-xs px-2 py-0.5 bg-slate-600 text-slate-200 rounded">🕵 用过间谍</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-300 font-bold text-lg" title="胜利标记">
            🏆 {player.tokens}
          </span>
        </div>
      </div>
      <div className={clsx('flex gap-2', facing === 'top' ? 'justify-end' : 'justify-start')}>
        {hand.length === 0 ? (
          <span className="text-slate-500 text-xs">无手牌</span>
        ) : (
          hand.map((c) => (
            <Card
              key={c.id}
              card={c}
              size="md"
              onClick={
                onPlayCard && selectableCardIds?.has(c.id) ? () => onPlayCard(c.id) : undefined
              }
              selected={selectableCardIds?.has(c.id)}
              dim={mustDiscard && c.name !== '伯爵夫人'}
            />
          ))
        )}
      </div>
      {mustDiscard && (
        <div className="mt-2 text-xs text-rose-300">⚠ 强制出 [伯爵夫人]</div>
      )}
    </div>
  );
}
