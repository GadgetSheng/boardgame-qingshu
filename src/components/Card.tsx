import clsx from 'clsx';
import type { Card as CardType } from '../types';
import { CARD_DEFS } from '../types';

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
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  dim?: boolean;
  className?: string;
}

export function Card({ card, faceDown, size = 'md', selected, onClick, dim, className }: Props) {
  const sizeClass = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-20 h-28 text-sm',
    lg: 'w-24 h-36 text-base',
  }[size];

  if (faceDown || !card) {
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
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg border-2 bg-gradient-to-br flex flex-col items-center justify-between p-1 shadow-md transition-all',
        colorClass,
        sizeClass,
        onClick && 'cursor-pointer hover:scale-105 hover:shadow-xl',
        selected && 'ring-4 ring-amber-400 scale-105',
        dim && 'opacity-40 grayscale',
        className,
      )}
    >
      <div className="text-2xl font-bold text-white drop-shadow">{card.value}</div>
      <div className="text-white font-bold text-center leading-tight drop-shadow">{card.name}</div>
      <div className="text-white text-[10px] opacity-70">{card.value} 点</div>
    </div>
  );
}
