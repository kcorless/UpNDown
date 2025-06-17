import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { type Card } from '../types/gameTypes';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

interface UIState {
  selectedCard: Card | null;
  isCardDragging: boolean;
  showGameMenu: boolean;
  showSettings: boolean;
  notifications: Notification[];
}

type UIAction =
  | { type: 'SELECT_CARD'; payload: Card | null }
  | { type: 'SET_CARD_DRAGGING'; payload: boolean }
  | { type: 'TOGGLE_GAME_MENU' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

// Define UIContextType inline instead of importing
interface UIContextType {
  state: UIState;
  dispatch: Dispatch<UIAction>;
}

const initialState: UIState = {
  selectedCard: null,
  isCardDragging: false,
  showGameMenu: false,
  showSettings: false,
  notifications: [],
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SELECT_CARD':
      return {
        ...state,
        selectedCard: action.payload,
      };
    case 'SET_CARD_DRAGGING':
      return {
        ...state,
        isCardDragging: action.payload,
      };
    case 'TOGGLE_GAME_MENU':
      return {
        ...state,
        showGameMenu: !state.showGameMenu,
      };
    case 'TOGGLE_SETTINGS':
      return {
        ...state,
        showSettings: !state.showSettings,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now().toString(),
            ...action.payload,
          },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    default:
      return state;
  }
}

// Create context with proper type definition
const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextType {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}