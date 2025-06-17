import { useState, useEffect } from 'react';
import { type GameState } from '../types/gameTypes.ts';
import { SESSION_KEYS } from '../utils/constants';
import { subscribeToGameStateChanges } from '../utils/gameStateManager';
import { getPlayerId } from '../utils/playerUtils';

type GameMode = 'setup' | 'solitaire' | 'multiplayer';

interface GameSession {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  gameState: GameState | null;
  setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  currentGameId: string | null;
  setCurrentGameId: (id: string | null) => void;
}

export function useGameSession(): GameSession {
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const savedMode = localStorage.getItem(SESSION_KEYS.GAME_MODE);
    return (savedMode as GameMode) || 'setup';
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  
  const [playerId] = useState(() => {
    const savedId = localStorage.getItem(SESSION_KEYS.PLAYER_ID);
    if (savedId) return savedId;
    const newId = getPlayerId();
    localStorage.setItem(SESSION_KEYS.PLAYER_ID, newId);
    return newId;
  });

  const [currentGameId, setCurrentGameId] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_KEYS.GAME_ID);
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    const savedName = localStorage.getItem(SESSION_KEYS.PLAYER_NAME);
    return savedName || `Player ${Math.floor(Math.random() * 1000)}`;
  });

  // Persist session data
  useEffect(() => {
    if (gameMode === 'setup') {
      localStorage.removeItem(SESSION_KEYS.GAME_MODE);
      localStorage.removeItem(SESSION_KEYS.GAME_ID);
    } else {
      localStorage.setItem(SESSION_KEYS.GAME_MODE, gameMode);
    }
  }, [gameMode]);

  useEffect(() => {
    if (currentGameId) {
      localStorage.setItem(SESSION_KEYS.GAME_ID, currentGameId);
    } else {
      localStorage.removeItem(SESSION_KEYS.GAME_ID);
    }
  }, [currentGameId]);

  useEffect(() => {
    localStorage.setItem(SESSION_KEYS.PLAYER_NAME, playerName);
  }, [playerName]);

  // Subscribe to multiplayer game updates
  useEffect(() => {
    if (gameMode === 'multiplayer' && currentGameId) {
      console.log('Setting up multiplayer subscription:', { currentGameId, playerId });
      const unsubscribe = subscribeToGameStateChanges(currentGameId, (newState) => {
        if (newState) {
          setGameState(newState);
        }
      });
      return () => {
        console.log('Cleaning up multiplayer subscription');
        unsubscribe();
      };
    }
  }, [gameMode, currentGameId, playerId]);

  return {
    gameMode,
    setGameMode,
    gameState,
    setGameState,
    playerId,
    playerName,
    setPlayerName,
    currentGameId,
    setCurrentGameId,
  };
}
