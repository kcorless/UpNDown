import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { type GameState, type Player } from '../types/shared';
import { GameStateManager } from '../utils/gameStateManager';

export class FirebaseGameStateManager extends GameStateManager {
  private gameStateListeners: { [key: string]: () => void } = {};

  async createGame(hostId: string, hostName: string): Promise<string> {
    const gameId = `game-${Date.now()}`;
    const initialState = this.createInitialGameState(gameId, hostId, hostName, 'multiplayer');
    await set(ref(database, `games/${gameId}`), initialState);
    return gameId;
  }

  async joinGame(gameId: string, playerId: string, playerName: string): Promise<boolean> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      return false;
    }

    const gameState: GameState = snapshot.val();
    const updatedPlayers = [
      ...gameState.players,
      {
        id: playerId,
        name: playerName,
        hand: [],
        cardCount: 0,
        isHost: false,
        joinedAt: Date.now()
      }
    ];

    await set(gameRef, {
      ...gameState,
      players: updatedPlayers,
      lastUpdate: Date.now()
    });

    return true;
  }

  async leaveGame(gameId: string, playerId: string): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const gameState: GameState = snapshot.val();
    const updatedPlayers = gameState.players.filter(player => player.id !== playerId);

    if (updatedPlayers.length === 0) {
      await set(gameRef, null);
    } else {
      await set(gameRef, {
        ...gameState,
        players: updatedPlayers,
        lastUpdate: Date.now()
      });
    }
  }

  async getGameState(gameId: string): Promise<GameState | null> {
    const snapshot = await get(ref(database, `games/${gameId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async updateGameState(gameId: string, state: GameState): Promise<void> {
    await set(ref(database, `games/${gameId}`), {
      ...state,
      lastUpdate: Date.now()
    });
  }

  async saveState(state: GameState): Promise<void> {
    if (!state.gameId) {
      console.log('No gameId, skipping Firebase save');
      return;
    }
    
    const gameRef = ref(database, `games/${state.gameId}`);
    await set(gameRef, state);
  }

  async loadState(gameId: string): Promise<GameState | null> {
    const snapshot = await get(ref(database, `games/${gameId}`));
    return snapshot.exists() ? snapshot.val() : null;
  }

  subscribeToChanges(gameId: string, callback: (state: GameState | null) => void): () => void {
    const gameRef = ref(database, `games/${gameId}`);
    const listener = onValue(gameRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    this.gameStateListeners[gameId] = () => off(gameRef, 'value', listener);
    return () => {
      if (this.gameStateListeners[gameId]) {
        this.gameStateListeners[gameId]();
        delete this.gameStateListeners[gameId];
      }
    };
  }

  async setPlayer(gameId: string, playerId: string): Promise<void> {
    const gameRef = ref(database, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      return;
    }

    const gameState: GameState = snapshot.val();
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
      await set(gameRef, {
        ...gameState,
        currentPlayer: playerIndex,
        lastUpdate: Date.now()
      });
    }
  }

  protected createInitialGameState(
    gameId: string,
    hostId: string,
    hostName: string,
    gameMode: 'solitaire' | 'multiplayer'
  ): GameState {
    const player: Player = {
      id: hostId,
      name: hostName,
      hand: [],
      cardCount: 0,
      isHost: true,
      joinedAt: Date.now()
    };

    return {
      gameId,
      gameMode,
      players: [player],
      currentPlayer: 0,
      foundationPiles: [
        {
          id: 'pile1',
          type: 'UP',
          cards: [],
          startValue: 1,
          label: 'Ascending 1'
        },
        {
          id: 'pile2',
          type: 'UP',
          cards: [],
          startValue: 1,
          label: 'Ascending 2'
        },
        {
          id: 'pile3',
          type: 'DOWN',
          cards: [],
          startValue: 100,
          label: 'Descending 1'
        },
        {
          id: 'pile4',
          type: 'DOWN',
          cards: [],
          startValue: 100,
          label: 'Descending 2'
        }
      ],
      drawPile: [],
      cardsPlayedThisTurn: 0,
      minCardsPerTurn: 2,
      turnEnded: false,
      gameOver: false,
      lastUpdate: Date.now()
    };
  }
}
