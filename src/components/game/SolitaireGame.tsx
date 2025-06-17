import { type FC, useEffect, useState } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { Card } from '../card/Card';
import { CardPile } from '../CardPile';
import { GameStatistics } from '../GameStatistics';
import { calculateGameStatsSummary } from '../../utils/gameStatisticsUtils';
import { useGameStateContext } from '../../contexts/GameStateContext';
import { useSettings } from '../../contexts/SettingsContext';
import { type Player } from '../../types/gameTypes';  // Add this import at the top
import './SolitaireGame.css';
import { getGameStorage } from '../../utils/gameStorage';  // Add this import

export const SolitaireGame: FC = () => {
  const { gameState, playCard, startGame, handleUndo } = useGameState();
  const { dispatch } = useGameStateContext();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const { settings } = useSettings(); 

  useEffect(() => {
    if (!gameState || !gameState.foundationPiles.length) {
      const storage = getGameStorage();
      if (storage) {
        console.log('Initializing new solitaire game');
        startGame('solitaire', storage.playerUuid, 'Player 1');
      }
    }
  }, [gameState, startGame]);

  // Add settings debug effect...

  if (!gameState || gameState.gameMode !== 'solitaire') {
    return <div className="loading">Loading game...</div>;
  }

  // Define currentPlayer with proper typing
  const currentPlayer: Player | undefined = gameState.players[gameState.currentPlayerUuid];
  if (!currentPlayer) {
    return <div className="loading">Loading game...</div>;
  }
  // Add settings debug
  useEffect(() => {
    console.log('Settings loaded:', {
      settings,
      undoAllowed: settings.undoAllowed,
      gameState: gameState ? {
        lastMove: gameState.lastMove,
        mode: gameState.gameMode,
        foundationPiles: gameState.foundationPiles
      } : null
    });
  }, [settings, gameState]);

  // Add settings debug
  useEffect(() => {
    console.log('Settings loaded:', {
      settings,
      undoAllowed: settings.undoAllowed,
      gameState: gameState ? {
        lastMove: gameState.lastMove,
        mode: gameState.gameMode
      } : null
    });
  }, [settings, gameState]);

  if (!gameState || gameState.gameMode !== 'solitaire') {
    return <div className="loading">Loading game...</div>;
  }
  
  // New handler for card selection
  const handleCardClick = (index: number) => {
    console.log('Card clicked:', {
        index,
        currentSelectedIndex: selectedCardIndex,
        cardDetails: currentPlayer.hand[index]
    });
    setSelectedCardIndex(index);
};
  // New handler for pile clicks
  const handlePileClick = (pileId: string) => {
    console.log('Pile clicked:', {
        pileId,
        selectedCardIndex,
        selectedCard: selectedCardIndex !== null ? currentPlayer.hand[selectedCardIndex] : null,
        drawPileSize: gameState.drawPile.length
    });
    
    if (selectedCardIndex !== null) {
        console.log(`Attempting to play card at index ${selectedCardIndex} on pile ${pileId}`);
        playCard(selectedCardIndex, pileId);
        setSelectedCardIndex(null);  // Deselect after playing
    }
};

  const renderGameOverMessage = () => {
    if (!gameState.gameOver) return null;

    const gameStats = calculateGameStatsSummary(gameState);

    const handleReturnToMenu = () => {
      dispatch({ type: 'RESET' });
    };
  

    return (
      <div className="game-over-overlay">
        <div className="game-over-message">
          <h2>{gameState.gameWon ? 'Congratulations!' : 'Game Over'}</h2>
          <p>
            {gameState.gameWon 
              ? 'You successfully played all cards! Well done!' 
              : 'No more valid moves available!'}
          </p>
          <GameStatistics stats={gameStats} gameMode="solitaire" />
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
    console.log('Undo button check:', {
      undoAllowed: settings.undoAllowed,
      lastMove: gameState?.lastMove,
      cardPlayed: gameState?.lastMove?.cardPlayed,
      settings
    });
    const canUndo = settings.undoAllowed && gameState?.lastMove?.cardPlayed !== undefined;
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
      {renderGameOverMessage()}

      <div className="game-header">
        <h1 className="game-title">Up-N-Down Solitaire</h1>
      </div>

      <div className="game-controls">
        {renderUndoButton()}
      </div>

      <div className="foundation-piles">
        {gameState.foundationPiles.map((pile) => (
          <CardPile
            key={pile.id}
            pile={pile}
            onClick={() => handlePileClick(pile.id)}
            playerCount={1}
            />
        ))}
      </div>
      
      <div className="draw-pile-counter">
        {gameState.drawPile.length}
      </div>

      <div className="hand-section">
        <div className="hand-cards">
          {currentPlayer.hand.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              isSelected={index === selectedCardIndex}
              onClick={() => handleCardClick(index)}
            />
          ))}
        </div>
        <h3 className="hand-label">Your Hand ({currentPlayer.hand.length} cards)</h3>
      </div>
    </div>
  );
};