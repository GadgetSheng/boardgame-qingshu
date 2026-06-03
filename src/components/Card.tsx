import clsx from 'clsx';
import type { Card as CardType } from '../types';
import { CARD_DEFS } from '../types';

const CARD_INFO: Record<string, { desc: string }> = CARD_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.name]: { desc: (def as { desc: string }).desc } }),
  {} as Record<string, { desc: string }>,
);

const COLOR_MAP: Record<string, string> = {
  red: 'from-rose-600 to-rose-800 border-rose-400',
  yellow: 'from-amber-500 to-amber-700 border-amber-300',
  orange: 'from-orange-500 to-orange-700 border-orange-300',
  green: 'from-emerald-500 to-emerald-700 border-emerald-300',
  blue: 'from-sky-500 to-sky-700 border-sky-300',
  gray: 'from-slate-500 to-slate-700 border-slate-300',
};

interface Props {
  card?: CardType;
  /** 强制正面（玩家自己手牌） */
  forceFaceUp?: boolean;
  /** 是否可 hover 翻牌（AI 手牌、移除堆） */
  peekOnHover?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  dim?: boolean;
  className?: string;
}

export function Card({
  card,
  forceFaceUp,
  peekOnHover,
  size = 'md',
  selected,
  onClick,
  dim,
  className,
}: Props) {
  const sizeClass = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-20 h-28 text-sm',
    lg: 'w-24 h-36 text-base',
  }[size];

  if (!card) {
    return (
      <div
        onClick={onClick}
        className={clsx(
          'rounded-lg border-2 bg-gradient-to-br from-indigo-700 to-indigo-900 border-indigo-400 flex items-center justify-center text-amber-300 font-bold shadow-md',
          sizeClass,
          onClick && 'cursor-pointer hover:scale-105 transition-transform',
          selected && 'ring-4 ring-amber-400',
          className,
        )}
      >
        ?
      </div>
    );
  }

  const def = CARD_DEFS.find((d) => d.name === card.name);
  const colorClass = COLOR_MAP[def?.color ?? 'gray'];

  // 玩家自己手牌：正面，hover 显示功能介绍
  if (forceFaceUp) {
    const info = CARD_INFO[card.name];
    return (
      <div className={clsx('relative group', sizeClass)} style={{ display: 'inline-block' }}>
        <div
          onClick={onClick}
          className={clsx(
            'rounded-lg border-2 bg-gradient-to-br flex flex-col items-center justify-between p-1 shadow-md transition-all w-full h-full',
            colorClass,
            onClick && 'cursor-pointer hover:scale-105 hover:shadow-xl',
            selected && 'ring-4 ring-amber-400 scale-105',
            dim && 'opacity-40 grayscale',
            className,
          )}
        >
          <div className="text-2xl font-bold text-white drop-shadow">{card.value}</div>
          <div className="text-white font-bold text-center leading-tight drop-shadow">
            {card.name}
          </div>
          <div className="text-white text-[10px] opacity-70">{card.value} 点</div>
        </div>
        {info && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-amber-500/60 rounded-lg p-2 text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal">
            {info.desc}
          </div>
        )}
      </div>
    );
  }

  // 默认背面；peekOnHover 时 hover 翻牌
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group [perspective:600px]',
        sizeClass,
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ display: 'inline-block' }}
    >
      <div
        className={clsx(
          'relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500',
          peekOnHover && 'group-hover:[transform:rotateY(180deg)]',
          selected && 'ring-4 ring-amber-400 rounded-lg',
        )}
      >
        {/* 背面：统一蓝色 */}
        <div
          className={clsx(
            'absolute inset-0 rounded-lg border-2 bg-gradient-to-br from-indigo-700 to-indigo-900 border-indigo-400 flex items-center justify-center text-amber-300 font-bold shadow-md [backface-visibility:hidden]',
            peekOnHover && 'group-hover:shadow-xl',
            dim && 'opacity-50',
          )}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-2xl drop-shadow">❀</div>
            <div className="text-[9px] tracking-widest opacity-80">LOVE LETTER</div>
          </div>
        </div>
        {/* 正面：旋转 180° 藏在背面下 */}
        <div
          className={clsx(
            'absolute inset-0 rounded-lg border-2 bg-gradient-to-br flex flex-col items-center justify-between p-1 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]',
            colorClass,
            dim && 'opacity-70',
          )}
        >
          <div className="text-2xl font-bold text-white drop-shadow">{card.value}</div>
          <div className="text-white font-bold text-center leading-tight drop-shadow">
            {card.name}
          </div>
          <div className="text-white text-[10px] opacity-70">{card.value} 点</div>
        </div>
      </div>
    </div>
  );
}
