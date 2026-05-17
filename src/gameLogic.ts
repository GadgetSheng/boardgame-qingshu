import type { CardName, Player, GameState, PlayerType } from './types';
import { createDeck, getCardInfo, CARD_NAMES_CN } from './types';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createPlayers(count: number, humanCount: number = 1): Player[] {
  const names = ['玩家', '小红', '小李', '小明', '小华', '小芳'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: i === 0 ? names[0] : names[i] || `AI ${i}`,
    type: i < humanCount ? 'human' : (i < 3 ? 'easy-ai' : 'normal-ai'),
    hand: null as CardName | null,
    isProtected: false,
    isEliminated: false,
    isActive: true,
    tokens: 0,
  }));
}

export function setupGame(playerTypes: PlayerType[]): GameState {
  const players = playerTypes.map((type, i) => ({
    id: i,
    name: i === 0 ? '玩家' : (['小红', '小李', '小明', '小华', '小芳'][i - 1] || `AI ${i}`),
    type,
    hand: null as CardName | null,
    isProtected: false,
    isEliminated: false,
    isActive: true,
    tokens: 0,
  }));

  const deck = shuffle(createDeck());

  for (const player of players) {
    player.hand = deck.pop()!;
  }

  return {
    players,
    deck,
    discardPile: [],
    currentPlayerIndex: 0,
    phase: 'playing',
    winner: null,
    message: '你的回合！抽牌',
    log: [],
    targetPlayerIndex: null,
    handmaidActive: false,
    handChoices: [],
    handChoicesOrder: [],
    keptCard: null,
    removedCard: null,
    targetTokens: 4,
  };
}

export function drawCard(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const currentPlayer = newState.players[state.currentPlayerIndex];

  // Bug修复：deck空时应该跳过抽牌阶段，不改变hand
  if (newState.deck.length === 0) {
    return {
      ...newState,
      message: `${currentPlayer.name}无法抽牌（牌堆空），出牌阶段`,
    };
  }

  const drawnCard = newState.deck.pop()!;
  const choices: CardName[] = [currentPlayer.hand, drawnCard].filter((c): c is CardName => c !== null);

  return {
    ...newState,
    handChoices: choices,
    handChoicesOrder: [],
    keptCard: null,
    message: `${currentPlayer.name} 抽了1张牌，选择1张打出`,
    log: [...newState.log, `${currentPlayer.name} 抽了1张牌`],
  };
}

export function drawTwoCards(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const currentPlayer = newState.players[state.currentPlayerIndex];

  // deck空时跳过抽牌
  if (newState.deck.length === 0) {
    return {
      ...newState,
      message: `${currentPlayer.name}无法抽牌（牌堆空），出牌阶段`,
    };
  }

  const draw1 = newState.deck.pop()!;
  const draw2 = newState.deck.length > 0 ? newState.deck.pop()! : null;

  const choices: CardName[] = [currentPlayer.hand, draw1, draw2].filter((c): c is CardName => c !== null);

  return {
    ...newState,
    handChoices: choices,
    handChoicesOrder: [],
    keptCard: null,
    message: `${currentPlayer.name} 抽了2张牌，选择1张打出`,
  };
}

export function chooseDrawnCard(state: GameState, playedCard: CardName): GameState {
  const newState = { ...state, players: [...state.players] };
  const currentPlayer = newState.players[state.currentPlayerIndex];

  const otherCard = newState.handChoices.find(c => c !== playedCard);

  currentPlayer.hand = playedCard;

  return {
    ...newState,
    handChoices: [],
    handChoicesOrder: [],
    keptCard: otherCard ?? null,
    message: `${currentPlayer.name} 打出了 ${playedCard}`,
  };
}

export function chooseKeptCard(state: GameState, _keptCard: CardName): GameState {
  return state;
}

function eliminatePlayer(state: GameState, playerId: number, reason: string): GameState {
  const newState = { ...state, players: [...state.players] };
  const player = newState.players.find(p => p.id === playerId);
  if (player) {
    player.isEliminated = true;
    player.hand = null;
    newState.log = [...newState.log, `${player.name} 淘汰: ${reason}`];
  }
  return newState;
}

function checkPrincessDiscard(state: GameState, playerId: number): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (player?.hand === 'Princess') {
    return eliminatePlayer(state, playerId, '弹劾公主');
  }
  return state;
}

function checkSpyBonus(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.isEliminated);
  const spyCount: Record<number, number> = {};

  for (const p of activePlayers) {
    spyCount[p.id] = 0;
  }

  for (const card of state.discardPile) {
    if (card === 'Spy') {
      for (const p of activePlayers) {
        spyCount[p.id]++;
      }
    }
  }

  const soloSpies = Object.entries(spyCount).filter(([_, count]) => count > 0);
  if (soloSpies.length === 1 && soloSpies[0][1] > 0) {
    const winnerId = parseInt(soloSpies[0][0]);
    const winner = state.players.find(p => p.id === winnerId);
    if (winner) {
      winner.tokens += 1;
      return {
        ...state,
        message: `${winner.name} 获得间谍奖励1分！`,
      };
    }
  }

  return state;
}

function checkWinCondition(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.isEliminated);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    let finalState: GameState = {
      ...state,
      phase: 'gameover',
      winner: winner.id,
      message: `${winner.name} 获胜！`,
    };
    return checkSpyBonus(finalState);
  }

  if (state.deck.length === 0 && activePlayers.every(p => p.hand !== null)) {
    let maxPoints = -1;
    let winners: Player[] = [];

    for (const p of activePlayers) {
      const points = getCardInfo(p.hand!).points;
      if (points > maxPoints) {
        maxPoints = points;
        winners = [p];
      } else if (points === maxPoints) {
        winners.push(p);
      }
    }

    let winner = winners[0];
    let finalState: GameState;

    if (winners.length > 1) {
      finalState = {
        ...state,
        phase: 'gameover',
        winner: winners[0].id,
        message: `游戏结束！平局：${winners.map(w => w.name).join('、')} 都是 ${maxPoints} 点`,
      };
    } else {
      finalState = {
        ...state,
        phase: 'gameover',
        winner: winner.id,
        message: `游戏结束！${winner.name} 以 ${maxPoints} 点获胜！`,
      };
    }

    return checkSpyBonus(finalState);
  }

  return state;
}

function handleGuard(state: GameState, targetId: number, guess: CardName): GameState {
  if (guess === 'Guard') {
    return { ...state, message: '不能猜测守卫' };
  }

  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isProtected || target.isEliminated) {
    return { ...newState, message: '无法对目标使用守卫' };
  }

  if (target.hand === guess) {
    const afterDiscard = { ...newState, discardPile: [...newState.discardPile, 'Guard'] as CardName[] };
    return eliminatePlayer(checkPrincessDiscard(afterDiscard, targetId), targetId, `${current.name}守卫猜中${CARD_NAMES_CN[guess]}`);
  }

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'Guard'] as CardName[],
    message: `守卫猜错！${target.name}的手牌不是 ${guess}`,
    log: [...newState.log, `${current.name}猜测${target.name}的手牌不是${guess}`],
  };
}

function handlePriest(state: GameState, targetId: number): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isProtected || target.isEliminated) {
    return { ...newState, message: '无法查看此玩家' };
  }

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'Priest'] as CardName[],
    message: `${target.name}的手牌: ${target.hand}`,
    log: [...newState.log, `${current.name}查看了${target.name}的手牌`],
  };
}

function handleBaron(state: GameState, targetId: number): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isProtected || target.isEliminated) {
    return { ...newState, message: '无法对此玩家使用男爵' };
  }

  const currentPoints = getCardInfo(current.hand!).points;
  const targetPoints = getCardInfo(target.hand!).points;

  if (targetPoints < currentPoints) {
    const afterBaron = { ...newState, discardPile: [...newState.discardPile, 'Baron'] as CardName[] };
    return eliminatePlayer(checkPrincessDiscard(afterBaron, targetId), targetId, `${current.name}男爵对比获胜${currentPoints}vs${targetPoints}`);
  } else if (targetPoints > currentPoints) {
    const afterBaron = { ...newState, discardPile: [...newState.discardPile, 'Baron'] as CardName[] };
    return eliminatePlayer(checkPrincessDiscard(afterBaron, current.id), current.id, `${current.name}男爵对比失败${currentPoints}vs${targetPoints}`);
  }

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'Baron'] as CardName[],
    message: `男爵对比: 平局！(${currentPoints} vs ${targetPoints})`,
    log: [...newState.log, `${current.name}与${target.name}男爵对比平局`],
  };
}

function handleHandmaid(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  current.isProtected = true;

  return {
    ...newState,
    handmaidActive: true,
    discardPile: [...newState.discardPile, 'Handmaid'] as CardName[],
    message: '侍女发动！本回合免疫',
    log: [...newState.log, `${current.name} 发动侍女保护`],
  };
}

function handlePrince(state: GameState, targetId: number): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isEliminated) {
    return { ...newState, message: '无法指定此玩家' };
  }

  const oldHand = target.hand;
  target.hand = newState.deck.length > 0 ? newState.deck.pop()! : null;

  if (target.hand === null) {
    target.isEliminated = true;
  }

  const discardPile = [...newState.discardPile, 'Prince'] as CardName[];

  if (target.hand === 'Princess') {
    target.isEliminated = true;
    target.hand = null;
    return {
      ...newState,
      discardPile,
      log: [...newState.log, `${current.name}使用王子使${target.name}抽到公主并淘汰`],
    };
  }

  return {
    ...newState,
    discardPile,
    message: `${target.name}弃置手牌并抽取新牌`,
    log: [...newState.log, `${current.name}使用王子使${target.name}弃置了${oldHand}`],
  };
}

function handleChancellor(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];

  const draw1 = newState.deck.length > 0 ? newState.deck.pop()! : null;
  const draw2 = newState.deck.length > 0 ? newState.deck.pop()! : null;

  const oldHand = current.hand;
  current.hand = null;

  const choices: CardName[] = [oldHand, draw1, draw2].filter((c): c is CardName => c !== null);
  const order = choices.map((_, i) => i);

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'Chancellor'] as CardName[],
    handChoices: choices,
    handChoicesOrder: order,
    keptCard: null,
    message: `大臣发动！选择1张保留，其余放回牌库底`,
    log: [...newState.log, `${current.name} 发动大臣`],
  };
}

export function chancellorChooseCard(state: GameState, keptCard: CardName): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const choices = newState.handChoices;

  const otherCards = choices.filter(c => c !== keptCard);
  otherCards.forEach(c => {
    if (c) newState.deck.push(c);
  });

  current.hand = keptCard;

  return {
    ...newState,
    handChoices: [],
    handChoicesOrder: [],
    keptCard: null,
    message: `${current.name} 保留了 ${keptCard}`,
  };
}

function handleKing(state: GameState, targetId: number): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isProtected || target.isEliminated) {
    return { ...newState, message: '无法与交换此玩家手牌' };
  }

  const temp = current.hand;
  current.hand = target.hand;
  target.hand = temp;

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'King'] as CardName[],
    message: `与${target.name}交换了手牌`,
    log: [...newState.log, `${current.name}与${target.name}交换手牌`],
  };
}

function handleCountess(state: GameState): GameState {
  const current = state.players[state.currentPlayerIndex];
  return {
    ...state,
    discardPile: [...state.discardPile, 'Countess'] as CardName[],
    message: '伯爵夫人发动',
    log: [...state.log, `${current.name}打出伯爵夫人`],
  };
}

function checkCountessRequired(state: GameState): boolean {
  const current = state.players[state.currentPlayerIndex];
  const hand = current.hand;
  if (!hand) return false;
  const hasPrince = hand === 'Prince';
  const hasKing = hand === 'King';
  const hasCountess = hand === 'Countess';
  return (hasPrince || hasKing) && !hasCountess;
}

export function playCard(state: GameState, cardName: CardName, targetId?: number, guess?: CardName): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  if (currentPlayer.type === 'human' && currentPlayer.hand !== cardName) {
    return { ...state, message: '你必须出到手牌中的牌' };
  }

  if (currentPlayer.type === 'human' && cardName !== 'Countess' && checkCountessRequired(state)) {
    return { ...state, message: '拥有王子或国王时必须出伯爵夫人' };
  }

  let newState: GameState;

  switch (cardName) {
    case 'Spy':
      newState = {
        ...state,
        discardPile: [...state.discardPile, 'Spy'] as CardName[],
        message: '间谍发动（无即时效果）',
        log: [...state.log, `${currentPlayer.name} 打出了间谍`],
      };
      break;
    case 'Guard':
      if (targetId === undefined || guess === undefined) {
        return { ...state, message: '需要选择目标和猜测卡牌', targetPlayerIndex: targetId ?? state.targetPlayerIndex };
      }
      newState = handleGuard(state, targetId, guess);
      break;
    case 'Priest':
      if (targetId === undefined) {
        return { ...state, message: '需要选择目标', targetPlayerIndex: targetId ?? state.targetPlayerIndex };
      }
      newState = handlePriest(state, targetId);
      break;
    case 'Baron':
      if (targetId === undefined) {
        return { ...state, message: '需要选择目标', targetPlayerIndex: targetId ?? state.targetPlayerIndex };
      }
      newState = handleBaron(state, targetId);
      break;
    case 'Handmaid':
      newState = handleHandmaid(state);
      break;
    case 'Prince':
      if (targetId === undefined) {
        return { ...state, message: '需要选择目标', targetPlayerIndex: targetId ?? state.targetPlayerIndex };
      }
      newState = handlePrince(state, targetId);
      break;
    case 'Chancellor': {
      newState = handleChancellor(state);
      break;
    }
    case 'King':
      if (targetId === undefined) {
        return { ...state, message: '需要选择目标', targetPlayerIndex: targetId ?? state.targetPlayerIndex };
      }
      newState = handleKing(state, targetId);
      break;
    case 'Countess':
      newState = handleCountess(state);
      break;
    default:
      return state;
  }

  if (cardName !== 'Chancellor') {
    newState.players[newState.currentPlayerIndex].hand = null;
  }

  const activeCount = newState.players.filter(p => !p.isEliminated).length;
  if (activeCount === 1 || newState.deck.length === 0) {
    return checkWinCondition(newState);
  }

  if (cardName === 'Chancellor') {
    return newState;
  }

  let nextIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  let attempts = 0;
  while (newState.players[nextIndex].isEliminated && attempts < newState.players.length) {
    nextIndex = (nextIndex + 1) % newState.players.length;
    attempts++;
  }
  newState.currentPlayerIndex = nextIndex;

  newState.players = newState.players.map((p, idx) => ({
    ...p,
    isProtected: idx === nextIndex ? p.isProtected : false,
  }));

  newState.message = `${newState.players[newState.currentPlayerIndex].name}的回合 - 抽牌`;
  if (newState.players[newState.currentPlayerIndex].type !== 'human') {
    newState.message += ' (AI思考中...)';
  }

  return newState;
}

export function getValidTargets(state: GameState, _cardName: CardName): Player[] {
  const current = state.players[state.currentPlayerIndex];
  return state.players.filter(p =>
    p.id !== current.id &&
    !p.isEliminated &&
    !p.isProtected
  );
}

export function getValidGuesses(): CardName[] {
  return ['Priest', 'Baron', 'Handmaid', 'Prince', 'Chancellor', 'King', 'Countess', 'Princess', 'Spy'];
}

export function getCardPoints(card: CardName): number {
  const points: Record<CardName, number> = {
    Spy: 0,
    Guard: 1,
    Priest: 2,
    Baron: 3,
    Handmaid: 4,
    Prince: 5,
    Chancellor: 6,
    King: 7,
    Countess: 8,
    Princess: 9,
  };
  return points[card];
}