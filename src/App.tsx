import { useGameState } from './hooks/useGameState';
import { SolitaireGame } from './components/game/SolitaireGame';
import { MultiplayerGame } from './components/game/MultiplayerGame';
import { GameMenu } from './components/game/GameMenu';
import { GameLobby } from './components/GameLobby';
import { useMultiplayer } from './contexts/MultiplayerContext';
import { useGameStateContext } from './contexts/GameStateContext';
import './App.css';
import { createLobby, getLobbyData, joinLobby } from './services/lobbyService';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type GameStorage, getGameStorage, storeGameStorage } from './utils/gameStorage';
import { defaultSettings } from './contexts/SettingsContext';
import { 
  type GameMode,
  type Player,
  type PlayerRecord,
  userDECK,
  userDRAWPILE 
} from './types/gameTypes';

function App() {
  const { gameState } = useGameState();
  const { dispatch: multiplayerDispatch } = useMultiplayer();
  const { dispatch: gameDispatch } = useGameStateContext();

  // Initialize game storage (replaces usePlayerId)
    // Initialize game storage (replaces usePlayerId)
    const [gameStorage, setGameStorage] = useState<GameStorage>(() => {
      const stored = getGameStorage();
      console.log('Initial game storage:', { stored });
      
      if (stored && stored.playerUuid) {
        console.log('Using existing game storage with settings:', stored.settings);
        return stored;
      }
      
      // Create new storage if none exists
      const newStorage = {
        playerUuid: uuidv4(),
        settings: defaultSettings
      };
      console.log('Creating new game storage with default settings:', newStorage);
      storeGameStorage(newStorage);
      return newStorage;
    });

  // Use destructured values instead of separate hooks
  const { playerUuid, settings } = gameStorage;

  const handleStartGame = async (
    gameMode: GameMode, 
    gameId?: string,
    gameSettings?: { 
      cardMin: number; 
      cardMax: number;
      drawPileMin: number;
      drawPileMax: number;
    }
  ) => {
    try {
      // Update settings if provided
      if (gameSettings && gameSettings !== settings) {
        const newStorage = {
          ...gameStorage,
          settings: {
            ...settings,  // Keep existing settings
            [userDECK.MIN]: gameSettings.cardMin,
            [userDECK.MAX]: gameSettings.cardMax,
            [userDRAWPILE.MIN]: gameSettings.drawPileMin,
            [userDRAWPILE.MAX]: gameSettings.drawPileMax,
          }
        };
        setGameStorage(newStorage);
        storeGameStorage(newStorage);
      }

      if (gameMode === 'multiplayer') {
        if (gameId) {
          const newGameId = gameId.trim().toUpperCase();
          const lobby = await getLobbyData(newGameId);
          
          if (!lobby) {
            throw new Error('Game not found');
          }

          const playerCount = Object.keys(lobby.players).length;
          const playerName = `Player ${playerCount + 1}`;
          await joinLobby(newGameId, playerUuid, playerName);

          multiplayerDispatch({
            type: 'PLAYER_CONNECTED',
            payload: {
              gameId: newGameId,
              playerUuid,
              playerName,
              isHost: false
            }
          });

          const existingPlayers = Object.entries(lobby.players).map(([uuid, player]) => ({
            uuid,
            name: player.name,
            isHost: player.isHost,
            cardCount: player.cardCount || 0,
            joinedAt: player.joinedAt || Date.now(),
            hand: player.hand || [],
            stats: player.stats || {
              totalCardsPlayed: 0,
              specialPlaysCount: 0,
              totalMovement: 0
            }
          }));

          // Convert existing players array to PlayerRecord object
          const existingPlayersRecord = existingPlayers.reduce((acc, player) => {
            acc[player.uuid] = player;
            return acc;
          }, {} as PlayerRecord);

          // Create new player object
          const newPlayer: Player = {
            uuid: playerUuid,
            name: playerName,
            isHost: false,
            cardCount: 0,
            joinedAt: Date.now(),
            hand: [],
            stats: {
              totalCardsPlayed: 0,
              specialPlaysCount: 0,
              totalMovement: 0
            }
          };

          gameDispatch({
            type: 'START_GAME',
            payload: {
              gameId: newGameId,
              gameMode: 'multiplayer',
              status: 'waiting',
              players: {
                ...existingPlayersRecord,
                [playerUuid]: newPlayer
              },
              currentPlayerUuid: playerUuid,
              foundationPiles: [],
              drawPile: [],
              cardsPlayedThisTurn: 0,
              minCardsPerTurn: 2,
              turnEnded: false,
              gameOver: false,
              gameWon: false,
              lastUpdate: Date.now()
            }
          });
        } else {
          // Use current settings from gameStorage
          const newGameId = await createLobby(playerUuid, 'Player 1', settings);
          
          multiplayerDispatch({
            type: 'PLAYER_CONNECTED',
            payload: {
              gameId: newGameId,
              playerUuid,
              playerName: 'Player 1',
              isHost: true
            }
          });

          gameDispatch({
            type: 'START_GAME',
            payload: {
              gameId: newGameId,
              gameMode: 'multiplayer',
              status: 'waiting',
              players: {
                [playerUuid]: {
                  uuid: playerUuid,
                  name: 'Player 1',
                  isHost: true,
                  cardCount: 0,
                  joinedAt: Date.now(),
                  hand: [],
                  stats: {
                    totalCardsPlayed: 0,
                    specialPlaysCount: 0,
                    totalMovement: 0
                  }
                }
              },
              currentPlayerUuid: playerUuid,
              foundationPiles: [],
              drawPile: [],
              cardsPlayedThisTurn: 0,
              minCardsPerTurn: 2,
              turnEnded: false,
              gameOver: false,
              gameWon: false,
              lastUpdate: Date.now()
            }
          });
        }
      } else {
        // Initialize solitaire game state
                // Initialize solitaire game state
                const initialPlayer = {
                  uuid: playerUuid,
                  name: 'Player 1',
                  isHost: true,
                  cardCount: 0,
                  joinedAt: Date.now(),
                  hand: [],
                  stats: {
                    totalCardsPlayed: 0,
                    specialPlaysCount: 0,
                    totalMovement: 0
                  }
                };
        
                gameDispatch({
                  type: 'START_GAME',
                  payload: {
                    gameId: '',
                    gameMode: 'solitaire',
                    players: {
                      [playerUuid]: initialPlayer
                    },
                    currentPlayerUuid: playerUuid,
                    foundationPiles: [],
                    drawPile: [],
                    cardsPlayedThisTurn: 0,
                    minCardsPerTurn: 2,
                    turnEnded: false,
                    gameOver: false,
                    gameWon: false,
                    lastUpdate: Date.now()
                  }
                });
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  const renderGameComponent = () => {
    if (!gameState) {
      return <GameMenu onStartGame={handleStartGame} />;
    }

    if (gameState.gameMode === 'solitaire') {
      return <SolitaireGame />;
    }

    if (gameState.gameMode === 'multiplayer') {
      if (gameState.status === 'starting' || gameState.status === 'in_progress') {
        return <MultiplayerGame />;
      }
      return <GameLobby />;
    }
  };

  return (
    <div className="App">
      {renderGameComponent()}
    </div>
  );
}

export default App;