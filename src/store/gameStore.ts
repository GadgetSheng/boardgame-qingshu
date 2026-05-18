import { create } from 'zustand';
import type { GameState, CardName, PlayerType } from '../types';
import { setupGame, drawCard, playCard, getValidTargets, getValidGuesses, chancellorChooseCard, chooseDrawnCard, takeAITurn, advanceToNextTurn } from '../gameLogic';
import { makeChancellorChoice } from '../ai';

interface UIState {
  selectedCard: CardName | null;
  targetPlayerId: number | null;
  guardGuess: CardName | null;
  selectedDrawnCard: CardName | null;
  waitingForNextTurn: boolean;
}

interface GameStore extends UIState {
  gameState: GameState | null;
  aiTypes: PlayerType[];

  // Actions
  initGame: (aiTypes: PlayerType[]) => void;
  setSelectedCard: (card: CardName | null) => void;
  setTargetPlayerId: (id: number | null) => void;
  setGuardGuess: (guess: CardName | null) => void;
  setSelectedDrawnCard: (card: CardName | null) => void;
  setWaitingForNextTurn: (waiting: boolean) => void;

  // Game logic
  handleCardClick: (cardName: CardName) => void;
  handlePlayerSelect: (playerId: number) => void;
  handleGuessSelect: (guess: CardName) => void;
  handleChancellorSelect: (keptCard: CardName) => void;
  handlePlayCard: () => void;
  handleDrawnCardClick: (cardName: CardName) => void;
  handleConfirmDrawnCard: () => void;
  handleConfirmTurn: () => void;
  executeAITurn: () => void;

  // Queries
  canPlayCard: () => boolean;
  getCurrentPlayer: () => GameState['players'][0] | null;
  getValidTargetsForSelectedCard: () => GameState['players'];
  getValidGuessesList: () => CardName[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  aiTypes: [],
  selectedCard: null,
  targetPlayerId: null,
  guardGuess: null,
  selectedDrawnCard: null,
  waitingForNextTurn: false,

  initGame: (aiTypes) => {
    const playerTypes: PlayerType[] = ['human', ...aiTypes];
    const gameState = setupGame(playerTypes);
    set({
      gameState,
      aiTypes,
      selectedCard: null,
      targetPlayerId: null,
      guardGuess: null,
      selectedDrawnCard: null,
      waitingForNextTurn: false,
    });
  },

  setSelectedCard: (card) => set({ selectedCard: card, targetPlayerId: null, guardGuess: null }),
  setTargetPlayerId: (id) => set({ targetPlayerId: id }),
  setGuardGuess: (guess) => set({ guardGuess: guess }),
  setSelectedDrawnCard: (card) => set({ selectedDrawnCard: card }),
  setWaitingForNextTurn: (waiting) => set({ waitingForNextTurn: waiting }),

  handleCardClick: (cardName) => {
    const { gameState } = get();
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type !== 'human') return;
    if (currentPlayer.hand !== cardName) return;

    set({ selectedCard: cardName, targetPlayerId: null, guardGuess: null });

    const cardNeedsTarget = ['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(cardName);
    if (cardNeedsTarget) {
      const targets = getValidTargets(gameState, cardName);
      if (targets.length === 1) {
        set({ targetPlayerId: targets[0].id });
      }
    }
  },

  handlePlayerSelect: (playerId) => set({ targetPlayerId: playerId }),

  handleGuessSelect: (guess) => set({ guardGuess: guess }),

  handleChancellorSelect: (keptCard) => {
    const { gameState } = get();
    if (!gameState) return;
    const newState = chancellorChooseCard(gameState, keptCard);
    set({ gameState: newState });
  },

  handlePlayCard: () => {
    const { gameState, selectedCard, targetPlayerId, guardGuess } = get();
    if (!gameState || !selectedCard) return;
    if (!get().canPlayCard()) return;

    let targetId: number | undefined;
    if (['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(selectedCard)) {
      if (targetPlayerId !== null) {
        targetId = targetPlayerId;
      } else {
        return;
      }
    }

    if (selectedCard === 'Guard' && guardGuess === null) return;

    const newState = playCard(gameState, selectedCard, targetId, guardGuess ?? undefined);
    set({ gameState: newState, selectedCard: null, targetPlayerId: null, guardGuess: null });

    if (newState.phase === 'gameover') return;
    if (newState.handChoices.length > 0) return;

    const afterPlayPlayer = newState.players[newState.currentPlayerIndex];
    if (afterPlayPlayer.hand === null && newState.deck.length > 0) {
      const drawnState = drawCard(newState);
      set({ gameState: drawnState });
      return;
    }

    const nextPlayer = newState.players[newState.currentPlayerIndex];
    if (nextPlayer.type !== 'human' && newState.phase === 'playing') {
      setTimeout(() => {
        const drawn = drawCard(newState);
        set({ gameState: drawn });
      }, 500);
    }
  },

  handleDrawnCardClick: (cardName) => set({ selectedDrawnCard: cardName }),

  handleConfirmDrawnCard: () => {
    const { gameState, selectedDrawnCard } = get();
    if (!gameState || !selectedDrawnCard) return;
    const newState = chooseDrawnCard(gameState, selectedDrawnCard);
    set({ gameState: newState, selectedDrawnCard: null });
  },

  handleConfirmTurn: () => {
    const { gameState } = get();
    if (!gameState) return;
    const newState = advanceToNextTurn(gameState);
    set({ gameState: newState, waitingForNextTurn: false });
  },

  executeAITurn: () => {
    const { gameState } = get();
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.type === 'human') return;
    const newState = takeAITurn(gameState, makeChancellorChoice);
    set({ gameState: newState });
  },

  canPlayCard: () => {
    const { selectedCard, targetPlayerId, guardGuess } = get();
    if (!selectedCard) return false;
    if (['Guard', 'Priest', 'Baron', 'Prince', 'King'].includes(selectedCard)) {
      if (targetPlayerId === null) return false;
    }
    if (selectedCard === 'Guard' && !guardGuess) return false;
    return true;
  },

  getCurrentPlayer: () => {
    const { gameState } = get();
    if (!gameState) return null;
    return gameState.players[gameState.currentPlayerIndex];
  },

  getValidTargetsForSelectedCard: () => {
    const { gameState, selectedCard } = get();
    if (!gameState || !selectedCard) return [];
    return getValidTargets(gameState, selectedCard);
  },

  getValidGuessesList: () => getValidGuesses(),
}));