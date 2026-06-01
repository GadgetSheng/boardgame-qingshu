import type { CardName, Player, GameState, PlayerType } from './types';
import { createDeck, getCardInfo, CARD_NAMES_CN } from './types';
import { makeAIDecision } from './ai';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function takeAITurn(
  state: GameState,
  makeChancellorChoiceFn: (state: GameState) => CardName
): GameState {
  let newState = state;
  const playerName = newState.players[newState.currentPlayerIndex].name;

  console.log(`[AI行动] === ${playerName} 回合开始 ===`);
  console.log(`[AI行动] 当前状态: phase=${newState.phase}, deck=${newState.deck.length}, waitingForNextTurn=${newState.waitingForNextTurn}`);

  // AI回合：抽牌（如果手牌为空）
  if (newState.deck.length > 0 && newState.players[newState.currentPlayerIndex].hand === null) {
    console.log(`[AI行动] ${playerName} 手牌为空，执行抽牌`);
    newState = drawCard(newState);
  }

  // 如果有handChoices（Chancellor抽2选1），AI选择
  if (newState.handChoices.length > 0) {
    console.log(`[AI行动] ${playerName} 面临手牌选择:`, newState.handChoices);
    const keptCard = makeChancellorChoiceFn(newState);
    console.log(`[AI行动] ${playerName} 选择保留: ${keptCard}`);
    newState = chancellorChooseCard(newState, keptCard);
  }

  const currentPlayer = newState.players[newState.currentPlayerIndex];
  if (currentPlayer.hand) {
    console.log(`[AI行动] ${playerName} 准备出牌: ${currentPlayer.hand}`);
    const decision = makeAIDecision(newState);
    console.log(`[AI行动] ${playerName} 决策结果:`, JSON.stringify(decision));
    newState = playCard(newState, decision.cardName, decision.targetId, decision.guess);
    console.log(`[AI行动] ${playerName} 出牌后message: ${newState.message}`);
  }

  // AI出牌后自动继续下一回合
  if (newState.waitingForNextTurn) {
    console.log(`[AI行动] ${playerName} 等待确认后进入下一回合`);
    newState = advanceToNextTurn(newState);
    console.log(`[AI行动] ${playerName} 进入下一回合，当前玩家: ${newState.players[newState.currentPlayerIndex].name}`);
    // AI自动抽牌
    if (newState.deck.length > 0 && newState.players[newState.currentPlayerIndex].hand === null) {
      console.log(`[AI行动] 下一玩家 ${newState.players[newState.currentPlayerIndex].name} 手牌为空，执行抽牌`);
      newState = drawCard(newState);
    }
  }

  console.log(`[AI行动] === ${playerName} 回合结束 ===`);
  return newState;
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
  console.log('[DEBUG] 洗牌后牌堆:', deck.length, '张', deck);
  const removedCard = deck.pop()!;
  console.log('[DEBUG] 移除的牌:', removedCard);
  console.log('[DEBUG] 剩余牌堆:', deck.length, '张', deck);

  const playersWithHands = players.map((player) => ({
    ...player,
    hand: deck.pop()!,
  }));
  console.log('[DEBUG] 初始化后各玩家手牌:', playersWithHands.map(p => ({name: p.name, hand: p.hand})));
  console.log('[DEBUG] 初始化后discardPile:', []);

  return {
    players: playersWithHands,
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
    removedCard,
    targetTokens: 4,
    lastSpyPlayerId: null,
    waitingForNextTurn: false,
  };
  // 不预抽, Game.tsx 的 effect 在 phase='playing' 时统一触发 drawForCurrentPlayer
}

export function drawCard(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const currentPlayer = newState.players[state.currentPlayerIndex];

  console.log('[DEBUG] drawCard调用 - 当前玩家:', currentPlayer.name, 'deck长度:', newState.deck.length);

  // TODO: 抽牌完，牌堆空，进入挑战阶段
  // // Bug修复：deck空时应该跳过抽牌阶段，不改变hand
  // if (newState.deck.length === 0) {
  //   console.log('[DEBUG] 牌堆空，跳过抽牌');
  //   return {
  //     ...newState,
  //     phase: 'playing',
  //     message: `${currentPlayer.name}无法抽牌（牌堆空），出牌阶段`,
  //   };
  // }

  const drawnCard = newState.deck.pop()!;
  console.log('[DEBUG] 抽到的牌:', drawnCard, '剩余deck:', newState.deck.length);
  const choices: CardName[] = [currentPlayer.hand, drawnCard].filter((c): c is CardName => c !== null);
  console.log('[DEBUG] handChoices:', choices);

  return {
    ...newState,
    phase: 'select-card',
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

  const draw1 = newState.deck.length > 0 ? newState.deck.pop()! : null;
  const draw2 = newState.deck.length > 0 ? newState.deck.pop()! : null;

  const choices: CardName[] = [currentPlayer.hand, draw1, draw2].filter((c): c is CardName => c !== null);

  return {
    ...newState,
    handChoices: choices,
    handChoicesOrder: [],
    keptCard: null,
    message: `${currentPlayer.name} 抽了2张牌，选择1张打出`,
    log: [...newState.log, `${currentPlayer.name} 抽了2张牌, 加上手中共 ${choices.length} 张, 选1张打出`],
  };
}

export function chooseDrawnCard(state: GameState, playedCard: CardName): GameState {
  const newState = { ...state, players: [...state.players], discardPile: [...state.discardPile] };
  const currentPlayer = newState.players[state.currentPlayerIndex];

  const otherCard = newState.handChoices.find(c => c !== playedCard);

  // playedCard是打出的牌，otherCard是保留的手牌
  currentPlayer.hand = otherCard ?? null;
  newState.discardPile.push(playedCard);

  console.log('[DEBUG] chooseDrawnCard:', currentPlayer.name, '打出', playedCard, '保留', otherCard);
  console.log('[DEBUG] discardPile now:', newState.discardPile);
  console.log('[DEBUG] 各玩家手牌:', newState.players.map(p => ({name: p.name, hand: p.hand})));

  const cardNeedsTarget = ['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(playedCard);

  return {
    ...newState,
    handChoices: [],
    handChoicesOrder: [],
    keptCard: otherCard ?? null,
    phase: cardNeedsTarget ? 'select-target' : 'playing',
    message: cardNeedsTarget
      ? `${currentPlayer.name} 打出了 ${playedCard}，选择目标`
      : `${currentPlayer.name} 打出了 ${playedCard}`,
    log: [...newState.log, `${currentPlayer.name} 打出 ${playedCard}, 保留 ${otherCard ?? '无'}`],
  };
}

export function chooseKeptCard(state: GameState, _keptCard: CardName): GameState {
  return state;
}

function eliminatePlayer(state: GameState, playerId: number, reason: string): GameState {
  const newState = { ...state, players: [...state.players] };
  const player = newState.players.find(p => p.id === playerId);
  if (player) {
    console.log(`[游戏逻辑] 玩家 ${player.name} 被淘汰: ${reason}`);
    player.isEliminated = true;
    player.hand = null;
    newState.log = [...newState.log, `${player.name} 淘汰: ${reason}`];
  }
  return newState;
}

function checkPrincessDiscard(state: GameState, playerId: number): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (player?.hand === 'Princess') {
    console.log(`[游戏逻辑] ${player.name} 因弹劾公主被淘汰`);
    return eliminatePlayer(state, playerId, '弹劾公主');
  }
  return state;
}

function checkSpyBonus(state: GameState): GameState {
  // 检查discardPile中Spy总数是否为1
  const totalSpiesInDiscard = state.discardPile.filter(c => c === 'Spy').length;
  if (totalSpiesInDiscard !== 1) {
    return state;
  }

  // 使用lastSpyPlayerId来识别打出Spy的玩家
  if (state.lastSpyPlayerId !== null) {
    const spyPlayer = state.players[state.lastSpyPlayerId];
    if (spyPlayer && !spyPlayer.isEliminated) {
      spyPlayer.tokens += 1;
      console.log(`[游戏逻辑] ${spyPlayer.name} 获得间谍奖励1分 (${spyPlayer.tokens}分)`);
      return {
        ...state,
        lastSpyPlayerId: null,
        message: `${spyPlayer.name} 获得间谍奖励1分！`,
        log: [...state.log, `${spyPlayer.name} 打出唯一间谍，获得 1 分奖励 (当前 ${spyPlayer.tokens} 分)`],
      };
    }
  }

  return state;
}

function checkRoundEnd(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.isEliminated);

  if (state.deck.length !== 0) {
    return state;
  }

  // deck空，结算本轮
  let maxPoints = -1;
  let winners: Player[] = [];

  for (const p of activePlayers) {
    const points = p.hand !== null ? getCardInfo(p.hand).points : -1;
    if (points > maxPoints) {
      maxPoints = points;
      winners = [p];
    } else if (points === maxPoints) {
      winners.push(p);
    }
  }

  if (winners.length > 1) {
    return {
      ...state,
      phase: 'roundover',
      winner: winners[0].id,
      message: `本轮结束！平局：${winners.map(w => w.name).join('、')} 都是 ${maxPoints} 点`,
      log: [...state.log, `本轮结束！平局：${winners.map(w => w.name).join('、')} 都是 ${maxPoints} 点`],
    };
  }

  return checkSpyBonus({
    ...state,
    phase: 'roundover',
    winner: winners[0].id,
    message: `本轮结束！${winners[0].name} 以 ${maxPoints} 点获胜！`,
    log: [...state.log, `本轮结束！${winners[0].name} 以 ${maxPoints} 点获胜`],
  });
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
      log: [...state.log, `游戏结束！${winner.name} 是最后的幸存者，获胜！`],
    };
    return checkSpyBonus(finalState);
  }

  // deck空时检查是否本轮结束
  if (state.deck.length === 0 && activePlayers.every(p => p.hand === null)) {
    return checkRoundEnd(state);
  }

  return state;
}

function handleGuard(state: GameState, targetId: number, guess: CardName): GameState {
  if (guess === 'Guard') {
    console.log(`[游戏逻辑] Guard猜测无效: 不能猜Guard`);
    return { ...state, message: '不能猜测守卫' };
  }

  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isProtected || target.isEliminated) {
    console.log(`[游戏逻辑] Guard无法命中: 目标无效或受保护`);
    return { ...newState, message: '无法对目标使用守卫' };
  }

  console.log(`[游戏逻辑] Guard猜测: ${target.name}的手牌是${guess}，实际是${target.hand}`);

  if (target.hand === guess) {
    const afterDiscard = {
      ...newState,
      discardPile: [...newState.discardPile, 'Guard'] as CardName[],
      log: [...newState.log, `守卫猜中！${target.name} 的手牌是 ${guess}, 被淘汰`],
    };
    console.log(`[游戏逻辑] Guard猜测正确! ${target.name}被淘汰`);
    return eliminatePlayer(checkPrincessDiscard(afterDiscard, targetId), targetId, `${current.name}守卫猜中${CARD_NAMES_CN[guess]}`);
  }

  console.log(`[游戏逻辑] Guard猜测错误`);
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
    console.log(`[游戏逻辑] Priest无法查看: 目标无效或受保护`);
    return { ...newState, message: '无法查看此玩家' };
  }

  console.log(`[游戏逻辑] Priest ${current.name} 查看 ${target.name} 的手牌: ${target.hand}`);
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
    console.log(`[游戏逻辑] Baron无法使用: 目标无效或受保护`);
    return { ...newState, message: '无法对此玩家使用男爵' };
  }

  const currentPoints = getCardInfo(current.hand!).points;
  const targetPoints = getCardInfo(target.hand!).points;
  console.log(`[游戏逻辑] Baron ${current.name} vs ${target.name}: ${currentPoints} vs ${targetPoints}`);

  if (targetPoints < currentPoints) {
    console.log(`[游戏逻辑] Baron ${current.name}获胜，${target.name}被淘汰`);
    const afterBaron = {
      ...newState,
      discardPile: [...newState.discardPile, 'Baron'] as CardName[],
      log: [...newState.log, `${current.name}与${target.name}男爵对比：${currentPoints} vs ${targetPoints}, ${current.name}获胜`],
    };
    return eliminatePlayer(checkPrincessDiscard(afterBaron, targetId), targetId, `${current.name}男爵对比获胜${currentPoints}vs${targetPoints}`);
  } else if (targetPoints > currentPoints) {
    console.log(`[游戏逻辑] Baron ${target.name}获胜，${current.name}被淘汰`);
    const afterBaron = {
      ...newState,
      discardPile: [...newState.discardPile, 'Baron'] as CardName[],
      log: [...newState.log, `${current.name}与${target.name}男爵对比：${currentPoints} vs ${targetPoints}, ${current.name}落败`],
    };
    return eliminatePlayer(checkPrincessDiscard(afterBaron, current.id), current.id, `${current.name}男爵对比失败${currentPoints}vs${targetPoints}`);
  }

  console.log(`[游戏逻辑] Baron平局`);
  return {
    ...newState,
    discardPile: [...newState.discardPile, 'Baron'] as CardName[],
    message: `男爵对比: 平局！(${currentPoints} vs ${targetPoints})`,
    log: [...newState.log, `${current.name}与${target.name}男爵对比平局：${currentPoints} vs ${targetPoints}`],
  };
}

function handleHandmaid(state: GameState): GameState {
  const newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  console.log(`[游戏逻辑] Handmaid ${current.name} 发动保护`);
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
  let newState = { ...state, players: [...state.players] };
  const current = newState.players[state.currentPlayerIndex];
  const target = newState.players.find(p => p.id === targetId);

  if (!target || target.isEliminated) {
    return { ...newState, message: '无法指定此玩家' };
  }

  const oldHand = target.hand;
  let newHand: CardName | null = null;

  console.log(`[游戏逻辑] Prince ${current.name} 目标: ${target.name}, 旧手牌: ${oldHand}`);

  // 判断是否是唯一存活玩家（除自己外）
  const otherPlayers = newState.players.filter(p => p.id !== current.id && !p.isEliminated);
  const isLastPlayer = otherPlayers.length === 1 && otherPlayers[0].id === targetId;

  if (isLastPlayer && newState.removedCard) {
    // 最后玩家抽开局移出的牌
    newHand = newState.removedCard;
    console.log(`[游戏逻辑] Prince ${target.name} 抽移除的牌: ${newHand}`);
    newState = { ...newState, removedCard: null };
  } else if (newState.deck.length > 0) {
    // 正常从牌堆抽
    newHand = newState.deck.pop()!;
    console.log(`[游戏逻辑] Prince ${target.name} 从牌堆抽: ${newHand}`);
  } else {
    console.log(`[游戏逻辑] Prince 牌堆空`);
  }

  target.hand = newHand;

  if (newHand === null) {
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
    log: [...newState.log, `${current.name}使用王子：${target.name}弃置 ${oldHand}, 抽到 ${newHand ?? '无牌, 淘汰'}`],
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

  console.log(`[游戏逻辑] Chancellor ${current.name} 发动，选择: ${choices}`);

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

  console.log('[DEBUG] chancellorChooseCard:', current.name, '保留', keptCard, '其他', otherCards, '放回牌堆');
  console.log('[DEBUG] discardPile now:', newState.discardPile);
  console.log('[DEBUG] deck now:', newState.deck.length);

  return {
    ...newState,
    handChoices: [],
    handChoicesOrder: [],
    keptCard: null,
    message: `${current.name} 保留了 ${keptCard}`,
    log: [...newState.log, `${current.name} 大臣选择保留 ${CARD_NAMES_CN[keptCard] || keptCard}, 其余 ${otherCards.length} 张放回牌堆底`],
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

  console.log(`[游戏逻辑] King ${current.name} 与 ${target.name} 交换手牌: ${current.name}现在有${current.hand}, ${target.name}现在有${target.hand}`);

  return {
    ...newState,
    discardPile: [...newState.discardPile, 'King'] as CardName[],
    message: `与${target.name}交换了手牌`,
    log: [...newState.log, `${current.name}与${target.name}交换手牌`],
  };
}

function handleCountess(state: GameState): GameState {
  const current = state.players[state.currentPlayerIndex];
  console.log(`[游戏逻辑] Countess ${current.name} 发动`);
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

  const target = targetId !== undefined ? state.players.find(p => p.id === targetId) : undefined;
  const targetName = target ? target.name : (targetId !== undefined ? `ID${targetId}` : '无');
  const guessStr = guess ? `, 猜测 ${guess}` : '';
  const playLog = `${currentPlayer.name} 打出 ${cardName}${cardName === 'Guard' ? ` 目标 ${targetName}${guessStr}` : (targetName !== '无' ? ` 目标 ${targetName}` : '')}`;
  state = { ...state, log: [...state.log, playLog] };

  if (currentPlayer.type === 'human' && cardName !== 'Countess' && checkCountessRequired(state)) {
    return { ...state, message: '拥有王子或国王时必须出伯爵夫人' };
  }

  let newState: GameState;

  switch (cardName) {
    case 'Spy':
      newState = {
        ...state,
        lastSpyPlayerId: state.currentPlayerIndex,
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

  // Chancellor特殊：保持playing让玩家继续选择
  if (cardName === 'Chancellor') {
    return newState;
  }

  // 等待玩家确认后再到下一回合
  return {
    ...newState,
    waitingForNextTurn: true,
    message: `等待确认后到下一回合`,
  };
}

export function advanceToNextTurn(state: GameState): GameState {
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let attempts = 0;
  while (state.players[nextIndex].isEliminated && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  const nextPlayer = state.players[nextIndex];

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    waitingForNextTurn: false,
    phase: 'playing',
    message: `${nextPlayer.name}的回合 - 抽牌`,
    log: [...state.log, `轮到 ${nextPlayer.name} 行动`],
  };
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