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

  return (
    <div className="h-screen flex flex-col">
      <GameHeader />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 gap-2 overflow-y-auto">
          {state.players
            .filter((p) => !p.isHuman)
            .map((p) => (
              <PlayerArea
                key={p.id}
                player={p}
                isCurrentTurn={p.id === state.currentPlayerIndex}
                onSelectPlayer={
                  targetMode
                    ? (targetId) => {
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
                    : undefined
                }
                targetMode={targetMode && p.id !== state.currentPlayerIndex}
              />
            ))}
          <TableCenter />
          <PlayerArea
            player={state.players[0]}
            isCurrentTurn={state.currentPlayerIndex === 0}
            mustDiscard={mustDiscard}
            onPlayCard={onPlayCard}
            selectableCardIds={selectableCardIds}
            facing="bottom"
          />
        </div>
        <div className="w-80 p-4 border-l border-slate-700">
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
  return (
    <ChancellorPicker allCards={allCards} onConfirm={onConfirm} />
  );
}

function ChancellorPicker({ allCards, onConfirm }: { allCards: Card[]; onConfirm: (order: Card[]) => void }) {
  const [bottom, setBottom] = useState<Card | null>(null);
  const [second, setSecond] = useState<Card | null>(null);
  const slotOf = (id: string): 'first' | 'second' | null => {
    if (bottom?.id === id) return 'first';
    if (second?.id === id) return 'second';
    return null;
  };
  const toggle = (c: Card) => {
    const cur = slotOf(c.id);
    if (cur === 'first') setBottom(null);
    else if (cur === 'second') setSecond(null);
    else if (!bottom) setBottom(c);
    else if (!second) setSecond(c);
  };
  return (
    <Modal>
      <h2 className="text-2xl font-bold text-amber-300 mb-2">大臣 — 选 2 张放回牌库底</h2>
      <p className="text-sm text-slate-300 mb-4">点击下方手牌，放入「最底」或「次底」槽位。剩 1 张留在手牌。</p>
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-1">手牌（点击选择）</div>
        <div className="flex gap-2">
          {allCards.map((c) => {
            const slot = slotOf(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c)}
                disabled={!slot && (!!bottom && !!second)}
                className={`px-3 py-2 rounded font-bold text-sm transition-all ${
                  slot === 'first'
                    ? 'bg-amber-700 text-white'
                    : slot === 'second'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {c.name} ({c.value})
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Slot label="最底（先放）" card={bottom} />
        <Slot label="次底" card={second} />
      </div>
      <button
        onClick={() => {
          if (bottom && second) onConfirm([bottom, second]);
        }}
        disabled={!(bottom && second)}
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
