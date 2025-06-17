import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { MultiplayerContextType, MultiplayerState, MultiplayerAction } from '../types/context';

const initialState: MultiplayerState = {
  isHost: false,
  connectedPlayers: [],
  gameId: null,
  currentPlayerUuid: null,
  isConnecting: false,
  error: null,
};

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

function multiplayerReducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'CREATE_GAME':
      return {
        ...state,
        isHost: true,
        gameId: action.payload.gameId,
        currentPlayerUuid: action.payload.hostUuid,
        connectedPlayers: [{
          uuid: action.payload.hostUuid,
          name: action.payload.hostName,
          isHost: true,
          cardCount: 0,
          joinedAt: Date.now(),
          hand: [],
          stats: {
            totalCardsPlayed: 0,
            specialPlaysCount: 0,
            totalMovement: 0
          }
        }],
        error: null,
      };

    case 'PLAYER_CONNECTED':
      // Only add new players, ignore reconnections
      if (state.connectedPlayers.some(player => player.uuid === action.payload.playerUuid)) {
        return state;
      }
      return {
        ...state,
        gameId: action.payload.gameId || state.gameId,
        currentPlayerUuid: action.payload.playerUuid,
        connectedPlayers: [...state.connectedPlayers, {
          uuid: action.payload.playerUuid,
          name: action.payload.playerName,
          isHost: action.payload.isHost || false,
          cardCount: 0,
          joinedAt: Date.now(),
          hand: [],
          stats: {
            totalCardsPlayed: 0,
            specialPlaysCount: 0,
            totalMovement: 0
          }
        }],
      };

    case 'PLAYER_DISCONNECTED':
      return {
        ...state,
        connectedPlayers: state.connectedPlayers.filter(
          player => player.uuid !== action.payload.playerUuid
        ),
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isConnecting: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'RESET':
      return {
        ...initialState,
        currentPlayerUuid: null,
      };

    default:
      return state;
  }
}

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  return (
    <MultiplayerContext.Provider value={{ state, dispatch, multiplayerDispatch: dispatch }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer(): MultiplayerContextType {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
}