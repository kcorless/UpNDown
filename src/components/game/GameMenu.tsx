import React, { useState, useRef } from 'react';
import { GameSettings } from '../settings/GameSettings';
import { useSettings } from '../../contexts/SettingsContext';
import { userDECK, userDRAWPILE, type GameMode } from '../../types/gameTypes';
import './GameMenu.css';
import { HowTo } from '../howto/HowTo';
import { getLobbyData } from '../../services/lobbyService';

interface GameMenuProps {
  onStartGame: (gameMode: GameMode, gameId?: string, settings?: any) => Promise<void>;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onStartGame }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [gameId, setGameId] = useState('');
  const { settings, updateSettings } = useSettings();
  const [showHowTo, setShowHowTo] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Ref for the game code input field
  const gameCodeInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveSettings = (newSettings: {
    [userDECK.MIN]: number;
    [userDECK.MAX]: number;
    [userDRAWPILE.MIN]: number;
    [userDRAWPILE.MAX]: number;
    handSizes: {
      solitaire: number;
      twoPlayer: number;
      multiplayer: number;
    };
    refreshCardsOnPlay: boolean;
    undoAllowed: boolean;
  }) => {
    updateSettings(newSettings);
    setShowSettings(false);
  };

  const handleStartSolitaire = async () => {
    try {
      await onStartGame('solitaire');
    } catch (error) {
      console.error('Failed to start solitaire game:', error);
    }
  };

  const handleCreateMultiplayer = async () => {
    try {
      await onStartGame('multiplayer');
    } catch (error) {
      console.error('Failed to create multiplayer game:', error);
    }
  };

  const handleJoinGame = async () => {
    setJoinError(null);
    if (!gameId) {
      setJoinError('Please enter a game ID');
      return;
    }

    try {
      const lobby = await getLobbyData(gameId.trim().toUpperCase());
      if (!lobby) {
        setJoinError('Game not found');
        return;
      }

      if (Object.keys(lobby.players).length >= (lobby.maxPlayers || 6)) {
        setJoinError('Game is full');
        return;
      }

      await onStartGame('multiplayer', gameId);
      setShowJoinInput(false);
      setGameId('');
    } catch (error) {
      console.error('Failed to join game:', error);
      setJoinError('Failed to join game. Please try again.');
    }
  };

  return (
    <div className="game-menu">
      <div className="game-menu-header">
        <h1>Up-N-Down</h1>
        <button
          className="settings-button"
          onClick={() => setShowSettings(true)}
        >
          Settings
        </button>
      </div>

      <div className="menu-buttons">
        <button onClick={handleStartSolitaire}>Start Solitaire Game</button>
        <button onClick={handleCreateMultiplayer}>Create Multiplayer Game</button>
        <button
          onClick={() => {
            setShowJoinInput(true);
            setTimeout(() => gameCodeInputRef.current?.focus(), 0); // Focus on input after state update
          }}
        >
          Join Multiplayer Game
        </button>
      </div>

      {showSettings && (
        <GameSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isHost={true}
          isMainMenu={true}
          currentSettings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {showJoinInput && (
        <div className="join-game-form">
          <input
            type="text"
            ref={gameCodeInputRef} // Attach ref to the input element
            value={gameId}
            onChange={(e) => setGameId(e.target.value.toUpperCase())}
            placeholder="ENTER GAME CODE"
            maxLength={6}
            className="game-code-input"
          />
          {joinError && <div className="join-error-message">{joinError}</div>}
          <div className="join-game-buttons">
            <button
              className="join-button"
              onClick={handleJoinGame}
            >
              Join
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setShowJoinInput(false);
                setGameId('');
                setJoinError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        className="how-to-button"
        onClick={() => setShowHowTo(true)}
      >
        How to Play
      </button>

      {showHowTo && (
        <HowTo
          isOpen={showHowTo}
          onClose={() => setShowHowTo(false)}
        />
      )}
    </div>
  );
};
