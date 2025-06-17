import { type FC, useEffect, useState, useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { CardPile } from '../CardPile';
import { GameStatistics } from '../GameStatistics';
import { calculateGameStatsSummary } from '../../utils/gameStatisticsUtils';
import { resetGame, updateGameInFirebase } from '../../services/lobbyService';
import { 
  DEFAULT_LIKE_STATES,  
  type LikeState     
} from '../../types/gameTypes';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { useGameStateContext } from '../../contexts/GameStateContext';
import { heartPositionToPlayerIndex } from '../../utils/gameUtils';
import { useSettings } from '../../contexts/SettingsContext';
import { clearActiveGame } from '../../utils/gameStorage';
import { Card } from '../card/Card';
import './SolitaireGame.css';

export const MultiplayerGame: FC = () => {
  // Move all hooks to the top, before any conditional returns
  const { gameState, playCard, endTurn, handleUndo } = useGameState();
  const { multiplayerDispatch } = useMultiplayer();
  const { dispatch } = useGameStateContext();
  const { state: multiplayerState } = useMultiplayer();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const { settings } = useSettings();
  
  // Get settings from Firebase game state
  const [gameSettings, setGameSettings] = useState(settings);
  
  // Get the current player's UUID from multiplayerState
  const currentPlayerUuid = useMemo(() => {
    return multiplayerState?.currentPlayerUuid;
  }, [multiplayerState?.currentPlayerUuid]);

  // One-time initialization of settings when game starts
  useEffect(() => {
    if (gameState?.settings && !gameSettings) {
      setGameSettings({
        ...settings,  // Keep any settings not in Firebase
        cardMin: gameState.settings.cardMin,
        cardMax: gameState.settings.cardMax,
        drawPileMin: gameState.settings.drawPileMin,
        drawPileMax: gameState.settings.drawPileMax
      });
    }
  }, []); // Empty dependency array since this should only run once

  // Log settings for debugging
  useEffect(() => {
    console.log('MultiplayerGame settings:', {
      settings: gameSettings,
      currentPlayerUuid,
      multiplayerState,
      gameState
    });
  }, [gameSettings, currentPlayerUuid, multiplayerState, gameState]);

  // Define all memoized values before any conditional returns
  const activePlayer = useMemo(() => {
    if (!gameState?.players || !gameState?.currentPlayerUuid) return null;
    return gameState.players[gameState.currentPlayerUuid];
  }, [gameState?.players, gameState?.currentPlayerUuid]);

  const viewingPlayer = useMemo(() => {
    if (!gameState?.players || !currentPlayerUuid) {
      console.log('Cannot find viewing player:', {
        hasPlayers: !!gameState?.players,
        currentPlayerUuid,
        players: gameState?.players
      });
      return null;
    }
    const player = gameState.players[currentPlayerUuid];
    console.log('Viewing player lookup:', {
      currentPlayerUuid,
      foundPlayer: player,
      allPlayers: gameState.players
    });
    return player;
  }, [gameState?.players, currentPlayerUuid]);

  const playerNumber = useMemo(() => {
    if (!viewingPlayer || !gameState?.players) return -1;
    // Sort players by join time to ensure consistent numbering
    const sortedPlayers = Object.values(gameState.players)
      .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
    return sortedPlayers.findIndex(p => p.uuid === viewingPlayer.uuid);
  }, [gameState?.players, viewingPlayer]);

  const handleLikeStateChange = useMemo(() => {
    const handleLikeStateChange = async (pileId: string, row: 'top' | 'bottom', position: number) => {
      if (!gameState || !viewingPlayer) return;
 
      const playerIndex = heartPositionToPlayerIndex(row, position);
      // Sort players by join time to ensure consistent numbering
      const sortedPlayers = Object.values(gameState.players)
        .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
      const viewingPlayerIndex = sortedPlayers.findIndex(p => p.uuid === viewingPlayer.uuid);
      
      if (playerIndex !== viewingPlayerIndex) {
        return;
      }
 
      const pile = gameState.foundationPiles.find(p => p.id === pileId);
      if (!pile) return;
 
      const currentState = row === 'top' ? 
        pile.likeStates?.top[position] : 
        pile.likeStates?.bottom[position];
 
      const nextState: LikeState = 
        currentState === 'none' ? 'like' :
        currentState === 'like' ? 'reallyLike' :
        currentState === 'reallyLike' ? 'love' :
        'none';
 
      const updatedPiles = gameState.foundationPiles.map(p => {
        if (p.id !== pileId) return p;
 
        const newLikeStates = {
          top: [...(p.likeStates?.top || DEFAULT_LIKE_STATES)],
          bottom: [...(p.likeStates?.bottom || DEFAULT_LIKE_STATES)]
        };
 
        if (row === 'top') {
          newLikeStates.top[position] = nextState;
        } else {
          newLikeStates.bottom[position] = nextState;
        }
 
        return {
          ...p,
          likeStates: newLikeStates
        };
      });
 
      const updatedState = {
        ...gameState,
        foundationPiles: updatedPiles
      };
 
      if (gameState.gameMode === 'multiplayer') {
        await updateGameInFirebase(gameState.gameId, updatedState);
      }
      dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedState });
    };
    return handleLikeStateChange;
  }, [gameState, viewingPlayer, dispatch]);

  // First useEffect for gameId initialization
  useEffect(() => {
    if (multiplayerState?.gameId && gameState && !gameState.gameId) {
      console.log('Initializing gameId in game state:', multiplayerState.gameId);
      dispatch({
        type: 'UPDATE_GAME_STATE',
        payload: {
          ...gameState,
          gameId: multiplayerState.gameId,
          gameMode: 'multiplayer'
        }
      });
    }
  }, [multiplayerState?.gameId, gameState, dispatch]);

  // Early return checks
  if (!gameState || gameState.gameMode !== 'multiplayer') {
    console.log('Game state not ready:', { gameState });
    return <div className="loading">Loading game state...</div>;
  }

  if (!activePlayer || !viewingPlayer) {
    console.log('Players not ready:', { activePlayer, viewingPlayer });
    return <div className="loading">Loading players...</div>;
  }

  // Debug logging after all checks
  console.log('Game state debug:', {
    multiplayerState: {
      connectedPlayers: multiplayerState?.connectedPlayers,
      currentPlayerUuid,
      gameId: multiplayerState?.gameId
    },
    gameState: {
      gameId: gameState.gameId,
      currentPlayerUuid: gameState.currentPlayerUuid,
      players: gameState.players
    }
  });

  const handleCardClick = (index: number) => {
    console.log('Card clicked:', {
      index,
      handSize: viewingPlayer?.hand?.length,
      isPlayerTurn: viewingPlayer?.uuid === activePlayer?.uuid,
      viewingPlayer: {
        uuid: viewingPlayer?.uuid,
        name: viewingPlayer?.name
      },
      activePlayer: {
        uuid: activePlayer?.uuid,
        name: activePlayer?.name
      }
    });
    
    // Validate index is within bounds
    if (index < 0 || index >= (viewingPlayer?.hand?.length || 0)) {
      console.error('Invalid card index:', { index, handSize: viewingPlayer?.hand?.length });
      return;
    }
    
    if (viewingPlayer?.uuid === activePlayer?.uuid) {
      setSelectedCardIndex(index);
    } else {
      console.log('Card click ignored - not player\'s turn');
    }
  };

  const handlePileClick = (pileId: string) => {
    console.log('Pile clicked:', {
      pileId,
      selectedCardIndex,
      isPlayerTurn: viewingPlayer?.uuid === activePlayer?.uuid,
      viewingPlayer: {
        uuid: viewingPlayer?.uuid,
        name: viewingPlayer?.name
      },
      activePlayer: {
        uuid: activePlayer?.uuid,
        name: activePlayer?.name
      }
    });

    if (selectedCardIndex !== null && viewingPlayer?.uuid === activePlayer?.uuid) {
      // Validate that the selected card index is within bounds
      if (selectedCardIndex >= 0 && selectedCardIndex < (viewingPlayer.hand?.length || 0)) {
        console.log('Playing card:', {
          cardIndex: selectedCardIndex,
          pileId,
          handSize: viewingPlayer.hand?.length
        });
        playCard(selectedCardIndex, pileId);
        setSelectedCardIndex(null);
      } else {
        console.log('Invalid card index:', {
          selectedCardIndex,
          handSize: viewingPlayer.hand?.length
        });
      }
    } else {
      console.log('Pile click ignored:', {
        reason: selectedCardIndex === null ? 'No card selected' : 'Not player\'s turn'
      });
    }
  };

  const handleResetGame = async () => {
    if (!gameState?.gameId || !viewingPlayer?.isHost) return;

    const confirmed = window.confirm(
        'Are you sure you want to reset this game? This will end the current game for all players and cannot be undone.'
    );

    if (confirmed) {
        try {
            await resetGame(gameState.gameId);
            clearActiveGame();
            dispatch({ type: 'RESET' });
            multiplayerDispatch({ type: 'RESET' });
        } catch (error) {
            console.error('Failed to reset game:', error);
        }
    }
  };

  const isPlayerTurn = viewingPlayer.uuid === activePlayer.uuid;
  const isDrawPileEmpty = (gameState.drawPile?.length ?? 0) === 0;
  const canEndTurn = (gameState.cardsPlayedThisTurn ?? 0) >= (gameState.minCardsPerTurn ?? 2);

  const renderGameOverContent = () => {
    if (!gameState.gameOver) return null;

    const gameStats = calculateGameStatsSummary(gameState);

    const handleReturnToMenu = () => {
      clearActiveGame();
      dispatch({ type: 'RESET' });
      multiplayerDispatch({ type: 'RESET' });
    };

    return (
      <div className="game-over-overlay">
        <div className={`game-over-message ${gameState.gameWon ? 'win' : 'lose'}`}>
          <h2>{gameState.gameWon ? 'Victory!' : 'Game Over'}</h2>
          <p>
            {gameState.gameWon 
              ? 'Congratulations! Your team won!' 
              : 'No more valid moves available.'}
          </p>
          <GameStatistics 
            stats={gameStats} 
            gameMode="multiplayer"  
          />
          <button 
            className="new-game-button"
            onClick={handleReturnToMenu}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  };

  const renderUndoButton = () => {
    const canUndo = gameSettings.undoAllowed && 
                    gameState?.lastMove?.cardPlayed && 
                    gameState.lastMove.playerUuid === viewingPlayer?.uuid &&
                    isPlayerTurn &&
                    (gameState.cardsPlayedThisTurn ?? 0) > 0;

    console.log('Undo button state:', {
      hasLastMove: !!gameState?.lastMove,
      lastMoveCardPlayed: !!gameState?.lastMove?.cardPlayed,
      lastMovePlayerUuid: gameState?.lastMove?.playerUuid,
      viewingPlayerUuid: viewingPlayer?.uuid,
      isPlayerTurn,
      cardsPlayedThisTurn: gameState?.cardsPlayedThisTurn
    });
                  
    return canUndo ? (
      <button 
        className="undo-button"
        onClick={handleUndo}
      >
        Undo Last Play
      </button>
    ) : null;
  };

  return (
    <div className="solitaire-game">
      {renderGameOverContent()}

      <h1 className="game-title">Up-N-Down Multiplayer</h1>

      <div className="foundation-piles">
        {gameState.foundationPiles?.map((pile) => (
          <CardPile
            key={pile.id}
            pile={pile}
            onClick={() => handlePileClick(pile.id)}
            onLikeStateChange={(row, position) => handleLikeStateChange(pile.id, row, position)}
            topLikeStates={pile.likeStates?.top || DEFAULT_LIKE_STATES}
            bottomLikeStates={pile.likeStates?.bottom || DEFAULT_LIKE_STATES}
            playerCount={Object.keys(gameState.players).length}
          />

        ))}
      </div>

      <div className="draw-pile-counter">
        {gameState.drawPile?.length ?? 0}
      </div>
      <div>Game Code: {gameState.gameId}</div>

      <div className="hand-section">
        <div className="hand-cards">
          {viewingPlayer.hand?.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isSelected={index === selectedCardIndex}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </div>
        <h3 className="hand-label">Your Hand ({viewingPlayer.hand?.length ?? 0} cards)</h3>
      </div>

      <div className={`turn-management ${isPlayerTurn ? 'active-turn' : ''}`}>
    <div className="current-turn-info">
      {playerNumber !== -1 && <p>You are Player {playerNumber + 1}</p>}
      <p>
        {isPlayerTurn 
          ? "It's your turn" 
          : `Waiting for Player ${Object.values(gameState.players)
              .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
              .findIndex(p => p.uuid === activePlayer.uuid) + 1}`
        }
      </p>
      {isPlayerTurn && (
        <p>Cards Played This Turn: {gameState.cardsPlayedThisTurn ?? 0} / {gameState.minCardsPerTurn ?? 2}</p>
      )}
    </div>
        <div className="turn-controls">
            {isPlayerTurn && renderUndoButton()}
            {isPlayerTurn && (isDrawPileEmpty ? gameState.cardsPlayedThisTurn > 0 : canEndTurn) && (
                <button 
                    className="end-turn-button"
                    onClick={endTurn}
                >
                    End Turn
                </button>
            )}
            {viewingPlayer && viewingPlayer.uuid === Object.values(gameState.players).find(p => p.isHost)?.uuid && (
                <button 
                    className="reset-game-button"
                    onClick={handleResetGame}
                >
                    Reset Game
                </button>
            )}
        </div>
    </div>

    </div>
  );
}