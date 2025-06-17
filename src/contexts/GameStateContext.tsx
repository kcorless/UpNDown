import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import { 
  type Card, 
  type GameState, 
  PILE_TYPES
} from '../types/gameTypes';
import { 
  drawCards, 
  isValidPlay, 
  isSpecialPlay,
  sortCards, 
  calculateMovement, 
  getNextPlayerUuid 
} from '../utils/gameUtils';


type GameAction =
  | { type: 'START_GAME'; payload: GameState }
  | { type: 'END_GAME' }
  | { type: 'RESET' }
  | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'PLAY_CARD'; payload: { 
      cardIndex: number; 
      pileId: string; 
      playerUuid: string;
      settings?: GameState['settings'];
    }}
  | { type: 'DRAW_CARD'; payload: { playerUuid: string } }
  | { type: 'END_TURN' };



  // Define the state interface
interface GameStateReducerState {
  gameState: GameState | null;
  selectedCard: { card: Card; index: number } | null;
  error: string | null;
}

// Define the context type
interface GameStateContextType {
  state: GameStateReducerState;
  dispatch: Dispatch<GameAction>;
}

const initialState: GameStateReducerState = {
  gameState: null,
  selectedCard: null,
  error: null
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);


const updateMinCardsPerTurn = (drawPileLength: number): number => {
  return drawPileLength === 0 ? 1 : 2;
};


function gameReducer(
  state: GameStateReducerState,
  action: GameAction
): GameStateReducerState {
  console.log('gameReducer received action:', { 
    type: action.type, 
    payload: 'payload' in action ? action.payload : undefined,
    timestamp: new Date().toISOString()
  });

  switch (action.type) {
    case 'START_GAME': {
      console.log('START_GAME case hit');

      console.log('Starting new game with state:', action.payload);
      return {
        ...state,
        gameState: {
          ...action.payload,
          minCardsPerTurn: action.payload.drawPile.length === 0 ? 1 : 2
        },
        error: null
      };
    }

    case 'END_GAME':
      
    case 'RESET': {
      return initialState;
    }

    case 'UPDATE_GAME_STATE': {
      console.log('UPDATE_GAME_STATE case hit');
      const updates = action.payload;

      console.log('Game state update details:', {
        foundationPilesBeforeUpdate: state.gameState?.foundationPiles?.map(p => ({
          id: p.id,
          type: p.type,
          currentValue: p.currentValue,
          cardCount: p.cards?.length
        })),
        foundationPilesInUpdate: updates.foundationPiles?.map(p => ({
          id: p.id,
          type: p.type,
          currentValue: p.currentValue,
          cardCount: p.cards?.length
        }))
      });

      const result = {
        ...state,
        gameState: {
          ...state.gameState,
          ...updates,
          lastUpdate: Date.now()
        }
      };

      console.log('Updating game state:', {
        currentState: {
          gameId: state.gameState?.gameId,
          hasFoundationPiles: !!state.gameState?.foundationPiles,
          foundationPilesCount: state.gameState?.foundationPiles?.length
        },
        updates: {
          hasFoundationPiles: !!updates.foundationPiles,
          foundationPilesCount: updates.foundationPiles?.length
        },
        result: {
          hasFoundationPiles: !!result.gameState?.foundationPiles,
          foundationPilesCount: result.gameState?.foundationPiles?.length
        }
      });

      if (!state.gameState) {
        return state;
      }

      // Ensure minCardsPerTurn is updated when game state changes
      const updatedState = {
        ...state.gameState,
        ...action.payload,
        minCardsPerTurn: action.payload.drawPile 
          ? updateMinCardsPerTurn(action.payload.drawPile.length)
          : state.gameState.minCardsPerTurn
      };

      console.log('Updating game state:', {
        currentState: state.gameState,
        updates: action.payload,
        result: updatedState
      });

      return {
        ...state,
        gameState: updatedState,
        error: null
      };
    }

    case 'END_TURN': {
      if (!state.gameState) {
        console.log('END_TURN case hit');

        console.error('Cannot end turn: no active game state');
        return {
          ...state,
          error: 'No active game state'
        };
      }

      console.log('Processing end turn:', {
        currentPlayer: state.gameState.currentPlayerUuid,
        players: state.gameState.players
      });

      const nextPlayerUuid = getNextPlayerUuid(
        state.gameState.players, 
        state.gameState.currentPlayerUuid
      );

      console.log('Turn transition:', {
        from: state.gameState.currentPlayerUuid,
        to: nextPlayerUuid
      });

      return {
        ...state,
        gameState: {
          ...state.gameState,
          currentPlayerUuid: nextPlayerUuid,
          cardsPlayedThisTurn: 0,
          turnEnded: true,
          lastUpdate: Date.now()
        }
      };
    }
    case 'PLAY_CARD': {
      console.log('=====================');
      console.log('PLAY_CARD case hit at:', new Date().toISOString());
      console.log('Action:', action);
      console.log('Current state:', {
        hasGameState: !!state.gameState,
        gameMode: state.gameState?.gameMode,
        players: state.gameState?.players,
        currentPlayerUuid: state.gameState?.currentPlayerUuid
      });
      console.log('=====================');
    
      const gameState = state.gameState;
      if (!gameState) {
        console.error('No game state found');
        return {
          ...state,
          error: 'No active game'
        };
      }
      console.log('PLAY_CARD - Players:', {
        players: state.gameState?.players,
        playerUuid: action.payload.playerUuid,
        playerData: state.gameState?.players[action.payload.playerUuid]
      });
    
      const { cardIndex, pileId, playerUuid } = action.payload;

      console.log('Player validation check:', {
        playerUuid,
        players: gameState.players,
        isRecord: typeof gameState.players === 'object',
        playerKeys: Object.keys(gameState.players),
        player: gameState.players[playerUuid]
      });

      const player = gameState.players[playerUuid];
      
      if (!player) {
        console.error('Invalid player:', { playerUuid, availablePlayers: Object.keys(gameState.players) });
        return {
          ...state,
          error: 'Invalid player'
        };
      }
    
      const card = player.hand[cardIndex];
      if (!card) {
        console.error('Invalid card index:', { cardIndex, handSize: player.hand.length });
        return {
          ...state,
          error: 'Invalid card index'
        };
      }
    
      const pile = gameState.foundationPiles.find(p => p.id === pileId);
      if (!pile) {
        console.error('Invalid pile:', { pileId, availablePiles: gameState.foundationPiles.map(p => p.id) });
        return {
          ...state,
          error: 'Invalid pile'
        };
      }
    
      console.log('Validating play:', {
        card,
        pile,
        pileCards: pile.cards,
        currentValue: pile.currentValue
      });
    
      if (!isValidPlay(card, pile)) {
        const errorMsg = pile.cards.length === 0
          ? `First card on ${pile.type} pile must be ${pile.type === PILE_TYPES.UP ? 'greater than' : 'less than'} ${pile.startValue}`
          : `Cannot play ${card.value} on ${pile.type} pile with current value ${pile.currentValue}`;
        
        console.error('Invalid play:', errorMsg);
        return {
          ...state,
          error: errorMsg
        };
      }
    
      try {
        console.log('Before playing card:', {
          cardValue: card.value,
          pileValue: pile.currentValue,
          pileType: pile.type,
          currentStats: player.stats
        });
    
        const remainingHand = [...player.hand];
        remainingHand.splice(cardIndex, 1);
        
        let newHand = remainingHand;
        let newDrawPile = gameState.drawPile;
        let drawnCard: Card | null = null;
        
        // Update the foundation pile
        const updatedPiles = gameState.foundationPiles.map(p =>
          p.id === pileId
            ? { 
                ...p, 
                cards: [...p.cards, card],
                currentValue: card.value
              }
            : p
        );
    
        // Debug the condition values
        console.log('Checking refresh condition:', {
          gameMode: gameState.gameMode,
          isMultiplayer: gameState.gameMode === 'multiplayer',
          isSolitaire: gameState.gameMode === 'solitaire',
          refreshCardsOnPlay: gameState.settings?.refreshCardsOnPlay,
          drawPileLength: gameState.drawPile.length
        });
    
        // Handle card refresh in solitaire mode or when refreshCardsOnPlay is true
        if ((gameState.gameMode === 'solitaire' || gameState.settings?.refreshCardsOnPlay) && 
            gameState.drawPile.length > 0) {
          console.log('Before card refresh:', {
            drawPileSize: gameState.drawPile.length,
            remainingHandSize: remainingHand.length,
            gameMode: gameState.gameMode,
            refreshCardsOnPlay: gameState.settings?.refreshCardsOnPlay
          });
    
          const drawResult = drawCards(gameState.drawPile, remainingHand, 1);
          newHand = sortCards(drawResult.newHand);
          newDrawPile = drawResult.newDeck;
          drawnCard = drawResult.newHand[newHand.length - 1];
          
          console.log('After card refresh:', {
            drawPileSize: newDrawPile.length,
            newHandSize: newHand.length,
            gameMode: gameState.gameMode,
            drawnCard,
            refreshCardsOnPlay: gameState.settings?.refreshCardsOnPlay,
            newHand: newHand.map(c => c.value)
          });
        }
    
        // Calculate movement and check for special play
        const movement = calculateMovement(card, pile);
        const specialPlay = isSpecialPlay(card, pile);
    
        // Update players with new stats and hand
        const updatedPlayers = {
          ...gameState.players,
          [playerUuid]: {
            ...player,
            hand: newHand,
            cardCount: newHand.length,
            stats: {
              ...player.stats,
              totalCardsPlayed: player.stats.totalCardsPlayed + 1,
              specialPlaysCount: specialPlay ? player.stats.specialPlaysCount + 1 : player.stats.specialPlaysCount,
              totalMovement: player.stats.totalMovement + movement
            }
          }
        };
    
        // Check for game over conditions
        let gameOver = false;
        let gameWon = false;
    
        // Handle solitaire game over conditions
        if (gameState.gameMode === 'solitaire') {
          const hasValidMove = newHand.some(handCard => 
            updatedPiles.some(pile => isValidPlay(handCard, pile))
          );
    
          if (!hasValidMove) {
            console.log('Game over (lost) in solitaire:', {
              drawPileEmpty: newDrawPile.length === 0,
              handSize: newHand.length,
              hand: newHand.map(c => c.value)
            });
            gameOver = true;
            gameWon = false;
          }
        }
    
        // Check for game won condition (applies to both modes)
        if (!gameOver) {
          gameWon = Object.values(updatedPlayers).every(p => p.hand.length === 0) && 
                    newDrawPile.length === 0;
          gameOver = gameWon;
        }
    
        return {
          ...state,
          gameState: {
            ...gameState,
            players: updatedPlayers,
            foundationPiles: updatedPiles,
            drawPile: newDrawPile,
            cardsPlayedThisTurn: gameState.cardsPlayedThisTurn + 1,
            minCardsPerTurn: updateMinCardsPerTurn(newDrawPile.length),
            gameWon,
            gameOver,
            lastUpdate: Date.now(),
            lastMove: {
              cardPlayed: card,
              playerUuid,
              pileId,
              drawnCard
            }
          },
          error: null
        };
    
      } catch (error) {
        console.error('Failed to play card:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to play card';
        return {
          ...state,
          error: errorMessage
        };
      }
    }
    // Rest of the function remains the same...
    // [Existing code for updating players, checking game won condition, etc.]

case 'DRAW_CARD': {
  console.log('DRAW_CARD case hit');

  if (!state.gameState) {
    return {
      ...state,
      error: 'No active game'
    };
  }

  try {
    const { playerUuid } = action.payload;
    const player = state.gameState.players[playerUuid];
    if (!player) {
      console.error('Invalid player for draw:', playerUuid);
      return {
        ...state,
        error: 'Invalid player'
      };
    }

    console.log('Drawing card for player:', {
      playerUuid,
      currentHandSize: player.hand.length,
      drawPileSize: state.gameState.drawPile.length
    });

    const { newHand, newDeck } = drawCards(
      state.gameState.drawPile,
      player.hand,
      1
    );

    const sortedHand = sortCards(newHand);
    const updatedPlayers = { ...state.gameState.players };
    updatedPlayers[playerUuid] = {
      ...player,
      hand: sortedHand,
      cardCount: sortedHand.length
    };

    const hasValidMoves = Object.values(updatedPlayers).some(p => 
      p.hand.some(card => state.gameState!.foundationPiles.some(pile => isValidPlay(card, pile)))
    );
    const isGameWon = Object.values(updatedPlayers).every(p => p.hand.length === 0) && 
                     newDeck.length === 0;

    console.log('After draw:', {
      newHandSize: sortedHand.length,
      newDeckSize: newDeck.length,
      hasValidMoves,
      isGameWon
    });

    return {
      ...state,
      gameState: {
        ...state.gameState,
        players: updatedPlayers,
        drawPile: newDeck,
        gameOver: !hasValidMoves,
        gameWon: isGameWon,
        lastUpdate: Date.now()
      },
      error: null
    };
  } catch (error) {
    console.error('Failed to draw card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to draw card';
    return {
      ...state,
      error: errorMessage
    };
  }
}

default: {
  return state;
}
}
}

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameStateContext() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}