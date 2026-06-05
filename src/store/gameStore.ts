import { create } from 'zustand';
import {
  baronCompare,
  chancellorReturnCards,
  finalRevealResolve,
  guardGuess,
  initGame,
  kingSwap,
  mustPlayCountess,
  playCard,
  playerDrawPhase,
  princeTarget,
  priestRevealDismiss,
  priestView,
} from '../gameLogic';
import {
  aiBaronTarget,
  aiChancellorReturn,
  aiGuardGuess,
  aiGuardTarget,
  aiKingTarget,
  aiPickCard,
  aiPrinceTarget,
  aiPriestTarget,
} from '../ai';
import type { Card, CardName, GameState } from '../types';

interface Actions {
  newGame: (aiCount: number) => void;
  startTurnDraw: () => void;
  playCardAction: (cardId: string) => void;
  princeTargetAction: (targetId: number) => void;
  kingTargetAction: (targetId: number) => void;
  baronTargetAction: (targetId: number) => void;
  priestTargetAction: (targetId: number) => void;
  guardTargetAction: (targetId: number) => void;
  guardGuessAction: (targetId: number, guess: CardName) => void;
  chancellorReturnAction: (bottomOrder: Card[]) => void;
  priestRevealDismissAction: () => void;
  finalRevealAction: () => void;
  runAI: () => void;
}

const TARGET_RESOLVE_DELAY = 650;

export const useGameStore = create<{ state: GameState; actions: Actions }>((set, get) => ({
  state: initGame(1),
  actions: {
    newGame(aiCount: number) {
      set({ state: initGame(aiCount) });
    },
    startTurnDraw() {
      const s = get().state;
      const np = s.players[s.currentPlayerIndex];
      np.protected = false;
      playerDrawPhase(s);
      set({ state: { ...s } });
    },
    playCardAction(cardId: string) {
      const s = get().state;
      if (s.phase !== 'CHOOSE_CARD') return;
      if (s.players[s.currentPlayerIndex].isHuman === false) return;
      playCard(s, cardId);
      set({ state: { ...s } });
    },
    princeTargetAction(targetId: number) {
      const s = get().state;
      if (s.phase !== 'PRINCE_TARGET') return;
      princeTarget(s, targetId);
      set({ state: { ...s } });
    },
    kingTargetAction(targetId: number) {
      const s = get().state;
      if (s.phase !== 'KING_TARGET') return;
      kingSwap(s, targetId);
      set({ state: { ...s } });
    },
    baronTargetAction(targetId: number) {
      const s = get().state;
      if (s.phase !== 'BARON_TARGET') return;
      baronCompare(s, targetId);
      set({ state: { ...s } });
    },
    priestTargetAction(targetId: number) {
      const s = get().state;
      if (s.phase !== 'PRIEST_TARGET') return;
      priestView(s, targetId);
      set({ state: { ...s } });
    },
    guardTargetAction(targetId: number) {
      const s = get().state;
      if (s.phase !== 'GUARD_GUESS') return;
      // 选完目标后立即进入卫兵猜牌子阶段
      s.pending.guardTarget = targetId;
      set({ state: { ...s } });
    },
    guardGuessAction(targetId: number, guess: CardName) {
      const s = get().state;
      if (s.phase !== 'GUARD_GUESS') return;
      guardGuess(s, targetId, guess);
      set({ state: { ...s } });
    },
    chancellorReturnAction(bottomOrder: Card[]) {
      const s = get().state;
      if (s.phase !== 'CHANCELLOR_DISCARD') return;
      chancellorReturnCards(s, bottomOrder);
      set({ state: { ...s } });
    },
    priestRevealDismissAction() {
      const s = get().state;
      if (s.phase !== 'PRIEST_REVEAL') return;
      priestRevealDismiss(s);
      set({ state: { ...s } });
    },
    finalRevealAction() {
      const s = get().state;
      if (s.phase !== 'FINAL_REVEAL') return;
      finalRevealResolve(s);
      set({ state: { ...s } });
    },
    runAI() {
      const s = get().state;
      if (s.phase === 'GAME_OVER') return;
      if (s.phase === 'FINAL_REVEAL') {
        // 亮牌动画由 UI 自动推进，AI 不操作
        return;
      }
      const p = s.players[s.currentPlayerIndex];
      if (p.isHuman) return;
      const playerId = p.id;

      // 根据 phase 自动决策
      if (s.phase === 'CHOOSE_CARD') {
        // 强制伯爵夫人检查
        if (mustPlayCountess(s)) {
          const countess = p.hand.find((c) => c.name === '女伯爵');
          if (countess) {
            playCard(s, countess.id);
          } else {
            const picked = aiPickCard(s, playerId);
            if (picked) playCard(s, picked.id);
          }
        } else {
          const picked = aiPickCard(s, playerId);
          if (picked) playCard(s, picked.id);
        }
        set({ state: { ...s } });
        return;
      }
      if (s.phase === 'PRINCE_TARGET') {
        const t = aiPrinceTarget(s, playerId);
        if (t != null) {
          s.pending.princeTarget = t;
          set({ state: { ...s } });
          setTimeout(() => {
            const cur = get().state;
            if (cur.phase !== 'PRINCE_TARGET') return;
            princeTarget(cur, t);
            set({ state: { ...cur } });
          }, TARGET_RESOLVE_DELAY);
        }
        return;
      }
      if (s.phase === 'KING_TARGET') {
        const t = aiKingTarget(s, playerId);
        if (t != null) {
          s.pending.kingTarget = t;
          set({ state: { ...s } });
          setTimeout(() => {
            const cur = get().state;
            if (cur.phase !== 'KING_TARGET') return;
            kingSwap(cur, t);
            set({ state: { ...cur } });
          }, TARGET_RESOLVE_DELAY);
        }
        return;
      }
      if (s.phase === 'BARON_TARGET') {
        const t = aiBaronTarget(s, playerId);
        if (t != null) {
          s.pending.baronTarget = t;
          set({ state: { ...s } });
          setTimeout(() => {
            const cur = get().state;
            if (cur.phase !== 'BARON_TARGET') return;
            baronCompare(cur, t);
            set({ state: { ...cur } });
          }, TARGET_RESOLVE_DELAY);
        }
        return;
      }
      if (s.phase === 'PRIEST_TARGET') {
        const t = aiPriestTarget(s, playerId);
        if (t != null) {
          s.pending.priestTarget = t;
          set({ state: { ...s } });
          setTimeout(() => {
            const cur = get().state;
            if (cur.phase !== 'PRIEST_TARGET') return;
            priestView(cur, t);
            set({ state: { ...cur } });
          }, TARGET_RESOLVE_DELAY);
        }
        return;
      }
      if (s.phase === 'GUARD_GUESS') {
        const t = aiGuardTarget(s, playerId);
        if (t != null) {
          s.pending.guardTarget = t;
          set({ state: { ...s } });
          setTimeout(() => {
            const cur = get().state;
            if (cur.phase !== 'GUARD_GUESS') return;
            const guess = aiGuardGuess(cur, playerId, t);
            guardGuess(cur, t, guess);
            set({ state: { ...cur } });
          }, TARGET_RESOLVE_DELAY);
        }
        return;
      }
      if (s.phase === 'CHANCELLOR_DISCARD') {
        const drawn = s.pending.chancellorDrawn ?? [];
        const order = aiChancellorReturn(s, playerId, drawn);
        chancellorReturnCards(s, order);
        set({ state: { ...s } });
        return;
      }
    },
  },
}));
