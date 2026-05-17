export type CardName =
  | 'Spy'
  | 'Guard'
  | 'Priest'
  | 'Baron'
  | 'Handmaid'
  | 'Prince'
  | 'Chancellor'
  | 'King'
  | 'Countess'
  | 'Princess';

export interface Card {
  name: CardName;
  points: number;
  description: string;
  count: number;
}

export const CARD_NAMES_CN: Record<CardName, string> = {
  Spy: '间谍',
  Guard: '守卫',
  Priest: '牧师',
  Baron: '男爵',
  Handmaid: '侍女',
  Prince: '王子',
  Chancellor: '大臣',
  King: '国王',
  Countess: '伯爵夫人',
  Princess: '公主',
};

export const CARDS: Card[] = [
  { name: 'Spy', points: 0, description: '独家电打出且存活至局末，额外奖励1分', count: 2 },
  { name: 'Guard', points: 1, description: '猜一人手牌（不能猜间谍守卫），猜对目标出局', count: 6 },
  { name: 'Priest', points: 2, description: '秘密看一人手牌', count: 2 },
  { name: 'Baron', points: 3, description: '与一人秘密比大小，小者出局', count: 2 },
  { name: 'Handmaid', points: 4, description: '免疫一轮指向性攻击', count: 2 },
  { name: 'Prince', points: 5, description: '选择一人强制弃手牌并重抽', count: 2 },
  { name: 'Chancellor', points: 6, description: '抽2张，选1张保留，其余放回牌库底', count: 2 },
  { name: 'King', points: 7, description: '与一名玩家交换手牌', count: 1 },
  { name: 'Countess', points: 8, description: '与国王/王子同在时必须打出', count: 1 },
  { name: 'Princess', points: 9, description: '弃掉即出局', count: 1 },
];

export function createDeck(): CardName[] {
  const deck: CardName[] = [];
  for (const card of CARDS) {
    for (let i = 0; i < card.count; i++) {
      deck.push(card.name);
    }
  }
  return deck;
}

export function getCardInfo(name: CardName): Card {
  return CARDS.find(c => c.name === name)!;
}

export type PlayerType = 'human' | 'easy-ai' | 'normal-ai';

export interface Player {
  id: number;
  name: string;
  type: PlayerType;
  hand: CardName | null;
  isProtected: boolean;
  isEliminated: boolean;
  isActive: boolean;
  tokens: number;
}

export interface GameState {
  players: Player[];
  deck: CardName[];
  discardPile: CardName[];
  currentPlayerIndex: number;
  phase: 'setup' | 'playing' | 'roundover' | 'gameover';
  winner: number | null;
  message: string;
  log: string[];
  targetPlayerIndex: number | null;
  handmaidActive: boolean;
  handChoices: CardName[];
  handChoicesOrder: number[];
  keptCard: CardName | null;
  removedCard: CardName | null; // 新增：开局移出的牌
  targetTokens: number;        // 新增：获胜所需积分，默认4
  lastSpyPlayerId: number | null; // 跟踪最后打出Spy的玩家
}

export interface GameAction {
  type: 'setup' | 'draw' | 'play' | 'select-target' | 'guard-guess' | 'restart';
  cardName?: CardName;
  targetId?: number;
  guess?: CardName;
}