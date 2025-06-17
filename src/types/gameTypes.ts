// File: src/types/gameTypes.ts
// Keep all existing constants unchanged through LIKE_ICONS

export const PILE_TYPES = {
  UP: 'UP',
  DOWN: 'DOWN',
} as const;

// System-level deck constants (only used for initial settings)
export const DECK = {
  MINDEFAULT: 1,
  MAXDEFAULT: 100
} as const;

// System-level draw pile constants (only used for initial settings)
export const DRAWPILE = {
  MINDEFAULT: DECK.MINDEFAULT + 1,    // 2
  MAXDEFAULT: DECK.MAXDEFAULT - 1,    // 99
} as const;

// User-level deck constants (used throughout the game)
export const userDECK = {
  MIN: 'cardMin',     // key for localStorage
  MAX: 'cardMax'      // key for localStorage
} as const;

// User-level draw pile constants (used throughout the game)
export const userDRAWPILE = {
  MIN: 'drawPileMin', // key for localStorage
  MAX: 'drawPileMax'  // key for localStorage
} as const;



// Hand sizes
export const SOLITAIRE_HAND_SIZE = 10;
export const TWO_PLAYER_HAND_SIZE = 7;
export const MULTIPLAYER_HAND_SIZE = 6;



// UI Constants
export const COLORS = {
  ASCENDING_PILE: 'rgb(200, 240, 200)',  // Light green
  DESCENDING_PILE: 'rgb(255, 200, 200)',  // Light pink
  INSET_GRADIENT_START: '#d0d4d8',
  INSET_GRADIENT_END: '#a8b0b8',
} as const;

// Basic Types
export type PileType = typeof PILE_TYPES[keyof typeof PILE_TYPES];
export type GameMode = 'solitaire' | 'multiplayer';
export type LobbyStatus = 'waiting' | 'starting' | 'in_progress' | 'error';
export type GamePhase = 'menu' | 'setup' | 'lobby' | 'playing';
export type LikeState = 'none' | 'like' | 'reallyLike' | 'love';

// Game Interfaces
export interface Card {
  id: string;
  value: number;
}

export interface PlayerStats {
  totalCardsPlayed: number;
  specialPlaysCount: number;
  totalMovement: number;
}

export interface Player {
  uuid: string;
  name: string;
  hand: Card[];
  cardCount: number;
  isHost: boolean;
  isReady?: boolean;
  joinedAt: number;
  stats: PlayerStats;
}

export type PlayerRecord = Record<string, Player>;

export interface Pile {
  id: string;
  type: PileType;
  cards: Card[];
  startValue: number;
  currentValue: number;
  label: string;
  likeStates: {
    top: LikeState[];      // For players 1-3
    bottom: LikeState[];   // For players 4-6
  };
}

export interface LastMove {
  cardPlayed: Card;
  playerUuid: string;
  pileId: string;
  drawnCard?: Card | null;
  endTurnDrawnCards?: Card[];
}


export interface GameState {
  gameId: string;
  gameMode: GameMode;
  players: PlayerRecord;
  currentPlayerUuid: string;
  foundationPiles: Pile[];
  drawPile: Card[];
  cardsPlayedThisTurn: number;
  minCardsPerTurn: number;
  turnEnded: boolean;
  gameOver: boolean;
  gameWon: boolean;
  lastUpdate: number;
  lastMove?: LastMove | null;
  status?: LobbyStatus;
  settings?: {
    cardMin: number;
    cardMax: number;
    drawPileMin: number;
    drawPileMax: number;
    handSizes: {
      solitaire: number;
      twoPlayer: number;
      multiplayer: number;
    };
    refreshCardsOnPlay: boolean;
    undoAllowed: boolean;
  };
}

export interface GameLobby {
  id: string;
  host: string;
  players: PlayerRecord;
  status: LobbyStatus;
  maxPlayers: number;
  createdAt: number;
  currentPlayerUuid?: string;  // Changed from currentPlayer
  foundationPiles?: Pile[];
  settings: {
    cardMin: number;
    cardMax: number;
    drawPileMin: number;
    drawPileMax: number;
    handSizes: {
      solitaire: number;
      twoPlayer: number;
      multiplayer: number;
    };
    refreshCardsOnPlay: boolean;
    undoAllowed: boolean;
  };
  cardsPlayedThisTurn?: number;
  drawPile?: Card[];
  gameOver?: boolean;
  gameWon?: boolean;
  turnEnded?: boolean;
  lastUpdate?: number;
  gameMode?: GameMode;
  minCardsPerTurn?: number;
  lastMove?: LastMove | null;
}

export type GameLobbyUpdate = Partial<GameLobby>;



// Constants for Like states
export const DEFAULT_LIKE_STATES: LikeState[] = ['none', 'none', 'none'];

export const LIKE_ICONS = {
  none: '',
  like: '👍',
  reallyLike: '♡',
  love: '💗'
} as const;

