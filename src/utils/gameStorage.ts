import { type GameSettings } from '../contexts/SettingsContext';

const ACTIVE_GAME_KEY = 'upNDown_activeGame';
const GAME_STORAGE_KEY = 'upNDown';

interface ActiveGameInfo {
  gameId: string;
  playerUuid: string;
  playerName: string;
  isHost: boolean;
}

export interface GameStorage {
  playerUuid: string;
  settings: GameSettings;
}

export const storeActiveGame = (gameInfo: ActiveGameInfo) => {
  localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(gameInfo));
};

export const getActiveGame = (): ActiveGameInfo | null => {
  const stored = localStorage.getItem(ACTIVE_GAME_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const clearActiveGame = () => {
  localStorage.removeItem(ACTIVE_GAME_KEY);
};

export const getGameStorage = (): GameStorage | null => {
  const stored = localStorage.getItem(GAME_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const storeGameStorage = (storage: GameStorage) => {
  localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(storage));
};
