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
  compact?: boolean;
  hideDiscards?: boolean;
  seatIndex?: number;
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
  compact = false,
  hideDiscards = false,
  seatIndex,
}: Props) {
  if (!player.alive) {
    return (
      <div
        ref={elementRef}
        className="bg-slate-900/40 border border-slate-700 rounded-lg p-1.5 opacity-50"
        style={width ? { width } : undefined}
      >
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 min-w-0">
            {seatIndex != null && (
              <span
                className="shrink-0 inline-flex items-center justify-center rounded-full font-bold leading-none w-3.5 h-3.5 text-[9px] bg-slate-700 text-slate-300"
                title={`座号 ${seatIndex}`}
              >
                {seatIndex}
              </span>
            )}
            <span className="text-slate-500 line-through truncate">{player.name}</span>
          </div>
          <span className="text-[10px] text-rose-500 shrink-0 ml-1">出局</span>
        </div>
        {!hideDiscards && discards.length > 0 && (
          <div className="mt-1 flex gap-0.5 flex-wrap">
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
  const cardSize: 'sm' | 'md' | 'lg' = compact || (width != null && width < 240) ? 'sm' : 'md';

  return (
    <div
      ref={elementRef}
      onClick={isTargetable ? () => onSelectPlayer?.(player.id) : undefined}
      className={clsx(
        'rounded-lg border-2 transition-all',
        compact ? 'p-1.5' : 'p-2',
        isCurrentTurn
          ? 'bg-amber-900/40 border-amber-400 shadow-lg shadow-amber-500/20'
          : 'bg-slate-800/60 border-slate-700',
        player.protected && 'ring-2 ring-emerald-400',
        isTargetable && 'cursor-pointer hover:border-rose-400 active:scale-[0.98]',
      )}
      style={width ? { width } : undefined}
    >
      <div className={clsx('flex items-center justify-between', compact ? 'mb-0.5 text-[11px]' : 'mb-1.5 text-sm')}>
        <div className="flex items-center gap-1 min-w-0">
          {seatIndex != null && (
            <span
              className={clsx(
                'shrink-0 inline-flex items-center justify-center rounded-full font-bold leading-none',
                compact ? 'w-3.5 h-3.5 text-[9px]' : 'w-4 h-4 text-[10px]',
                player.isHuman
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-600 text-slate-100',
              )}
              title={`座号 ${seatIndex}`}
            >
              {seatIndex}
            </span>
          )}
          <span
            className={clsx(
              'font-bold truncate',
              player.isHuman ? 'text-amber-300' : 'text-slate-200',
            )}
          >
            {player.name}
          </span>
          {player.protected && <span className="text-[10px] shrink-0">🛡</span>}
          {player.usedSpy && <span className="text-[10px] shrink-0">🕵</span>}
        </div>
        <span className="text-amber-300 font-bold shrink-0 ml-1" title="胜利标记">
          🏆{player.tokens}
        </span>
      </div>
      <div
        className={clsx(
          'flex',
          compact ? 'gap-0.5' : 'gap-1.5',
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
      {!hideDiscards && discards.length > 0 && (
        <div className={clsx('border-t border-slate-700/60', compact ? 'mt-0.5 pt-0.5' : 'mt-1.5 pt-1.5')}>
          <div
            className={clsx('flex', compact ? 'gap-0.5' : 'gap-1 flex-wrap')}
          >
            {discards.slice(-(compact ? 3 : 6)).map((c) => (
              <CardView key={c.id} card={c} size="sm" forceFaceUp />
            ))}
          </div>
        </div>
      )}
      {mustDiscard && (
        <div className={clsx('text-rose-300', compact ? 'mt-0.5 text-[9px]' : 'mt-1 text-[10px]')}>
          ⚠ 强制出 [女伯爵]
        </div>
      )}
    </div>
  );
}
