import { type Dispatch } from 'react';
import { type Card, type GameState as BaseGameState , Player} from './gameTypes';

export type GameState = BaseGameState;

// UI Context Types
export type NotificationType = 'error' | 'success' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

export interface UIState {
  selectedCard: Card | null;
  isCardDragging: boolean;
  showGameMenu: boolean;
  showSettings: boolean;
  notifications: Notification[];
}

export type UIAction =
  | { type: 'SELECT_CARD'; payload: Card | null }
  | { type: 'SET_CARD_DRAGGING'; payload: boolean }
  | { type: 'TOGGLE_GAME_MENU' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

export interface UIContextType {
  state: UIState;
  dispatch: Dispatch<UIAction>;
}


export interface MultiplayerState {
  isHost: boolean;
  connectedPlayers: Player[];
  gameId: string | null;
  isConnecting: boolean;
  error: string | null;
  currentPlayerUuid: string | null;
}

export type MultiplayerAction =
  | { type: 'CREATE_GAME'; payload: { gameId: string; hostUuid: string; hostName: string } }
  | { type: 'PLAYER_CONNECTED'; payload: { gameId: string; playerUuid: string; playerName: string; isHost?: boolean } }
  | { type: 'PLAYER_DISCONNECTED'; payload: { playerUuid: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export interface MultiplayerContextType {
  state: MultiplayerState;
  dispatch: Dispatch<MultiplayerAction>;
  multiplayerDispatch: Dispatch<MultiplayerAction>;
}

// Game State Context Types
export type GameStateAction =
  | { type: 'START_GAME'; payload: { gameMode: 'solitaire' | 'multiplayer'; playerUuid: string; playerName: string } }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState }
  | { type: 'END_GAME' }
  | { type: 'RESET' };

export interface GameStateContextType {
  state: GameState | null;
  dispatch: Dispatch<GameStateAction>;
}
