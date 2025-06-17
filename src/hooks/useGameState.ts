// React hooks
import { useCallback, useEffect } from 'react';

// Context hooks
import { useGameStateContext } from '../contexts/GameStateContext';
import { useSettings } from '../contexts/SettingsContext';

// Constants
import { MIN_CARDS_PER_TURN } from './gameConstants';

// Types
import { 
  type GameState, 
  type Player,
  type Pile,
  type Card,
  DEFAULT_LIKE_STATES
} from '../types/gameTypes';

// Game utilities
import { 
  isValidPlay, 
  checkGameOver,
  sortCards,
  drawCards,
  isSpecialPlay,
  initializeNewGame
} from '../utils/gameUtils';

// Services
import {
  endTurn as endTurnService,
  updateGameInFirebase
} from '../services/lobbyService';

import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export const useGameState = () => {
  const { state, dispatch } = useGameStateContext();
  const { settings } = useSettings();

  // Pull out the current gameState (so we can use it in callbacks cleanly)
  const gameState = state.gameState;

  // Initialize game state
  const startGame = useCallback((mode: 'solitaire' | 'multiplayer', playerUuid: string, playerName: string) => {
    const timestamp = Date.now();
    
    if (mode === 'multiplayer') {
      // For multiplayer, just set initial state
      const initialState: GameState = {
        gameId: '',
        gameMode: 'multiplayer',
        status: 'waiting',
        players: {},  // Empty PlayerRecord object instead of array
        currentPlayerUuid: '',  // Using currentPlayerUuid instead of currentPlayer
        foundationPiles: [],
        drawPile: [],
        cardsPlayedThisTurn: 0,
        minCardsPerTurn: MIN_CARDS_PER_TURN,
        turnEnded: false,
        gameOver: false,
        gameWon: false,
        lastUpdate: timestamp,
        settings: settings  // Include settings in initial state
      };

      dispatch({ type: 'UPDATE_GAME_STATE', payload: initialState });
      return;
    }

    // For solitaire, create a full game state
    const player: Player = {
      uuid: playerUuid,
      name: playerName,
      hand: [],
      cardCount: 0,
      isHost: true,
      isReady: true,
      joinedAt: timestamp,
      stats: {
        totalCardsPlayed: 0,
        specialPlaysCount: 0,
        totalMovement: 0
      }
    };

    // Create initial game state using initializeNewGame
    const initialState = initializeNewGame(
      'solitaire',
      settings,
      [player],
      timestamp
    );

    dispatch({ type: 'UPDATE_GAME_STATE', payload: initialState });
  }, [dispatch, settings]);

  // Add game state subscription effect
  useEffect(() => {
    if (gameState?.gameId && gameState?.gameMode === 'multiplayer') {
      console.log('Setting up game state subscription for game:', gameState.gameId);
      
      const gameStateRef = ref(database, `games/${gameState.gameId}`);
      const unsubscribe = onValue(gameStateRef, (snapshot) => {
        const receivedGameState = snapshot.val() as GameState;
        if (!receivedGameState) return;

        console.log('Processing game state update:', {
          gameId: receivedGameState.gameId,
          currentPlayerUuid: receivedGameState.currentPlayerUuid,
          players: receivedGameState.players
        });

        // Update game state directly since we're receiving the correct type
        dispatch({ type: 'UPDATE_GAME_STATE', payload: receivedGameState });
      });

      return () => {
        console.log('Cleaning up game state subscription');
        unsubscribe();
      };
    }
  }, [gameState?.gameId, gameState?.gameMode, dispatch]);

  const playCard = useCallback(
    async (cardIndex: number, pileId: string) => {
      console.log('playCard called:', { cardIndex, pileId });
      if (!gameState) {
        console.error('Cannot play card: no active game state');
        return;
      }
      
      // Remove this line as it creates stale closure
      // const currentState = gameState;
      const isMultiplayer = gameState.gameMode === 'multiplayer';
      
      try {
        // Validate play using current gameState
        const currentPlayer = gameState.players[gameState.currentPlayerUuid];
        if (!currentPlayer?.hand) {
          console.error('Invalid player or missing hand');
          return;
        }
        
        const card = currentPlayer.hand[cardIndex];
        const pile = gameState.foundationPiles.find((p) => p.id === pileId);
        
        if (!pile || !card) {
          console.error('Invalid card or pile', { card, pile });
          return;
        }
        
        if (!isValidPlay(card, pile)) {
          console.error('Invalid play', { card, pile });
          return;
        }

        if (isMultiplayer) {
          // Calculate new state using current gameState
          const updatedState = calculateUpdatedState(
            gameState,  // Use gameState directly instead of currentState
            cardIndex,
            pileId,
            card,
            currentPlayer
          );

          // Only update Firebase - all state updates come through subscription
          await updateGameInFirebase(gameState.gameId, updatedState);
        } else {
          // Solitaire mode - use direct dispatch
          dispatch({ 
            type: 'PLAY_CARD', 
            payload: {
              cardIndex,
              pileId,
              playerUuid: gameState.currentPlayerUuid,
              settings: gameState.settings
            }
          });
        }
      } catch (error) {
        console.error('Error playing card:', error);
      }
    },
    [gameState, dispatch]
);

// Helper function to calculate new state
const calculateUpdatedState = (
  currentState: GameState,
  cardIndex: number,
  pileId: string,
  card: Card,
  currentPlayer: Player
): Partial<GameState> => {
  // Remove played card from hand
  const remainingHand = currentPlayer.hand.filter((_, i) => i !== cardIndex);
  
  // Update foundation piles
  const updatedPiles = currentState.foundationPiles.map(p =>
    p.id === pileId
      ? { ...p, cards: [...p.cards, card], currentValue: card.value }
      : p
  );

  const updatedCardsPlayed = currentState.cardsPlayedThisTurn + 1;

  // Calculate card refresh if needed
  let newHand = remainingHand;
  let newDrawPile = currentState.drawPile;
  let drawnCard = null;

  if (currentState.settings?.refreshCardsOnPlay && currentState.drawPile.length > 0) {
    const drawResult = drawCards(currentState.drawPile, remainingHand, 1);
    newHand = sortCards(drawResult.newHand);
    newDrawPile = drawResult.newDeck;
    drawnCard = newHand[newHand.length - 1];
  }

  // Calculate player statistics
  const pile = currentState.foundationPiles.find(p => p.id === pileId);
  const isSpecialMove = pile ? isSpecialPlay(card, pile) : false;
  const movement = isSpecialMove ? -10 : (pile ? Math.abs(pile.currentValue - card.value) : 0);

  console.log('Calculating player stats:', {
    playerUuid: currentPlayer.uuid,
    currentStats: currentPlayer.stats,
    isSpecialMove,
    movement,
    pileType: pile?.type,
    cardValue: card.value,
    pileCurrentValue: pile?.currentValue
  });

  const updatedPlayer = {
    ...currentPlayer,
    hand: newHand,
    cardCount: newHand.length,
    stats: {
      totalCardsPlayed: (currentPlayer.stats?.totalCardsPlayed || 0) + 1,
      specialPlaysCount: (currentPlayer.stats?.specialPlaysCount || 0) + (isSpecialMove ? 1 : 0),
      totalMovement: (currentPlayer.stats?.totalMovement || 0) + movement
    }
  };

  // Check for game lost based on settings
  const handToCheck = currentState.settings?.refreshCardsOnPlay ? newHand : remainingHand;
  
  const isGameLost = updatedCardsPlayed < currentState.minCardsPerTurn && (
    checkForGameLost(
      handToCheck,
      updatedPiles,
      updatedCardsPlayed,
      currentState.minCardsPerTurn
    ) || (
      !handToCheck.some(card => updatedPiles.some(pile => isValidPlay(card, pile))) &&
      !currentState.settings?.refreshCardsOnPlay
    )
  );

  // Create updated state with new players record
  const updatedPlayers = {
    ...currentState.players,
    [currentPlayer.uuid]: updatedPlayer
  };

  if (isGameLost) {
    const updatedState = {
      ...currentState,
      players: updatedPlayers,
      foundationPiles: updatedPiles,
      drawPile: newDrawPile,
      cardsPlayedThisTurn: updatedCardsPlayed,
      gameOver: true,
      gameWon: false,
      lastUpdate: Date.now(),
      lastMove: {
        cardPlayed: card,
        playerUuid: currentPlayer.uuid,
        pileId,
        drawnCard
      }
    };

    console.log('Game lost - final stats:', {
      players: Object.entries(updatedState.players).map(([uuid, player]) => ({
        uuid,
        name: player.name,
        stats: player.stats
      }))
    });

    return updatedState;
  }

  // Check for game won condition
  const allHandsEmpty = Object.values(currentState.players).every(p => 
    p.uuid === currentPlayer.uuid ? handToCheck.length === 0 : p.hand.length === 0
  );
  const isGameWon = allHandsEmpty && newDrawPile.length === 0;

  const finalState = {
    ...currentState,
    players: updatedPlayers,
    foundationPiles: updatedPiles,
    drawPile: newDrawPile,
    cardsPlayedThisTurn: updatedCardsPlayed,
    gameOver: isGameWon,
    gameWon: isGameWon,
    lastUpdate: Date.now(),
    lastMove: {
      cardPlayed: card,
      playerUuid: currentPlayer.uuid,
      pileId,
      drawnCard
    }
  };

  console.log('Updated game state:', {
    playerStats: Object.entries(finalState.players).map(([uuid, player]) => ({
      uuid,
      name: player.name,
      stats: player.stats
    }))
  });

  return finalState;
};

// Helper function to check for game lost
const checkForGameLost = (
  hand: Card[],
  piles: Pile[],
  cardsPlayed: number,
  minRequired: number
): boolean => {
  // Only check if we haven't met minimum cards
  if (cardsPlayed >= minRequired) return false;
  
  console.log('Starting game lost check with hand:', {
    handValues: hand.map(c => c.value),
    handIds: hand.map(c => c.id)
  });
  
  // Check if any card in hand can be played on any pile
  const hasValidMove = hand.some(card => 
    piles.some(pile => isValidPlay(card, pile))
  );

  console.log('Checking for game lost:', {
    hand: hand.map(c => ({ id: c.id, value: c.value })),
    pileValues: piles.map(p => ({
      id: p.id,
      type: p.type,
      currentValue: p.currentValue,
      cards: p.cards.map(c => c.value)
    })),
    cardsPlayed,
    minRequired,
    hasValidMove
  });
  
  return !hasValidMove;
};
  
const handleEndTurn = useCallback(async () => {
  if (!gameState) {
    console.error('Cannot end turn: no active game state');
    return;
  }
  
  const currentState = gameState;
  const isMultiplayer = currentState.gameMode === 'multiplayer';
  
  try {
    // Check if minimum cards requirement is met
    if (currentState.cardsPlayedThisTurn < MIN_CARDS_PER_TURN) {
      console.error('Must play at least 2 cards before ending turn');
      return;
    }
    
    // Get current player
    const currentPlayer = currentState.players[currentState.currentPlayerUuid];
    
    if (!currentPlayer) {
      console.error('Invalid player');
      return;
    }

    // Find next player with cards
    const orderedPlayers = Object.values(currentState.players);
    let nextPlayerIndex = orderedPlayers.findIndex(player => player.uuid === currentState.currentPlayerUuid) + 1;
    let nextPlayer: Player | undefined;
    
    // Loop through players until we find one with cards or come back to current player
    for (let i = 0; i < orderedPlayers.length; i++) {
      const candidateIndex = (nextPlayerIndex + i) % orderedPlayers.length;
      const candidate = orderedPlayers[candidateIndex];
      
      if (candidate.hand.length > 0) {
        nextPlayer = candidate;
        break;
      }
    }

    // If no players with cards found (shouldn't happen as current player should have cards)
    if (!nextPlayer) {
      console.error('No players with cards found');
      return;
    }

    const nextPlayerUuid = nextPlayer.uuid;

    // Check for game over at start of next turn
    if (!currentState.settings?.refreshCardsOnPlay) {
      const gameOverState = checkGameOver({
        ...currentState,
        currentPlayerUuid: nextPlayerUuid,
        cardsPlayedThisTurn: 0
      });
      
      if (gameOverState.isGameLost || gameOverState.isGameWon) {
        console.log('Game over detected at start of turn:', {
          isGameWon: gameOverState.isGameWon,
          isGameLost: gameOverState.isGameLost,
          nextPlayer: nextPlayerUuid,
          handSize: nextPlayer.hand.length,
          drawPileSize: currentState.drawPile.length
        });
        
        const updatedState = {
          ...currentState,
          currentPlayerUuid: nextPlayerUuid,
          cardsPlayedThisTurn: 0,
          turnEnded: true,
          gameOver: true,
          gameWon: gameOverState.isGameWon,
          lastUpdate: Date.now()
        };
        
        // Update state in Firebase for multiplayer games
        if (isMultiplayer) {
          await updateGameInFirebase(currentState.gameId, updatedState);
        }
        
        // Update local state
        dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedState });
        return;
      }
    }
    
    // Draw cards if refreshCardsOnPlay is false and cards were played this turn
    const cardsToDrawCount = currentState.cardsPlayedThisTurn;
    let updatedDrawPile = [...currentState.drawPile];
    let updatedPlayers = { ...currentState.players };
    let drawnCards: Card[] = [];
    
    if (!currentState.settings?.refreshCardsOnPlay && cardsToDrawCount > 0 && updatedDrawPile.length > 0) {
      console.log('Drawing cards at end of turn:', {
        cardsToDrawCount,
        drawPileSize: updatedDrawPile.length,
        currentHand: currentPlayer.hand
      });
      
      // Draw up to cardsToDrawCount cards or until draw pile is empty
      for (let i = 0; i < cardsToDrawCount && updatedDrawPile.length > 0; i++) {
        const drawnCard = updatedDrawPile[0];
        drawnCards.push(drawnCard);
        updatedDrawPile = updatedDrawPile.slice(1);
      }
      
      // Add drawn cards to player's hand
      updatedPlayers = {
        ...updatedPlayers,
        [currentState.currentPlayerUuid]: {
          ...currentPlayer,
          hand: sortCards([...currentPlayer.hand, ...drawnCards]),
          cardCount: currentPlayer.hand.length + drawnCards.length
        }
      };
    }

    // Reset all like states for each pile
    const updatedPiles = currentState.foundationPiles.map(pile => ({
      ...pile,
      likeStates: {
        top: [...DEFAULT_LIKE_STATES],
        bottom: [...DEFAULT_LIKE_STATES]
      }
    }));
    
    // Create updated game state
    const updatedState = {
      ...currentState,
      currentPlayerUuid: nextPlayerUuid,
      cardsPlayedThisTurn: 0,
      turnEnded: true,
      lastUpdate: Date.now(),
      gameId: currentState.gameId,  // Explicitly preserve gameId
      players: updatedPlayers,
      drawPile: updatedDrawPile,
      foundationPiles: updatedPiles,  // Include updated piles with reset like states
      lastMove: drawnCards.length > 0 && currentState.lastMove ? {
        ...currentState.lastMove,  // Keep existing lastMove data
        cardPlayed: currentState.lastMove.cardPlayed,
        playerUuid: currentState.lastMove.playerUuid,
        pileId: currentState.lastMove.pileId,
        drawnCard: currentState.lastMove.drawnCard,
        endTurnDrawnCards: drawnCards
      } : currentState.lastMove
    };
    
    // Update state in Firebase for multiplayer games
    if (isMultiplayer) {
      await endTurnService(currentState.gameId, currentPlayer.uuid);
      if (drawnCards.length > 0) {
        await updateGameInFirebase(currentState.gameId, updatedState);
      }
    }
    
    // Update local state
    dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedState });
    
    console.log('Turn ended successfully:', {
      previousPlayer: currentPlayer.uuid,
      nextPlayer: nextPlayerUuid,
      drawnCards: drawnCards.map(c => c.value)
    });
    
  } catch (error) {
    console.error('Failed to end turn:', error);
    throw error;
  }
}, [gameState, dispatch]);
  
  const handleUndo = useCallback(async () => {
    if (!gameState?.lastMove) return;
    
    const { cardPlayed, pileId } = gameState.lastMove;
    
    try {
      // 1. Remove card from pile and revert to previous value
      const updatedPiles = gameState.foundationPiles.map(pile => {
        if (pile.id === pileId) {
          const cards = pile.cards.slice(0, -1);  // Remove the last played card
          // If there are cards in the pile, use the last card's value
          // If no cards (just starting value), use the pile's startValue
          const previousValue = cards.length > 0 ? cards[cards.length - 1].value : pile.startValue;
          
          return {
            ...pile,
            cards,
            currentValue: previousValue
          };
        }
        return pile;
      });
      
      // 2. Return card to player's hand
      const currentPlayer = gameState.players[gameState.currentPlayerUuid];
      const updatedPlayers = {
        ...gameState.players,
        [gameState.currentPlayerUuid]: {
          ...currentPlayer,
          hand: (() => {
            let updatedHand = Array.isArray(currentPlayer.hand) ? [...currentPlayer.hand] : [];
            // If we drew a card this turn and are undoing, remove it
            if (gameState.lastMove?.drawnCard && gameState.drawPile.length > 0) {
              const drawnCardIndex = updatedHand.findIndex(c => c.id === gameState.lastMove?.drawnCard?.id);
              if (drawnCardIndex !== -1) {
                updatedHand.splice(drawnCardIndex, 1);
              }
            }
            // Add the undone card back to hand
            updatedHand.push(cardPlayed);
            return sortCards(updatedHand);
          })(),
          stats: {
            ...currentPlayer.stats,
            totalCardsPlayed: Math.max(0, (currentPlayer.stats?.totalCardsPlayed ?? 0) - 1)
          }
        }
      };
      
      // 3. Update draw pile if needed (only if there was actually a drawn card)
      let updatedDrawPile = [...gameState.drawPile];
      const drawnCard = gameState.lastMove?.drawnCard;
      if (drawnCard && gameState.drawPile.length > 0) {
        updatedDrawPile = [drawnCard, ...updatedDrawPile];
      }
      
      const updatedState = {
        ...gameState,
        players: updatedPlayers,
        foundationPiles: updatedPiles,
        drawPile: updatedDrawPile,
        cardsPlayedThisTurn: Math.max(0, (gameState.cardsPlayedThisTurn ?? 0) - 1),
        lastMove: null,
        lastUpdate: Date.now()
      };
      
      // Update Firebase for multiplayer
      if (gameState.gameMode === 'multiplayer' && gameState.gameId) {
        console.log('Updating Firebase after undo:', {
          gameId: gameState.gameId,
          pileId,
          previousValue: updatedPiles.find(p => p.id === pileId)?.currentValue,
          cardsPlayedThisTurn: updatedState.cardsPlayedThisTurn
        });
        
        await updateGameInFirebase(gameState.gameId, updatedState);
      }
      
      dispatch({ type: 'UPDATE_GAME_STATE', payload: updatedState });
    } catch (error) {
      console.error('Error undoing move:', error);
    }
  }, [gameState, dispatch]);

  // Return everything you need from the hook
  return {
    gameState,             // from context
    error: state?.error,   // or gameState?.error if you store error in the same object
    startGame,            // renamed from initializeGame
    playCard,
    endTurn: handleEndTurn,
    updateGameState: (payload: Partial<GameState>) => dispatch({ type: 'UPDATE_GAME_STATE', payload }),
    handleUndo
  };
};