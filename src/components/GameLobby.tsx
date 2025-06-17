import { type FC, useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { useGameStateContext } from '../contexts/GameStateContext';
import { type GameLobby as GameLobbyType, type Player, type PlayerRecord } from '../types/gameTypes';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { startGame, prepareGameStart } from '../services/lobbyService';
import { GameSettings as GameSettingsComponent } from './settings/GameSettings';
import { useSettings, type GameSettings } from '../contexts/SettingsContext';
import './GameLobby.css';

export const GameLobby: FC = () => {
  const { dispatch: uiDispatch } = useUI();
  const { state: multiplayerState } = useMultiplayer();
  const { dispatch: gameDispatch } = useGameStateContext();
  const [lobby, setLobby] = useState<GameLobbyType | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const { settings, saveSettingsToStorage, updateSettings } = useSettings();

  // Basic props derived from state
  const currentPlayerUuid = multiplayerState?.connectedPlayers[0]?.uuid;
  const isHost = lobby?.host === currentPlayerUuid;

  // Subscribe to lobby updates
  useEffect(() => {
    if (!multiplayerState?.gameId) return;

    const lobbyRef = ref(database, `lobbies/${multiplayerState.gameId}`);
    const unsubscribe = onValue(lobbyRef, (snapshot) => {
      const lobbyData = snapshot.val();
      if (!lobbyData) return;

      setLobby(lobbyData);

      // If game is starting/in progress, update game state
      if (lobbyData.status === 'starting' || lobbyData.status === 'in_progress') {
        // Convert players to PlayerRecord object
        const playersRecord = Object.entries(lobbyData.players as Record<string, Player>).reduce((acc, [uuid, player]) => {
          acc[uuid] = {
            uuid,
            name: player.name,
            hand: player.hand || [],
            cardCount: player.cardCount || 0,
            isHost: player.isHost || false,
            isReady: player.isReady || false,
            joinedAt: player.joinedAt || Date.now(),
            stats: player.stats || {
              totalCardsPlayed: 0,
              specialPlaysCount: 0,
              totalMovement: 0
            }
          };
          return acc;
        }, {} as PlayerRecord);

        gameDispatch({
          type: 'UPDATE_GAME_STATE',
          payload: {
            gameId: lobbyData.id,
            gameMode: 'multiplayer',
            status: lobbyData.status,
            players: playersRecord,
            foundationPiles: lobbyData.foundationPiles,
            drawPile: lobbyData.drawPile || [],
            cardsPlayedThisTurn: lobbyData.cardsPlayedThisTurn || 0,
            currentPlayerUuid: lobbyData.currentPlayerUuid || currentPlayerUuid,
            lastUpdate: Date.now(),
            gameOver: false,
            gameWon: false,
            turnEnded: false,
            minCardsPerTurn: 2
          }
        });
      }
    });

    return () => {
      console.log('Cleaning up lobby subscription');
      unsubscribe();
    };
  }, [multiplayerState?.gameId, gameDispatch, currentPlayerUuid]);

  const handleStartGame = async () => {
    if (!lobby) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'No active lobby',
          type: 'error',
          duration: 3000
        }
      });
      return;
    }

    if (Object.keys(lobby.players).length < 2) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Need at least 2 players to start',
          type: 'error',
          duration: 3000
        }
      });
      return;
    }

    if (!isHost) {
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Only the host can start the game',
          type: 'error',
          duration: 3000
        }
      });
      return;
    }

    try {
      setIsStartingGame(true);
      const gameState = await prepareGameStart(lobby.id);
      await startGame(lobby.id, gameState);
    } catch (error) {
      console.error('Failed to start game:', error);
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Failed to start game',
          type: 'error',
          duration: 3000
        }
      });
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleSaveSettings = async (newSettings: GameSettings) => {
    try {
      // First update React state
      updateSettings(newSettings);
      
      // Then save to localStorage for persistence
      saveSettingsToStorage(newSettings);
      
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      uiDispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          message: 'Failed to save settings',
          type: 'error',
          duration: 3000
        }
      });
    }
  };

  if (!lobby) {
    return <div>Loading lobby...</div>;
  }

  const playersList = Object.entries(lobby.players)
    .map(([uuid, player]) => ({
      uuid,
      name: player.name,
      hand: player.hand || [],
      cardCount: player.cardCount || 0,
      isHost: player.isHost || false,
      isReady: player.isReady || false,
      joinedAt: player.joinedAt || Date.now(),
      stats: player.stats || {
        totalCardsPlayed: 0,
        specialPlaysCount: 0,
        totalMovement: 0
      }
    }))
    .sort((a, b) => (a.joinedAt - b.joinedAt));

  return (
    <div className="game-lobby">
      <h2>Game Lobby</h2>
      
      <button 
        className="settings-button"
        onClick={() => setShowSettings(true)}
      >
        View Settings
      </button>

      <div className="lobby-code">
        <h3>Game Code</h3>
        <p className="code">{lobby.id}</p>
        <p className="share-message">Share this code with other players to join</p>
      </div>

      <div className="lobby-info">
        <p>Host: {playersList.find(p => p.uuid === lobby.host)?.name}</p>
        <p>Players ({playersList.length}/{lobby.maxPlayers}):</p>
        <ul className="player-list">
          {playersList.map((player) => (
            <li 
              key={player.uuid} 
              className={`
                ${player.uuid === lobby.host ? 'host' : ''}
                ${player.uuid === currentPlayerUuid ? 'current-player' : ''}
              `.trim()}
            >
              {player.name}
              {player.uuid === currentPlayerUuid && ' (You)'}
            </li>
          ))}
        </ul>
      </div>

      {isHost && (
        <button 
          className="start-game-button"
          onClick={handleStartGame}
          disabled={isStartingGame || Object.keys(lobby.players).length < 2}
        >
          {isStartingGame ? 'Starting Game...' : 'Start Game'}
        </button>
      )}

      {showSettings && (
        <GameSettingsComponent
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          isHost={isHost}
          currentSettings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}
    </div>
  );
};