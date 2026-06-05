import clsx from 'clsx';
import type { Card, Player } from '../types';
import { Card as CardView } from './Card';

interface Props {
  player: Player;
  isCurrentTurn: boolean;
  isOwnHand?: boolean;
  mustDiscard?: boolean;
  onPlayCard?: (cardId: string) => void;
  selectableCardIds?: Set<string>;
  onSelectPlayer?: (playerId: number) => void;
  targetMode?: boolean;
  facing?: 'top' | 'bottom' | 'side';
  width?: number;
  discards?: Card[];
  elementRef?: (el: HTMLDivElement | null) => void;
}

export function PlayerArea({
  player,
  isCurrentTurn,
  isOwnHand = false,
  mustDiscard,
  onPlayCard,
  selectableCardIds,
  onSelectPlayer,
  targetMode,
  facing = 'top',
  width,
  discards = [],
  elementRef,
}: Props) {
  if (!player.alive) {
    return (
      <div
        ref={elementRef}
        className="bg-slate-900/40 border border-slate-700 rounded-lg p-2 opacity-50"
        style={width ? { width } : undefined}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 line-through">{player.name}</span>
          <span className="text-xs text-rose-500">已出局</span>
        </div>
        {discards.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {discards.map((c) => (
              <CardView key={c.id} card={c} size="sm" forceFaceUp />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isTargetable = targetMode && !player.protected && onSelectPlayer;
  const hand = player.hand;
  const cardSize: 'sm' | 'md' | 'lg' = width && width < 240 ? 'sm' : 'md';

  return (
    <div
      ref={elementRef}
      onClick={isTargetable ? () => onSelectPlayer?.(player.id) : undefined}
      className={clsx(
        'rounded-lg p-2 border-2 transition-all',
        isCurrentTurn
          ? 'bg-amber-900/40 border-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800/60 border-slate-700',
        player.protected && 'ring-2 ring-emerald-400',
        isTargetable && 'cursor-pointer hover:border-rose-400 hover:scale-[1.02]',
      )}
      style={width ? { width } : undefined}
    >
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={clsx(
              'font-bold truncate',
              player.isHuman ? 'text-amber-300' : 'text-slate-200',
            )}
          >
            {player.name}
            {player.isHuman && <span className="text-xs ml-1 text-amber-400">(你)</span>}
          </span>
          {player.protected && (
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white rounded shrink-0">🛡</span>
          )}
          {player.usedSpy && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-600 text-slate-200 rounded shrink-0">🕵</span>
          )}
        </div>
        <span className="text-amber-300 font-bold text-sm shrink-0" title="胜利标记">
          🏆 {player.tokens}
        </span>
      </div>
      <div
        className={clsx(
          'flex gap-1.5',
          facing === 'top' ? 'justify-end' : facing === 'side' ? 'justify-center' : 'justify-start',
        )}
      >
        {hand.length === 0 ? (
          <span className="text-slate-500 text-xs">无手牌</span>
        ) : (
          hand.map((c) => (
            <CardView
              key={c.id}
              card={c}
              size={cardSize}
              forceFaceUp={isOwnHand}
              peekOnHover={!isOwnHand}
              onClick={
                onPlayCard && selectableCardIds?.has(c.id) ? () => onPlayCard(c.id) : undefined
              }
              selected={selectableCardIds?.has(c.id)}
              dim={mustDiscard && c.name !== '女伯爵'}
            />
          ))
        )}
      </div>
      {discards.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-700/60">
          <div className="text-[10px] text-slate-500 mb-0.5">弃牌</div>
          <div
            className={clsx(
              'flex gap-1 flex-wrap',
              facing === 'top' ? 'justify-end' : facing === 'side' ? 'justify-center' : 'justify-start',
            )}
          >
            {discards.map((c) => (
              <CardView key={c.id} card={c} size="sm" forceFaceUp />
            ))}
          </div>
        </div>
      )}
      {mustDiscard && (
        <div className="mt-1 text-[10px] text-rose-300">⚠ 强制出 [女伯爵]</div>
      )}
    </div>
  );
}