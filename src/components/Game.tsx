import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameHeader } from './GameHeader';
import { GameLog } from './GameLog';
import { GameOverModal } from './GameOverModal';
import { PlayerArea } from './PlayerArea';
import { TableCenter } from './TableCenter';
import { mustPlayCountess } from '../gameLogic';
import { CARD_DEFS } from '../types';
import type { Card, CardName } from '../types';

const GUESSABLE_CARDS = CARD_DEFS.filter((d) => d.name !== '卫兵').map((d) => d.name);

export function Game() {
  const state = useGameStore((s) => s.state);
  const actions = useGameStore((s) => s.actions);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.isHuman && currentPlayer?.alive;

  // 回合开始：摸牌 (手牌 < 2 时)
  useEffect(() => {
    if (state.phase !== 'CHOOSE_CARD') return;
    if (!currentPlayer) return;
    if (currentPlayer.hand.length < 2 && state.deck.length > 0 && currentPlayer.alive) {
      const id = setTimeout(() => actions.startTurnDraw(), currentPlayer.isHuman ? 0 : 400);
      return () => clearTimeout(id);
    }
  }, [state.phase, state.currentPlayerIndex, state.round]);

  // AI 自动行动
  useEffect(() => {
    if (state.phase === 'GAME_OVER') return;
    if (currentPlayer.isHuman) return;
    const id = setTimeout(() => actions.runAI(), 800);
    return () => clearTimeout(id);
  }, [state.phase, state.currentPlayerIndex, state.round]);

  const mustDiscard = useMemo(
    () => state.phase === 'CHOOSE_CARD' && isHumanTurn && mustPlayCountess(state),
    [state, isHumanTurn],
  );

  const selectableCardIds = useMemo(() => {
    if (!isHumanTurn || state.phase !== 'CHOOSE_CARD') return new Set<string>();
    const ids = new Set<string>();
    for (const c of currentPlayer.hand) {
      if (mustDiscard && c.name !== '伯爵夫人') continue;
      ids.add(c.id);
    }
    return ids;
  }, [state, currentPlayer, isHumanTurn, mustDiscard]);

  const onPlayCard = (cardId: string) => {
    if (isHumanTurn) actions.playCardAction(cardId);
  };

  // 选目标阶段
  const targetMode = ['PRINCE_TARGET', 'KING_TARGET', 'BARON_TARGET', 'PRIEST_TARGET', 'GUARD_GUESS'].includes(state.phase);

  // 大臣选牌 UI
  const chancellorPhase = state.phase === 'CHANCELLOR_DISCARD';
  const chancellorDrawn = state.pending.chancellorDrawn ?? [];
  const currentHand = currentPlayer.hand[0];
  const chancellorAllCards: Card[] = currentHand ? [currentHand, ...chancellorDrawn] : chancellorDrawn;

  // AI 行动
  const guardPhase = state.phase === 'GUARD_GUESS';

  // 围坐席位分配：按出牌顺序顺时针，玩家固定在底
  // 1-5 AI 时分配到 5 个固定槽位
  const aiPlayers = state.players.filter((p) => !p.isHuman);
  const seats: Record<string, typeof aiPlayers[number] | undefined> = {};

  // 按玩家分组的弃牌
  const discardsByPlayer: Record<number, Card[]> = {};
  for (const d of state.discard) {
    if (!discardsByPlayer[d.playerId]) discardsByPlayer[d.playerId] = [];
    discardsByPlayer[d.playerId]!.push(d.card);
  }
  {
    const n = aiPlayers.length;
    if (n === 1) seats['top-mid'] = aiPlayers[0];
    else if (n === 2) {
      seats['top-left'] = aiPlayers[0];
      seats['top-right'] = aiPlayers[1];
    } else if (n === 3) {
      seats['top-left'] = aiPlayers[0];
      seats['top-mid'] = aiPlayers[1];
      seats['top-right'] = aiPlayers[2];
    } else if (n === 4) {
      seats['left'] = aiPlayers[0];
      seats['top-left'] = aiPlayers[1];
      seats['top-right'] = aiPlayers[2];
      seats['right'] = aiPlayers[3];
    } else if (n >= 5) {
      seats['left'] = aiPlayers[0];
      seats['top-left'] = aiPlayers[1];
      seats['top-mid'] = aiPlayers[2];
      seats['top-right'] = aiPlayers[3];
      seats['right'] = aiPlayers[4];
    }
  }

  const renderSeat = (slot: string) => {
    const p = seats[slot];
    if (!p) return <div className="w-[260px]" />; // 占位
    return (
      <PlayerArea
        player={p}
        isCurrentTurn={p.id === state.currentPlayerIndex}
        width={260}
        facing={slot === 'left' || slot === 'right' ? 'side' : 'top'}
        onSelectPlayer={makeSelectHandler(p.id)}
        targetMode={targetMode && p.id !== state.currentPlayerIndex}
        discards={discardsByPlayer[p.id] ?? []}
      />
    );
  };

  const makeSelectHandler = (_id: number) =>
    targetMode
      ? (targetId: number) => {
          if (state.phase === 'PRINCE_TARGET') actions.princeTargetAction(targetId);
          else if (state.phase === 'KING_TARGET') actions.kingTargetAction(targetId);
          else if (state.phase === 'BARON_TARGET') actions.baronTargetAction(targetId);
          else if (state.phase === 'PRIEST_TARGET') actions.priestTargetAction(targetId);
          else if (state.phase === 'GUARD_GUESS') {
            if (state.pending.guardTarget == null) {
              actions.guardTargetAction(targetId);
            }
          }
        }
      : undefined;

  return (
    <div className="h-screen flex flex-col">
      <GameHeader />
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 grid grid-rows-[auto_1fr_auto] grid-cols-[auto_minmax(0,1fr)_auto] gap-3 p-3 min-h-0">
          {/* 顶排左 */}
          <div className="row-start-1 col-start-1 flex justify-center items-start">
            {renderSeat('top-left')}
          </div>
          {/* 顶排中 */}
          <div className="row-start-1 col-start-2 flex justify-center items-start">
            {renderSeat('top-mid')}
          </div>
          {/* 顶排右 */}
          <div className="row-start-1 col-start-3 flex justify-center items-start">
            {renderSeat('top-right')}
          </div>

          {/* 左侧 */}
          <div className="row-start-2 col-start-1 flex items-center justify-start">
            {renderSeat('left')}
          </div>

          {/* 中央：牌桌 (弹性撑满) */}
          <div className="row-start-2 col-start-2 flex items-center justify-center min-h-0 min-w-0">
            <TableCenter />
          </div>

          {/* 右侧 */}
          <div className="row-start-2 col-start-3 flex items-center justify-end">
            {renderSeat('right')}
          </div>

          {/* 底排：人类玩家（跨 3 列居中） */}
          <div className="row-start-3 col-span-3 flex justify-center items-end">
            <PlayerArea
              player={state.players[0]}
              isCurrentTurn={state.currentPlayerIndex === 0}
              isOwnHand
              mustDiscard={mustDiscard}
              onPlayCard={onPlayCard}
              selectableCardIds={selectableCardIds}
              width={340}
              facing="bottom"
              discards={discardsByPlayer[state.players[0].id] ?? []}
            />
          </div>
        </div>
        <div className="w-72 border-l border-slate-700 flex flex-col p-2 min-h-0">
          <GameLog />
        </div>
      </div>

      {/* 大臣 UI：选 2 张放牌库底 */}
      {chancellorPhase && isHumanTurn && (
        <ChancellorDialog
          allCards={chancellorAllCards}
          onConfirm={(order) => actions.chancellorReturnAction(order)}
        />
      )}

      {/* 神父：翻牌动画 */}
      {state.phase === 'PRIEST_REVEAL' && state.pending.priestRevealed && (
        <PriestRevealDialog
          targetName={state.players[state.pending.priestRevealed.targetId]?.name ?? '?'}
          card={state.pending.priestRevealed.card}
          onDismiss={() => actions.priestRevealDismissAction()}
        />
      )}

      {/* 卫兵 UI：选目标后猜牌 */}
      {guardPhase && isHumanTurn && state.pending.guardTarget != null && (
        <GuardGuessDialog
          targetId={state.pending.guardTarget}
          onGuess={(guess) => actions.guardGuessAction(state.pending.guardTarget!, guess)}
        />
      )}

      {state.phase === 'GAME_OVER' && state.winner != null && (
        <GameOverModal
          winnerName={state.players[state.winner].name}
          onRestart={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function ChancellorDialog({ allCards, onConfirm }: { allCards: Card[]; onConfirm: (order: Card[]) => void }) {
  return <ChancellorPicker allCards={allCards} onConfirm={onConfirm} />;
}

function ChancellorPicker({ allCards, onConfirm }: { allCards: Card[]; onConfirm: (order: Card[]) => void }) {
  // 选 N-1 张放回底部（N = allCards.length，1 张留下）
  const pickCount = Math.max(0, allCards.length - 1);
  const slotLabels = ['最底（先放）', '次底', '第三底'];
  const [picks, setPicks] = useState<(Card | null)[]>(() => Array(pickCount).fill(null));
  // allCards 变化时重置
  useEffect(() => {
    setPicks(Array(pickCount).fill(null));
  }, [pickCount]);
  const slotOf = (id: string): number => picks.findIndex((c) => c?.id === id);
  const toggle = (c: Card) => {
    const cur = slotOf(c.id);
    if (cur >= 0) {
      const next = [...picks];
      next[cur] = null;
      setPicks(next);
      return;
    }
    const empty = picks.findIndex((s) => s === null);
    if (empty < 0) return;
    const next = [...picks];
    next[empty] = c;
    setPicks(next);
  };
  const filled = picks.filter((c): c is Card => !!c);
  const complete = filled.length === pickCount && pickCount > 0;
  return (
    <Modal>
      <h2 className="text-2xl font-bold text-amber-300 mb-2">
        大臣 — 选 {pickCount} 张放回牌库底
      </h2>
      <p className="text-sm text-slate-300 mb-4">
        点击下方手牌，按顺序放入「最底」→「次底」→… 槽位。剩 1 张留在手牌。
      </p>
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1">手牌（点击选择）</div>
        <div className="flex gap-2">
          {allCards.map((c) => {
            const slot = slotOf(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c)}
                disabled={slot < 0 && filled.length >= pickCount}
                className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                  slot === 0
                    ? 'bg-amber-700 text-white'
                    : slot === 1
                    ? 'bg-amber-600 text-white'
                    : slot >= 2
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {c.name} ({c.value})
              </button>
            );
          })}
        </div>
      </div>
      <div className={`grid gap-4 mb-4`} style={{ gridTemplateColumns: `repeat(${Math.max(pickCount, 1)}, minmax(0, 1fr))` }}>
        {picks.map((c, i) => (
          <Slot key={i} label={slotLabels[i] ?? `第${i + 1}底`} card={c} />
        ))}
      </div>
      <button
        onClick={() => {
          if (complete) onConfirm(filled);
        }}
        disabled={!complete}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        确认放回
      </button>
    </Modal>
  );
}

function Slot({ label, card }: { label: string; card: Card | null }) {
  return (
    <div className="bg-slate-800 border border-slate-600 rounded p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      {!card ? <div className="text-slate-600 text-sm">空</div> : (
        <div className="text-amber-300 font-bold">
          {card.name} ({card.value})
        </div>
      )}
    </div>
  );
}

function GuardGuessDialog({ targetId, onGuess }: { targetId: number; onGuess: (g: CardName) => void }) {
  const targetName = useGameStore((s) => s.state.players[targetId]?.name ?? '?');
  return (
    <Modal>
      <h2 className="text-2xl font-bold text-amber-300 mb-2">卫兵 — 猜 {targetName} 的手牌</h2>
      <p className="text-sm text-slate-300 mb-4">不能猜卫兵</p>
      <div className="grid grid-cols-3 gap-2">
        {GUESSABLE_CARDS.map((n) => (
          <button
            key={n}
            onClick={() => onGuess(n)}
            className="py-2 bg-slate-700 hover:bg-amber-600 text-slate-200 rounded font-bold"
          >
            {n}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-40 p-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function PriestRevealDialog({
  targetName,
  card,
  onDismiss,
}: {
  targetName: string;
  card: Card | null;
  onDismiss: () => void;
}) {
  // 动画时序：0ms 背面 → 350ms 翻到正面 → 2400ms 翻回背面 → 3000ms 自动关闭
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFlipped(true), 350);
    const t2 = setTimeout(() => setFlipped(false), 2400);
    const t3 = setTimeout(() => {
      setClosing(true);
      onDismiss();
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDismiss]);

  const colorClass = card ? cardColorClass(card.name) : 'from-slate-600 to-slate-800 border-slate-400';

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur flex flex-col items-center justify-center z-50 p-6 transition-opacity duration-300 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={() => {
        setClosing(true);
        onDismiss();
      }}
    >
      <h2 className="text-2xl font-bold text-amber-300 mb-2">
        神父查看 {targetName} 的手牌
      </h2>
      <p className="text-sm text-slate-300 mb-6">点击空白处关闭</p>

      <div className="[perspective:1000px]">
        <div
          className="relative w-40 h-56 [transform-style:preserve-3d] transition-transform duration-700 ease-out"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* 背面 */}
          <div className="absolute inset-0 rounded-xl border-2 bg-gradient-to-br from-indigo-700 to-indigo-900 border-indigo-400 flex items-center justify-center text-amber-300 font-bold shadow-2xl [backface-visibility:hidden]">
            <div className="flex flex-col items-center gap-1">
              <div className="text-5xl drop-shadow">❀</div>
              <div className="text-xs tracking-widest opacity-80">LOVE LETTER</div>
            </div>
          </div>
          {/* 正面 */}
          <div
            className={`absolute inset-0 rounded-xl border-2 bg-gradient-to-br ${colorClass} flex flex-col items-center justify-between p-3 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]`}
          >
            {card ? (
              <>
                <div className="text-4xl font-bold text-white drop-shadow">{card.value}</div>
                <div className="text-white font-bold text-xl text-center drop-shadow">
                  {card.name}
                </div>
                <div className="text-white text-xs opacity-80">{card.value} 点</div>
              </>
            ) : (
              <div className="text-white text-lg my-auto">手牌为空</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cardColorClass(name: CardName): string {
  const def = CARD_DEFS.find((d) => d.name === name);
  const map: Record<string, string> = {
    red: 'from-rose-600 to-rose-800 border-rose-400',
    yellow: 'from-amber-500 to-amber-700 border-amber-300',
    orange: 'from-orange-500 to-orange-700 border-orange-300',
    green: 'from-emerald-500 to-emerald-700 border-emerald-300',
    blue: 'from-sky-500 to-sky-700 border-sky-300',
    gray: 'from-slate-500 to-slate-700 border-slate-300',
  };
  return map[def?.color ?? 'gray'] ?? map.gray!;
}
