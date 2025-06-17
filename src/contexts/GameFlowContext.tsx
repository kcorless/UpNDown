import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameMode } from '../types/gameTypes';

// Add GamePhase type if it's not already in gameTypes.ts
export type GamePhase = 'menu' | 'setup' | 'lobby' | 'playing';

interface GameFlowState {
  phase: GamePhase;
  gameMode: GameMode | null;
  setupData: {
    playerUuid: string;
    playerName: string;
    gameId?: string;
  } | null;
}

type GameFlowAction = 
  | { type: 'SELECT_GAME_MODE'; payload: GameMode }
  | { type: 'START_SETUP'; payload: { playerUuid: string; playerName: string } }
  | { type: 'CANCEL_SETUP' }
  | { type: 'JOIN_LOBBY'; payload: { gameId: string } }
  | { type: 'START_GAME' }
  | { type: 'RESET' };

const initialState: GameFlowState = {
  phase: 'menu',
  gameMode: null,
  setupData: null
};

const gameFlowReducer = (state: GameFlowState, action: GameFlowAction): GameFlowState => {
  switch (action.type) {
    case 'SELECT_GAME_MODE':
      return {
        ...state,
        gameMode: action.payload,
        phase: action.payload === 'solitaire' ? 'playing' : 'setup'
      };
    case 'START_SETUP':
      return {
        ...state,
        phase: 'setup',
        setupData: {
          playerUuid: action.payload.playerUuid,
          playerName: action.payload.playerName
        }
      };
    case 'CANCEL_SETUP':
      return {
        ...state,
        phase: 'menu',
        setupData: null
      };
    case 'JOIN_LOBBY':
      return {
        ...state,
        phase: 'lobby',
        setupData: state.setupData ? {
          ...state.setupData,
          gameId: action.payload.gameId
        } : null
      };
    case 'START_GAME':
      return {
        ...state,
        phase: 'playing'
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const GameFlowContext = createContext<{
  state: GameFlowState;
  dispatch: React.Dispatch<GameFlowAction>;
}>({
  state: initialState,
  dispatch: () => null
});

interface GameFlowProviderProps {
  children: ReactNode;
}

export const GameFlowProvider = ({ children }: GameFlowProviderProps) => {
  const [state, dispatch] = useReducer(gameFlowReducer, initialState);
  return (
    <GameFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </GameFlowContext.Provider>
  );
};

export const useGameFlow = () => {
  const context = useContext(GameFlowContext);
  if (!context) {
    throw new Error('useGameFlow must be used within GameFlowProvider');
  }
  return context;
};