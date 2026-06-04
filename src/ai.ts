import { CARD_DEFS, type Card, type CardName, type GameState, type Player } from './types';

export interface SpyMemory {
  // 记录已确认的牌分布：每种牌剩余张数
  remaining: Record<CardName, number>;
}

export function buildMemory(state: GameState): SpyMemory {
  const remaining: Record<CardName, number> = {} as Record<CardName, number>;
  for (const def of CARD_DEFS) {
    remaining[def.name] = def.count;
  }
  const allCards: Card[] = [
    ...state.deck,
    ...state.discard.map((d) => d.card),
    ...state.removed,
    ...state.removedPublic,
    ...state.players.flatMap((p) => p.hand),
  ];
  for (const c of allCards) {
    remaining[c.name] = Math.max(0, (remaining[c.name] ?? 0) - 1);
  }
  return { remaining };
}

function aliveNonProtected(state: GameState, playerId: number): Player[] {
  return state.players.filter((p) => p.alive && p.id !== playerId && !p.protected);
}

function aliveAll(state: GameState, playerId: number): Player[] {
  return state.players.filter((p) => p.alive && p.id !== playerId);
}

// 选牌
export function aiPickCard(state: GameState, playerId: number): Card | null {
  const p = state.players[playerId];
  if (p.hand.length === 0) return null;
  // 强制伯爵夫人
  const hasCountess = p.hand.some((c) => c.name === '女伯爵');
  const hasKingOrPrince = p.hand.some((c) => c.name === '国王' || c.name === '王子');
  if (hasCountess && hasKingOrPrince) {
    return p.hand.find((c) => c.name === '女伯爵') ?? null;
  }
  // 持公主 → 优先出王子/国王/大臣/间谍等转移
  const hasPrincess = p.hand.some((c) => c.name === '公主');
  if (hasPrincess) {
    const prince = p.hand.find((c) => c.name === '王子');
    if (prince) return prince;
    const chancellor = p.hand.find((c) => c.name === '大臣');
    if (chancellor) return chancellor;
    const king = p.hand.find((c) => c.name === '国王');
    if (king) return king;
    const guard = p.hand.find((c) => c.name === '卫兵');
    if (guard) return guard;
    // 最后出间谍 / 弱牌
    const spy = p.hand.find((c) => c.name === '间谍');
    if (spy) return spy;
  }
  // 没公主：优先侍女
  const handmaid = p.hand.find((c) => c.name === '侍女');
  if (handmaid && p.hand.length === 2 && p.hand[0]?.value !== undefined) {
    // 如果有高牌如国王/大臣/王子，留侍女；否则可以出
    const other = p.hand.find((c) => c.id !== handmaid.id);
    if (other && other.value >= 3) return handmaid;
  }
  // 卫兵/神父/男爵常出
  const info = p.hand.find((c) => c.name === '卫兵' || c.name === '神父' || c.name === '男爵');
  if (info) return info;
  // 国王出
  const king = p.hand.find((c) => c.name === '国王');
  if (king) return king;
  // 间谍出（避免持 0 点比牌）
  const spy = p.hand.find((c) => c.name === '间谍');
  if (spy) return spy;
  // 兜底：出最弱
  return p.hand.reduce((min, c) => (c.value < min.value ? c : min), p.hand[0]);
}

// 选卫兵目标
export function aiGuardTarget(state: GameState, playerId: number): number | null {
  const candidates = aliveNonProtected(state, playerId);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

// 卫兵猜牌 (盲猜：基于公开弃牌/移除推断剩余分布，按权重采样)
export function aiGuardGuess(state: GameState, _playerId: number, _targetId: number): CardName {
  const publicRemoved: Partial<Record<CardName, number>> = {};
  for (const c of [...state.discard.map((d) => d.card), ...state.removed, ...state.removedPublic]) {
    publicRemoved[c.name] = (publicRemoved[c.name] ?? 0) + 1;
  }
  const candidates: Array<{ name: CardName; weight: number }> = [];
  for (const def of CARD_DEFS) {
    if (def.name === '卫兵') continue;
    const remaining = def.count - (publicRemoved[def.name] ?? 0);
    if (remaining > 0) candidates.push({ name: def.name, weight: remaining });
  }
  if (candidates.length === 0) return '王子';
  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.name;
  }
  return candidates[0].name;
}

export function aiPriestTarget(state: GameState, playerId: number): number | null {
  const candidates = aliveNonProtected(state, playerId);
  if (candidates.length === 0) return null;
  // 优先看持高牌的（已明牌但 AI 假装）
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

export function aiBaronTarget(state: GameState, playerId: number): number | null {
  const candidates = aliveNonProtected(state, playerId);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

export function aiKingTarget(state: GameState, playerId: number): number | null {
  const candidates = aliveNonProtected(state, playerId);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

export function aiPrinceTarget(state: GameState, playerId: number): number | null {
  // 持公主 → 用王子弃自己
  const p = state.players[playerId];
  const myHand = p.hand[0];
  if (myHand?.name === '公主') return p.id;
  // 否则：选非保护的存活玩家
  const candidates = aliveAll(state, playerId);
  if (candidates.length === 0) return null;
  // 优先选没有免疫的
  const unprotected = candidates.filter((c) => !c.protected);
  const pool = unprotected.length > 0 ? unprotected : candidates;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

// 大臣：返回要放牌库底的牌（按玩家选顺序：[最底, 次底, ...]）
// 数量 = pool.length - 1（牌库只够抽 1 张时只放回 1 张）
export function aiChancellorReturn(
  state: GameState,
  playerId: number,
  drawn: Card[],
): Card[] {
  const p = state.players[playerId];
  const existing = p.hand[0]; // 玩家原本的手牌
  const all = [existing, ...drawn].filter((c): c is Card => !!c);
  if (all.length <= 1) return [];
  // 优先级：留最强（公主 > 其他），但若手牌含公主，留公主
  const princess = all.find((c) => c.name === '公主');
  const keep = princess ?? [...all].sort((a, b) => b.value - a.value)[0];
  // 其余按"最弱优先放最底"排序
  const rest = all.filter((c) => c.id !== keep.id);
  const sortedRest = [...rest].sort((a, b) => a.value - b.value);
  return sortedRest;
}
