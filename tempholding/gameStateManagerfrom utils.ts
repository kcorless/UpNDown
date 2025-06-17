import { type GameState, type Player, type Pile, PILE_TYPES } from '../types/shared';
import { database } from '../config/firebase';
import { ref, onValue, off, set } from 'firebase/database';

export abstract class GameStateManager {
  abstract createGame(hostId: string, hostName: string): Promise<string>;
  abstract joinGame(gameId: string, playerId: string, playerName: string): Promise<boolean>;
  abstract leaveGame(gameId: string, playerId: string): Promise<void>;
  abstract getGameState(gameId: string): Promise<GameState | null>;
  abstract updateGameState(gameId: string, state: GameState): Promise<void>;
  abstract saveState(state: GameState): Promise<void>;
  abstract loadState(gameId: string): Promise<GameState | null>;
  abstract subscribeToChanges(gameId: string, callback: (state: GameState | null) => void): () => void;
  abstract setPlayer(gameId: string, playerId: string): Promise<void>;

  protected createInitialGameState(
    gameId: string,
    hostId: string,
    hostName: string,
    gameMode: 'solitaire' | 'multiplayer'
  ): GameState {
    const players: Player[] = [{
      id: hostId,
      name: hostName,
      hand: [],
      cardCount: 0,
      isHost: true,
      joinedAt: Date.now()
    }];

    const foundationPiles: Pile[] = [
      {
        id: 'pile-1',
        type: PILE_TYPES.UP,
        cards: [],
        startValue: 1,
        label: '1↑'
      },
      {
        id: 'pile-2',
        type: PILE_TYPES.DOWN,
        cards: [],
        startValue: 100,
        label: '100↓'
      },
      {
        id: 'pile-3',
        type: PILE_TYPES.UP,
        cards: [],
        startValue: 1,
        label: '1↑'
      },
      {
        id: 'pile-4',
        type: PILE_TYPES.DOWN,
        cards: [],
        startValue: 100,
        label: '100↓'
      }
    ];

    return {
      gameId,
      gameMode,
      players,
      currentPlayer: 0,
      foundationPiles,
      drawPile: [],
      cardsPlayedThisTurn: 0,
      minCardsPerTurn: gameMode === 'multiplayer' ? 2 : 1,
      lastUpdate: Date.now(),
      gameOver: false,
      turnEnded: false
    };
  }
}

export function saveGameState(state: GameState) {
    if (!state.gameId) {
        console.log('No gameId, skipping Firebase save');
        return;
    }
    
    // Only save to Firebase for multiplayer games
    const gameRef = ref(database, `games/${state.gameId}`);
    set(gameRef, state).catch(error => {
        console.error('Error saving game state to Firebase:', error);
    });
}

export function loadGameState(): GameState | null {
    return null;
}

export function clearGameState() {
    console.log('Clearing game state');
    // Nothing to clear from localStorage since we don't store game state there anymore
}

export function subscribeToGameStateChanges(gameId: string, callback: (state: GameState | null) => void) {
    console.log('Setting up game state subscription for:', gameId);
    const gameRef = ref(database, `games/${gameId}`);
    
    const unsubscribe = onValue(gameRef, (snapshot) => {
        const state = snapshot.val();
        console.log('Game state update:', state);
        callback(state);
    }, (error) => {
        console.error('Error subscribing to game state:', error);
        callback(null);
    });

    return () => {
        console.log('Unsubscribing from game state');
        off(gameRef);
        unsubscribe();
    };
}

export function isPlayerTurn(gameState: GameState, playerId: string): boolean {
  if (!gameState || !gameState.players) return false;
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  return playerIndex === gameState.currentPlayer;
}

export function initializeGameState(gameId: string, players: Array<{id: string, name: string}>, initialState: Partial<GameState>): GameState {
  console.log('Initializing game state:', { gameId, players, initialState });
  const state: GameState = {
    gameId,
    gameMode: 'multiplayer',
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      hand: [],
      cardCount: 0,
      isHost: false,
      joinedAt: Date.now()
    })),
    currentPlayer: 0,
    foundationPiles: [
      {
        id: 'pile-1',
        type: PILE_TYPES.UP,
        cards: [],
        startValue: 1,
        label: '1↑'
      },
      {
        id: 'pile-2',
        type: PILE_TYPES.DOWN,
        cards: [],
        startValue: 100,
        label: '100↓'
      },
      {
        id: 'pile-3',
        type: PILE_TYPES.UP,
        cards: [],
        startValue: 1,
        label: '1↑'
      },
      {
        id: 'pile-4',
        type: PILE_TYPES.DOWN,
        cards: [],
        startValue: 100,
        label: '100↓'
      }
    ],
    drawPile: [],
    cardsPlayedThisTurn: 0,
    minCardsPerTurn: 2,
    lastUpdate: Date.now(),
    gameOver: false,
    turnEnded: false,
    ...initialState
  };

  saveGameState(state);
  return state;
}

export function generateGameId(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function getCurrentPlayer(): number {
  const urlParams = new URLSearchParams(window.location.search);
  return parseInt(urlParams.get('player') || '1');
}
