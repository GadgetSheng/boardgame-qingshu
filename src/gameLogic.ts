import {
  CARD_DEFS,
  type Card,
  type CardName,
  type GameState,
  type LogEntry,
  type LogEvent,
  type Player,
} from './types';

let cardIdCounter = 0;
export function resetCardIdCounter() {
  cardIdCounter = 0;
}
function newId(): string {
  cardIdCounter += 1;
  return `c${cardIdCounter}`;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const def of CARD_DEFS) {
    for (let i = 0; i < def.count; i++) {
      deck.push({ id: newId(), name: def.name, value: def.value });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function targetTokensFor(playerCount: number): number {
  if (playerCount <= 2) return 3;
  if (playerCount <= 4) return 4;
  return 5;
}

function defaultNames(playerCount: number, humanName: string): string[] {
  const aiNames = ['阿狸', '小灰', '团子', '老白', '小墨'];
  const names = [humanName];
  for (let i = 0; i < playerCount - 1; i++) {
    names.push(aiNames[i % aiNames.length] + (i >= aiNames.length ? `${Math.floor(i / aiNames.length) + 1}` : ''));
  }
  return names;
}

export function initGame(
  aiCount: number,
  humanName = '你',
): GameState {
  resetCardIdCounter();
  const totalPlayers = aiCount + 1;
  const names = defaultNames(totalPlayers, humanName);
  const players: Player[] = names.map((name, i) => ({
    id: i,
    name,
    isHuman: i === 0,
    alive: true,
    hand: [],
    protected: false,
    tokens: 0,
    usedSpy: false,
  }));

  let deck = shuffle(createDeck());

  // 开局移除 1 张（暗抽，不公开）
  const removed: Card[] = [];
  const firstRemoved = deck.pop();
  if (firstRemoved) removed.push(firstRemoved);

  const removedPublic: Card[] = [];

  // 发初始手牌
  for (const p of players) {
    const c = deck.pop();
    if (c) p.hand.push(c);
  }

  const state: GameState = {
    players,
    deck,
    discard: [],
    removed,
    removedPublic,
    currentPlayerIndex: 0,
    turn: 0,
    round: 1,
    phase: 'CHOOSE_CARD',
    log: [],
    pending: {},
    winner: null,
    gameOverReason: '',
    logIdCounter: 0,
    targetTokens: targetTokensFor(totalPlayers),
    humanPlayerId: 0,
  };

  pushLog(state, [], `游戏开始。${totalPlayers} 名玩家。开局移除 ${1 + removedPublic.length} 张牌。`);
  return state;
}

function pushLog(
  state: GameState,
  events: LogEvent[],
  text: string,
  opts?: { secret?: string; knownBy?: number[] },
) {
  state.logIdCounter += 1;
  const entry: LogEntry = {
    id: state.logIdCounter,
    turn: state.turn,
    text,
    events,
  };
  if (opts?.secret) {
    entry.secret = opts.secret;
    entry.knownBy = opts.knownBy;
  }
  state.log.push(entry);
  const full = opts?.secret ? `${text}${opts.secret}` : text;
  // eslint-disable-next-line no-console
  console.log(`[log#${entry.id} t${entry.turn}] ${full}`);
}

function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.alive);
}

function otherAliveTargets(state: GameState, playerId: number): Player[] {
  return state.players.filter((p) => p.alive && p.id !== playerId && !p.protected);
}

export function mustPlayCountess(state: GameState): boolean {
  const p = currentPlayer(state);
  if (!p.alive) return false;
  const hasCountess = p.hand.some((c) => c.name === '女伯爵');
  if (!hasCountess) return false;
  const hasKingOrPrince = p.hand.some((c) => c.name === '国王' || c.name === '王子');
  return hasKingOrPrince;
}

export function canPlayCard(state: GameState, card: Card): boolean {
  if (state.phase !== 'CHOOSE_CARD') return false;
  const p = currentPlayer(state);
  if (!p.hand.find((c) => c.id === card.id)) return false;
  if (mustPlayCountess(state) && card.name !== '女伯爵') return false;
  return true;
}

export function drawOne(state: GameState): Card | null {
  if (state.deck.length === 0) return null;
  return state.deck.pop() ?? null;
}

export function playerDrawPhase(state: GameState) {
  const p = currentPlayer(state);
  p.protected = false;
  const events: LogEvent[] = [];
  const card = drawOne(state);
  if (!card) {
    pushLog(state, events, `[回合 ${state.round}·${state.turn}] ${p.name} 牌库为空，结束回合。`);
    return;
  }
  p.hand.push(card);
  events.push({ kind: 'DRAW', player: p.id, card, hand: [...p.hand] });
  pushLog(
    state,
    events,
    `[回合 ${state.round}·${state.turn}] ${p.name} 摸了 1 张牌。`,
    {
      secret: ` 抽到 [${card.name}]，手牌: ${p.hand.map((c) => c.name).join(' / ')}`,
      knownBy: [p.id],
    },
  );
}

// 出牌
export function playCard(state: GameState, cardId: string): GameState {
  const p = currentPlayer(state);
  const card = p.hand.find((c) => c.id === cardId);
  if (!card) return state;
  if (!canPlayCard(state, card)) return state;

  p.hand = p.hand.filter((c) => c.id !== cardId);
  state.discard.push({ card, playerId: p.id });

  const events: LogEvent[] = [{ kind: 'PLAY', player: p.id, card }];
  pushLog(state, events, `[回合 ${state.round}·${state.turn}] ${p.name} 打出 [${card.name}]`);

  // 标记用过的间谍
  if (card.name === '间谍') p.usedSpy = true;

  switch (card.name) {
    case '公主':
      eliminatePlayer(state, p.id, '打出公主', card);
      advanceTurn(state);
      return state;
    case '女伯爵':
      // 无效果
      pushLog(state, [], `[回合 ${state.round}] [${card.name}] 无效果。`);
      advanceTurn(state);
      return state;
    case '侍女':
      p.protected = true;
      events.push({ kind: 'PROTECT', player: p.id, card });
      pushLog(state, events, `${p.name} 获得免疫直到下回合。`);
      advanceTurn(state);
      return state;
    case '间谍':
      // 无即时效果。间谍奖励在 round/局末结算。
      pushLog(state, [], `[回合 ${state.round}] [${card.name}] 无即时效果。间谍奖励在局末结算。`);
      advanceTurn(state);
      return state;
    case '大臣':
      startChancellor(state);
      return state;
    case '王子': {
      state.phase = 'PRINCE_TARGET';
      state.pending.princeTarget = undefined;
      return state;
    }
    case '国王': {
      state.phase = 'KING_TARGET';
      state.pending.kingTarget = undefined;
      if (otherAliveTargets(state, p.id).length === 0) {
        pushLog(state, [], `${p.name} 打出 [国王]，但没有可交换的目标，效果无效。`);
        advanceTurn(state);
      }
      return state;
    }
    case '男爵': {
      state.phase = 'BARON_TARGET';
      state.pending.baronTarget = undefined;
      if (otherAliveTargets(state, p.id).length === 0) {
        pushLog(state, [], `${p.name} 打出 [男爵]，但没有可比较的目标，效果无效。`);
        advanceTurn(state);
      }
      return state;
    }
    case '神父': {
      state.phase = 'PRIEST_TARGET';
      state.pending.priestTarget = undefined;
      if (otherAliveTargets(state, p.id).length === 0) {
        pushLog(state, [], `${p.name} 打出 [神父]，但没有可查看的目标，效果无效。`);
        advanceTurn(state);
      }
      return state;
    }
    case '卫兵': {
      state.phase = 'GUARD_GUESS';
      state.pending.guardTarget = undefined;
      if (otherAliveTargets(state, p.id).length === 0) {
        pushLog(state, [], `${p.name} 打出 [卫兵]，但没有可猜测的目标，效果无效。`);
        advanceTurn(state);
      }
      return state;
    }
  }
}

function startChancellor(state: GameState) {
  // 抽 2 张
  const a = drawOne(state);
  const b = drawOne(state);
  const drawn: Card[] = [];
  if (a) drawn.push(a);
  if (b) drawn.push(b);
  state.pending.chancellorDrawn = drawn;
  state.phase = drawn.length > 0 ? 'CHANCELLOR_DISCARD' : 'CHOOSE_CARD';
  if (drawn.length === 0) {
    pushLog(state, [], `[大臣] 牌库为空，无牌可抽。`);
    advanceTurn(state);
  } else {
    pushLog(
      state,
      [],
      `[大臣] ${currentPlayer(state).name} 抽了 2 张牌，从 3 张中选 2 张按顺序放牌库底。`,
      {
        secret: ` 实际抽到: ${drawn.map((c) => c.name).join(' / ')}`,
        knownBy: [currentPlayer(state).id],
      },
    );
  }
}

export function chancellorReturnCards(
  state: GameState,
  bottomOrder: Card[],
): GameState {
  // bottomOrder: 放牌库底的牌（数组顺序 = 自下而上）
  // pool = 原手牌 + 抽到的，pool.length - 1 张放回底部，1 张留下
  const drawn = state.pending.chancellorDrawn ?? [];
  const p = currentPlayer(state);
  const existing = p.hand[0] ?? null;
  const pool: Card[] = existing ? [existing, ...drawn] : drawn;
  const valid = bottomOrder.filter((c): c is Card => !!c);
  if (valid.length !== pool.length - 1) return state;
  if (valid.some((c) => !pool.find((d) => d.id === c.id))) return state;
  if (new Set(valid.map((c) => c.id)).size !== valid.length) return state;
  // 牌库底 = 数组头部。valid 已按"最弱优先放最底"排序（c0=最底）
  // 直接 prepend 即可，无需 reverse
  state.deck = valid.concat(state.deck);
  // 玩家手牌 = pool 中未放回底部的牌
  const keep = pool.find((c) => !valid.find((b) => b.id === c.id)) ?? null;
  p.hand = keep ? [keep] : [];
  state.pending.chancellorDrawn = undefined;
  pushLog(
    state,
    [],
    `[大臣] ${p.name} 从 3 张中选 1 张留手牌，其余按顺序放牌库底。`,
    {
      secret: ` 留 [${keep?.name ?? '空'}]，把 [${valid.map((c) => c.name).join(' / ')}] 放回牌库底。`,
      knownBy: [p.id],
    },
  );
  advanceTurn(state);
  return state;
}

function eliminatePlayer(
  state: GameState,
  playerId: number,
  reason: string,
  opts?: { reasonSecret?: string; reasonKnownBy?: number[]; card?: Card },
) {
  const p = state.players[playerId];
  if (!p.alive) return;
  p.alive = false;
  // 公主弃掉/被王子弃 → usedSpy 不算
  for (const c of p.hand) {
    state.discard.push({ card: c, playerId });
  }
  const handNames = p.hand.map((c) => c.name).join(' / ');
  p.hand = [];
  const isHuman = playerId === state.humanPlayerId;
  // 出局者手牌:仅当出局者是人类时公开;否则进入 secret
  const handSecret = ` 手牌: ${handNames || '无'}。`;
  const knownBy: number[] = [];
  if (opts?.reasonKnownBy) knownBy.push(...opts.reasonKnownBy);
  if (isHuman) knownBy.push(state.humanPlayerId);
  const fullSecret = [opts?.reasonSecret, handSecret].filter(Boolean).join('');
  state.logIdCounter += 1;
  const text = `[出局] ${p.name} - ${reason}。`;
  const entry: LogEntry = {
    id: state.logIdCounter,
    turn: state.turn,
    text,
    events: [{ kind: 'ELIMINATE', player: playerId, reason: `${reason}${opts?.reasonSecret ?? ''}`, card: opts?.card }],
  };
  if (fullSecret) {
    entry.secret = fullSecret;
    entry.knownBy = Array.from(new Set(knownBy));
  }
  state.log.push(entry);
  const full = `${text}${fullSecret}`;
  // eslint-disable-next-line no-console
  console.log(`[log#${entry.id} t${entry.turn}] ${full}`);
}

// 卫兵
export function guardGuess(state: GameState, targetId: number, guess: CardName): GameState {
  if (state.phase !== 'GUARD_GUESS') return state;
  if (guess === '卫兵') return state;
  const p = currentPlayer(state);
  const target = state.players[targetId];
  if (!target.alive || target.id === p.id) return state;
  if (target.protected) {
    pushLog(state, [], `${p.name} 卫兵猜 [${target.name}] 是 [${guess}]，但 ${target.name} 处于免疫状态，免疫生效。`);
    advanceTurn(state);
    return state;
  }
  state.pending.guardTarget = targetId;
  const events: LogEvent[] = [
    { kind: 'TARGET', player: p.id, target: targetId, card: { id: '', name: '卫兵', value: 1 } },
  ];
  if (target.hand[0]?.name === guess) {
    pushLog(state, events, `${p.name} 用卫兵猜 [${target.name}] 是 [${guess}]，猜中！${target.name} 出局。`);
    eliminatePlayer(state, targetId, `被卫兵猜中持 [${guess}]`, target.hand[0]);
  } else {
    pushLog(
      state,
      events,
      `${p.name} 用卫兵猜 [${target.name}] 是 [${guess}]，猜错。`,
    );
    // 卫兵规则：猜错不告知目标真实手牌；控制台留底供调试
    // eslint-disable-next-line no-console
    console.log(
      `  └─ [卫兵未命中] ${target.name} 实际 [${target.hand[0]?.name ?? '无'}]`,
    );
  }
  state.pending.guardTarget = undefined;
  advanceTurn(state);
  return state;
}

// 神父
export function priestView(state: GameState, targetId: number): GameState {
  if (state.phase !== 'PRIEST_TARGET') return state;
  const p = currentPlayer(state);
  const target = state.players[targetId];
  if (!target.alive || target.id === p.id) return state;
  if (target.protected) {
    pushLog(state, [], `${p.name} 神父查看 [${target.name}]，但 ${target.name} 免疫，查看失败。`);
    state.pending.priestTarget = undefined;
    advanceTurn(state);
    return state;
  }
  state.pending.priestTarget = targetId;
  const card = target.hand[0];
  pushLog(
    state,
    [{ kind: 'TARGET', player: p.id, target: targetId, card: { id: '', name: '神父', value: 2 } }],
    `${p.name} 神父查看 [${target.name}] 的手牌。`,
    {
      secret: ` 实际: [${card?.name ?? '无'}]。`,
      knownBy: [p.id],
    },
  );
  state.pending.priestTarget = undefined;
  // 人类施法：暂停进入翻牌动画阶段，等用户确认后再 advanceTurn
  if (p.id === state.humanPlayerId) {
    state.pending.priestRevealed = { targetId, card: card ?? null };
    state.phase = 'PRIEST_REVEAL';
    return state;
  }
  advanceTurn(state);
  return state;
}

// 神父翻牌动画结束：推进回合
export function priestRevealDismiss(state: GameState): GameState {
  if (state.phase !== 'PRIEST_REVEAL') return state;
  state.pending.priestRevealed = undefined;
  advanceTurn(state);
  return state;
}

// 男爵
export function baronCompare(state: GameState, targetId: number): GameState {
  if (state.phase !== 'BARON_TARGET') return state;
  const p = currentPlayer(state);
  const target = state.players[targetId];
  if (!target.alive || target.id === p.id) return state;
  if (target.protected) {
    pushLog(state, [], `${p.name} 男爵比较 [${target.name}]，但 ${target.name} 免疫，比较无效。`);
    state.pending.baronTarget = undefined;
    advanceTurn(state);
    return state;
  }
  const myCard = p.hand[0];
  const theirCard = target.hand[0];
  state.pending.baronTarget = targetId;
  const humanInvolved = p.id === state.humanPlayerId || target.id === state.humanPlayerId;
  pushLog(
    state,
    [{ kind: 'TARGET', player: p.id, target: targetId, card: { id: '', name: '男爵', value: 3 } }],
    `${p.name} 男爵与 [${target.name}] 比牌。`,
    humanInvolved
      ? {
          secret: ` ${p.name}=[${myCard?.name}] ${target.name}=[${theirCard?.name}]。`,
          knownBy: [state.humanPlayerId],
        }
      : undefined,
  );
  if ((myCard?.value ?? 0) < (theirCard?.value ?? 0)) {
    eliminatePlayer(state, p.id, `男爵比牌败给 ${target.name}`, {
      reasonSecret: ` [${theirCard?.name}]`,
      reasonKnownBy: humanInvolved ? [state.humanPlayerId] : [],
    });
  } else if ((myCard?.value ?? 0) > (theirCard?.value ?? 0)) {
    eliminatePlayer(state, targetId, `男爵比牌输给 ${p.name}`, {
      reasonSecret: ` [${myCard?.name}]`,
      reasonKnownBy: humanInvolved ? [state.humanPlayerId] : [],
    });
  } else {
    pushLog(state, [], `平手，无人出局。`);
  }
  state.pending.baronTarget = undefined;
  advanceTurn(state);
  return state;
}

// 国王
export function kingSwap(state: GameState, targetId: number): GameState {
  if (state.phase !== 'KING_TARGET') return state;
  const p = currentPlayer(state);
  const target = state.players[targetId];
  if (!target.alive || target.id === p.id) return state;
  if (target.protected) {
    pushLog(state, [], `${p.name} 国王交换 [${target.name}]，但 ${target.name} 免疫，交换无效。`);
    state.pending.kingTarget = undefined;
    advanceTurn(state);
    return state;
  }
  const myHand = p.hand[0];
  const theirHand = target.hand[0];
  p.hand = theirHand ? [theirHand] : [];
  target.hand = myHand ? [myHand] : [];
  state.pending.kingTarget = targetId;
  const humanInvolved = p.id === state.humanPlayerId || target.id === state.humanPlayerId;
  pushLog(
    state,
    [{ kind: 'TARGET', player: p.id, target: targetId, card: { id: '', name: '国王', value: 6 } }],
    `${p.name} 国王与 [${target.name}] 交换手牌。`,
    humanInvolved
      ? {
          secret: ` ${p.name} 获得 [${theirHand?.name}]，${target.name} 获得 [${myHand?.name}]。`,
          knownBy: [state.humanPlayerId],
        }
      : undefined,
  );
  state.pending.kingTarget = undefined;
  advanceTurn(state);
  return state;
}

// 王子
export function princeTarget(state: GameState, targetId: number): GameState {
  if (state.phase !== 'PRINCE_TARGET') return state;
  const p = currentPlayer(state);
  const target = state.players[targetId];
  if (!target.alive) return state;
  state.pending.princeTarget = targetId;
  pushLog(
    state,
    [{ kind: 'TARGET', player: p.id, target: targetId, card: { id: '', name: '王子', value: 5 } }],
    `${p.name} 王子指定 [${target.name}] 弃手牌并摸新牌。`,
  );
  resolvePrinceOn(state, targetId);
  state.pending.princeTarget = undefined;
  advanceTurn(state);
  return state;
}

function resolvePrinceOn(state: GameState, targetId: number) {
  const target = state.players[targetId];
  const discarded = target.hand[0];
  if (discarded) {
    state.discard.push({ card: discarded, playerId: targetId });
    target.hand = [];
    pushLog(
      state,
      [],
      `${target.name} 弃掉 1 张手牌。`,
      {
        secret: ` 实际: [${discarded.name}]。`,
        knownBy: [targetId],
      },
    );
    if (discarded.name === '公主') {
      eliminatePlayer(state, targetId, '被王子弃掉公主', {
        reasonSecret: ` [公主]`,
        reasonKnownBy: [state.humanPlayerId],
      });
      return;
    }
  }
  const newCard = drawOne(state);
  if (newCard) {
    target.hand.push(newCard);
    pushLog(state, [], `${target.name} 摸了 1 张新牌。`, {
      secret: ` 实际: [${newCard.name}]。`,
      knownBy: [targetId],
    });
  } else if (state.removed.length > 0) {
    // 特殊规则：王子是最后一张牌打出时，从移除堆拿
    const fromRemoved = state.removed.pop()!;
    target.hand.push(fromRemoved);
    pushLog(
      state,
      [],
      `牌库已空。${target.name} 从移除堆拿了 1 张牌。`,
      {
        secret: ` 实际: [${fromRemoved.name}]。`,
        knownBy: [targetId],
      },
    );
  } else {
    pushLog(state, [], `牌库与移除堆都空，${target.name} 无牌可摸。`);
  }
}

// 回合推进
export function nextActivePlayer(state: GameState, from: number): number {
  const n = state.players.length;
  let i = (from + 1) % n;
  let safety = 0;
  while (safety < n) {
    const p = state.players[i];
    if (p.alive) return i;
    i = (i + 1) % n;
    safety += 1;
  }
  return from;
}



export function advanceTurn(state: GameState) {
  // 单局胜负
  const alive = alivePlayers(state);
  if (alive.length === 1) {
    endRound(state, alive[0].id, '只剩 1 人存活');
    return;
  }
  if (alive.length === 0) {
    state.gameOverReason = '全部出局';
    state.phase = 'GAME_OVER';
    state.winner = null;
    pushLog(state, [], `[本局结束] 全部出局，无胜者。`);
    return;
  }
  if (state.deck.length === 0) {
    // 牌库耗尽：进入所有存活玩家亮牌动画阶段
    const sorted = [...alive].sort((a, b) => (b.hand[0]?.value ?? -1) - (a.hand[0]?.value ?? 0));
    const top = sorted[0];
    const tied = sorted.filter((p) => (p.hand[0]?.value ?? -1) === (top.hand[0]?.value ?? -1));
    if (tied.length === 1) {
      state.pending.finalReveal = { winnerId: top.id, reason: '牌库耗尽，比牌胜出' };
    } else {
      state.pending.finalReveal = {
        winnerId: -1,
        reason: `牌库耗尽，平局（[${tied.map((p) => p.name).join(', ')}] 同胜）`,
        tiedIds: tied.map((p) => p.id),
      };
    }
    state.phase = 'FINAL_REVEAL';
    pushLog(state, [], `[本局结束] 牌库耗尽，进入亮牌阶段。`);
    return;
  }
  // 推进入下一玩家
  state.currentPlayerIndex = nextActivePlayer(state, state.currentPlayerIndex);
  state.turn += 1;
  // 计算轮数：当 currentPlayerIndex 回到 0 时加 1
  if (state.currentPlayerIndex === 0) {
    state.round += 1;
  }
  state.phase = 'CHOOSE_CARD';
  // 下一玩家回合开始：清除其 protected
  const np = currentPlayer(state);
  np.protected = false;
}

// 牌库耗尽亮牌动画结束：真正结算本局
export function finalRevealResolve(state: GameState): GameState {
  if (state.phase !== 'FINAL_REVEAL') return state;
  const r = state.pending.finalReveal;
  if (!r) return state;
  state.pending.finalReveal = undefined;
  endRound(state, r.winnerId, r.reason, r.tiedIds);
  return state;
}

function endRound(
  state: GameState,
  winnerId: number,
  reason: string,
  tiedIds?: number[],
) {
  // 间谍奖励：唯一打出且存活到最后的玩家 +1；多人打出或唯一打出者已出局 → 无人得分
  const spyPlayers = state.players.filter((p) => p.usedSpy);
  if (spyPlayers.length === 1 && spyPlayers[0].alive) {
    const p = spyPlayers[0];
    p.tokens += 1;
    state.log.push({
      id: ++state.logIdCounter,
      turn: state.turn,
      text: `[间谍奖励] ${p.name} 是唯一打出间谍且存活到最后，获得 +1 标记。`,
      events: [{ kind: 'SPY_BONUS', player: p.id, reason: '唯一间谍存活' }],
    });
  } else if (spyPlayers.length > 1) {
    state.log.push({
      id: ++state.logIdCounter,
      turn: state.turn,
      text: `[间谍奖励] 多人打出间谍（${spyPlayers.map((p) => p.name).join('、')}），无人获得奖励。`,
      events: [],
    });
  }

  // 单局胜者 +1
  if (winnerId >= 0) {
    const w = state.players[winnerId];
    w.tokens += 1;
    pushLog(
      state,
      [{ kind: 'GAME_OVER', winner: winnerId, reason }],
      `[本局结束] ${w.name} 胜（${reason}），获得 +1 标记。${w.tokens} / ${state.targetTokens}`,
    );
  } else if (tiedIds && tiedIds.length > 0) {
    for (const id of tiedIds) {
      const p = state.players[id];
      p.tokens += 1;
    }
    pushLog(
      state,
      [{ kind: 'GAME_OVER', winner: null, reason }],
      `[本局结束] ${reason}，各获得 +1 标记。`,
    );
  }

  // 检查全局胜利
  for (const p of state.players) {
    if (p.tokens >= state.targetTokens) {
      state.winner = p.id;
      state.gameOverReason = `获得 ${state.targetTokens} 个标记`;
      state.phase = 'GAME_OVER';
      pushLog(
        state,
        [{ kind: 'GAME_OVER', winner: p.id, reason: state.gameOverReason }],
        `【全局胜利】${p.name} 达成 ${state.targetTokens} 个标记，全局获胜！`,
      );
      return;
    }
  }

  // 开启下一局
  startNextRound(state);
}

function startNextRound(state: GameState) {
  resetCardIdCounter();
  // 重置牌
  const allCards = [
    ...state.deck,
    ...state.discard.map((d) => d.card),
    ...state.removed,
    ...state.removedPublic,
    ...state.players.flatMap((p) => p.hand),
  ];
  let deck = shuffle(allCards);
  // 移除 1 张（暗）
  state.removed = [];
  const r = deck.pop();
  if (r) state.removed.push(r);
  state.removedPublic = [];
  state.deck = deck;
  state.discard = [];
  // 重置玩家
  for (const p of state.players) {
    p.alive = true;
    p.hand = [];
    p.protected = false;
    p.usedSpy = false;
    const c = state.deck.pop();
    if (c) p.hand.push(c);
  }
  state.currentPlayerIndex = 0;
  state.turn = 0;
  state.round += 1;
  state.phase = 'CHOOSE_CARD';
  state.pending = {};
  pushLog(
    state,
    [],
    `[新一局] 第 ${state.round} 局开始。开局移除 ${1 + state.removedPublic.length} 张牌。`,
  );
}
