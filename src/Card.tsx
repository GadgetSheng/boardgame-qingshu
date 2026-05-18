import type { CardName } from './types';
import { getCardInfo, CARD_NAMES_CN } from './types';
import clsx from 'clsx';

interface CardProps {
  name: CardName;
  faceDown?: boolean;
  onClick?: () => void;
  small?: boolean;
  disabled?: boolean;
  selected?: boolean;
}

const CARD_IMAGES: Record<CardName, string> = {
  Spy: '🕵️',
  Guard: '🛡️',
  Priest: '📜',
  Baron: '⚔️',
  Handmaid: '🌹',
  Prince: '🤴',
  Chancellor: '👴',
  King: '👑',
  Countess: '👩',
  Princess: '💌',
};

export default function Card({ name, faceDown, onClick, small, disabled, selected }: CardProps) {
  const sizeClass = small ? 'w-[60px] h-[84px] text-[10px]' : 'w-[120px] h-[168px]';
  const iconSize = small ? 'text-[20px]' : 'text-[36px]';
  const nameSize = small ? 'text-[8px]' : 'text-xs';
  const pointsSize = small ? 'text-[10px]' : 'text-sm';

  if (faceDown) {
    return (
      <div className={clsx('card card-back', sizeClass, disabled && 'opacity-60 cursor-not-allowed', selected && 'card-selected')}>
        <div className="card-back-design">
          <span>?</span>
        </div>
      </div>
    );
  }

  const info = getCardInfo(name);

  return (
    <div
      className={clsx('card card-front', sizeClass, disabled && 'opacity-60 cursor-not-allowed', onClick && 'card-clickable', selected && 'card-selected')}
      onClick={onClick}
    >
      <div className={clsx('card-icon', iconSize)}>{CARD_IMAGES[name]}</div>
      <div className={clsx('card-name', nameSize)}>{CARD_NAMES_CN[name]}</div>
      <div className={clsx('card-points', pointsSize)}>{info.points}</div>
      {!small && <div className="card-desc text-[8px]">{info.description}</div>}
    </div>
  );
}