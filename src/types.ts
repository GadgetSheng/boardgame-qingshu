// 牌型 + 数值定义 (2019 扩展版)
export const CARD_DEFS = [
  { name: '公主' as const, value: 9, count: 1, color: 'red' },
  { name: '伯爵夫人' as const, value: 8, count: 1, color: 'red' },
  { name: '国王' as const, value: 7, count: 1, color: 'yellow' },
  { name: '大臣' as const, value: 6, count: 2, color: 'yellow' },
  { name: '王子' as const, value: 5, count: 2, color: 'orange' },
  { name: '侍女' as const, value: 4, count: 2, color: 'green' },
  { name: '男爵' as const, value: 3, count: 2, color: 'blue' },
  { name: '神父' as const, value: 2, count: 2, color: 'blue' },
  { name: '卫兵' as const, value: 1, count: 6, color: 'gray' },
  { name: '间谍' as const, value: 0, count: 2, color: 'gray' },
] as const;

export type CardName = (typeof CARD_DEFS)[number]['name'];

export interface Card {
  id: string;
  name: CardName;
  value: number;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  alive: boolean;
  hand: Card[];
  protected: boolean; // 侍女/被免疫至下一回合
  tokens: number; // 胜利标记
  usedSpy: boolean; // 打出或弃过间谍
}

export type LogEvent =
  | { kind: 'DRAW'; player: number; card: Card; hand: Card[] }
  | { kind: 'PLAY'; player: number; card: Card }
  | { kind: 'TARGET'; player: number; target: number; card: Card }
  | { kind: 'EFFECT'; card: Card; detail: string; data?: Record<string, unknown> }
  | { kind: 'DISCARD'; player: number; card: Card }
  | { kind: 'PROTECT'; player: number; card: Card }
  | { kind: 'ELIMINATE'; player: number; reason: string; card?: Card }
  | { kind: 'GAME_OVER'; winner: number | null; reason: string }
  | { kind: 'SPY_BONUS'; player: number; reason: string }
  | { kind: 'ROUND_START'; round: number; player: number };

export interface LogEntry {
  id: number;
  turn: number;
  text: string;
  events: LogEvent[];
}

export type GamePhase =
  | 'CHOOSE_CARD'
  | 'CHOOSE_TARGET'
  | 'CHANCELLOR_DRAW' // 大臣：抽 2 张
  | 'CHANCELLOR_DISCARD' // 大臣：选 2 张放牌库底
  | 'GUARD_GUESS'
  | 'PRINCE_TARGET'
  | 'KING_TARGET'
  | 'BARON_TARGET'
  | 'PRIEST_TARGET'
  | 'GAME_OVER';

export interface PendingState {
  chancellorDrawn?: Card[]; // 大臣抽的 2 张
  guardTarget?: number;
  princeTarget?: number;
  kingTarget?: number;
  baronTarget?: number;
  priestTarget?: number;
}

export interface DiscardedCard {
  card: Card;
  playerId: number; // 这张牌从哪个玩家出/被弃
}

export interface GameState {
  players: Player[];
  deck: Card[]; // 牌库顶 = 数组末尾（pop）
  discard: DiscardedCard[]; // 弃牌堆（带玩家归属）
  removed: Card[]; // 开局移除 + 2人局明抽 3 张
  currentPlayerIndex: number;
  turn: number;
  round: number;
  phase: GamePhase;
  log: LogEntry[];
  pending: PendingState;
  winner: number | null;
  gameOverReason: string;
  logIdCounter: number;
  targetTokens: number; // 胜利标记目标（2人=3, 3-4人=4, 5-6人=5）
  humanPlayerId: number;
  removedPublic: Card[]; // 2 人局明抽 3 张公开
}

export const CARD_NAME_VALUES: Record<CardName, number> = CARD_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.name]: def.value }),
  {} as Record<CardName, number>,
);
