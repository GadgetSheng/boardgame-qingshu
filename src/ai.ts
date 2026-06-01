import type { CardName, GameState } from './types';
import { getCardInfo } from './types';
import { getValidTargets } from './gameLogic';

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getHandPoints(hand: CardName | null): number {
  if (!hand) return -1;
  return getCardInfo(hand).points;
}

export function makeAIDecision(state: GameState): { cardName: CardName; targetId?: number; guess?: CardName } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const hand = currentPlayer.hand;

  console.log(`[AI决策] ${currentPlayer.name} 开始决策，手牌: ${hand ?? '无'}`);

  if (!hand) {
    const decision = { cardName: state.deck.length > 0 ? state.deck[state.deck.length - 1] : 'Spy' };
    console.log(`[AI决策] ${currentPlayer.name} 无手牌，临时决定: ${decision.cardName}`);
    return decision;
  }

  if (currentPlayer.type === 'easy-ai') {
    const decision = easyAI(state, hand);
    console.log(`[AI决策] ${currentPlayer.name}(easy) 决定出: ${decision.cardName}`, decision.targetId ? `目标: ${state.players.find(p => p.id === decision.targetId)?.name}` : '', decision.guess ? `猜测: ${decision.guess}` : '');
    return decision;
  }

  const decision = normalAI(state, hand);
  console.log(`[AI决策] ${currentPlayer.name}(normal) 决定出: ${decision.cardName}`, decision.targetId ? `目标: ${state.players.find(p => p.id === decision.targetId)?.name}` : '', decision.guess ? `猜测: ${decision.guess}` : '');
  return decision;
}

function easyAI(state: GameState, hand: CardName): { cardName: CardName; targetId?: number; guess?: CardName } {
  const targets = getValidTargets(state, hand);

  if (['Handmaid', 'Countess', 'Spy'].includes(hand)) {
    return { cardName: hand };
  }

  if (targets.length === 0) {
    return { cardName: hand };
  }

  const target = randomChoice(targets);

  if (hand === 'Guard') {
    const guess = randomChoice(['Priest', 'Baron', 'Prince', 'Chancellor', 'King', 'Countess', 'Princess', 'Spy'] as CardName[]);
    return { cardName: hand, targetId: target.id, guess };
  }

  return { cardName: hand, targetId: target.id };
}

function normalAI(state: GameState, hand: CardName): { cardName: CardName; targetId?: number; guess?: CardName } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const targets = getValidTargets(state, hand);

  if (hand === 'Spy') {
    return { cardName: hand };
  }

  if (hand === 'Countess') {
    const hasPrince = currentPlayer.hand === 'Prince';
    const hasKing = currentPlayer.hand === 'King';
    if (hasPrince || hasKing) {
      return { cardName: hand };
    }
  }

  if (hand === 'Guard') {
    if (targets.length === 0) return { cardName: hand };
    let bestTarget = targets[0];
    let lowestPoints = getHandPoints(bestTarget.hand);
    for (const t of targets) {
      const pts = getHandPoints(t.hand);
      if (pts < lowestPoints) {
        lowestPoints = pts;
        bestTarget = t;
      }
    }
    const guessOptions: CardName[] = ['Priest', 'Baron', 'Prince', 'Chancellor', 'King', 'Countess', 'Princess', 'Spy'];
    return { cardName: hand, targetId: bestTarget.id, guess: randomChoice(guessOptions) };
  }

  if (targets.length === 0) {
    return { cardName: hand };
  }

  return { cardName: hand, targetId: randomChoice(targets).id };
}

export function makeChancellorChoice(state: GameState): CardName {
  const choices = state.handChoices;

  const cardPriority: Record<CardName, number> = {
    Princess: 10,
    Countess: 9,
    King: 8,
    Chancellor: 7,
    Prince: 6,
    Handmaid: 5,
    Baron: 4,
    Priest: 3,
    Guard: 2,
    Spy: 1,
  };

  const sorted = [...choices].sort((a, b) => cardPriority[b] - cardPriority[a]);
  console.log(`[AI决策] Chancellor选择: ${choices} -> 保留 ${sorted[0]}`);
  return sorted[0];
}