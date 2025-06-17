import { 
  type Card, 
  type Pile, 
  type Player, 
  type GameState,
  type PlayerRecord,
  PILE_TYPES,
  DEFAULT_LIKE_STATES,
  DECK
} from '../types/gameTypes';

import {
  SOLITAIRE_HAND_SIZE,
  DEFAULT_MAX_PLAYERS,
  PILE_DIFFERENCE_RULE
} from '../hooks/gameConstants';

// Add after imports in gameUtils.ts
export const isSpecialPlay = (card: Card, pile: Pile): boolean => {
  if (pile.type === PILE_TYPES.UP) {
    return card.value === pile.currentValue - 10;
  }
  return card.value === pile.currentValue + 10;
};

// Type definitions
interface DealResult {
  hands: Card[][];
  drawPile: Card[];
}

interface InitialHandResult {
  hand: Card[];
  remainingDeck: Card[];
}

interface AutoPlayResult {
  updatedHand: Card[];
  updatedPiles: Pile[];
  cardsPlayed: number;
}


// Creates an ordered deck of cards (not shuffled)
export function createDeck(settings?: { cardMin?: number; cardMax?: number }): Card[] {
  const deck: Card[] = [];
  // If no settings, use DECK.MINDEFAULT + 1 and DECK.MAXDEFAULT - 1
  const min = settings?.cardMin ? settings.cardMin + 1 : DECK.MINDEFAULT + 1;
  const max = settings?.cardMax ? settings.cardMax - 1 : DECK.MAXDEFAULT - 1;
  
  for (let value = min; value <= max; value++) {
    deck.push({ id: `card-${value}`, value });
  }
  return deck;
}


/**
 * Shuffles the deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sorts cards by value in ascending order
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.value - b.value);
}

/**
 * Deals cards for a multiplayer game
 */
export function dealCards(
  deck: Card[], 
  numPlayers: number, 
  settings: { handSizes: { solitaire: number; twoPlayer: number; multiplayer: number; } }
): DealResult {
  if (numPlayers <= 0 || numPlayers > DEFAULT_MAX_PLAYERS) {
    throw new Error('Number of players must be between 1 and 6');
  }

  if (!settings?.handSizes) {
    throw new Error('Hand sizes must be provided in settings');
  }
  
  // Use settings hand sizes
  const handSize = numPlayers === 1 ? 
                   settings.handSizes.solitaire :
                   numPlayers === 2 ? 
                   settings.handSizes.twoPlayer :
                   settings.handSizes.multiplayer;
  
  console.log('Dealing cards with settings:', {
    numPlayers,
    handSize,
    settingsHandSizes: settings.handSizes
  });
  
  const hands: Card[][] = Array(numPlayers).fill(null).map(() => []);
  const deckCopy = [...deck];
  
  // Deal cards to each player
  for (let i = 0; i < handSize; i++) {
    for (let j = 0; j < numPlayers; j++) {
      if (deckCopy.length > 0) {
        const card = deckCopy.pop();
        if (card) {
          hands[j].push(card);
        }
      }
    }
  }
  
  // Sort each player's hand
  hands.forEach(hand => hand.sort((a, b) => a.value - b.value));
  
  return {
    hands,
    drawPile: deckCopy
  };
}

/**
 * Deals initial hand to a player
 */
export function dealInitialHand(deck: Card[]): InitialHandResult {
  const handSize = SOLITAIRE_HAND_SIZE.valueOf();
  if (deck.length < handSize) {
    throw new Error(`Not enough cards in deck for initial hand. Required: ${handSize}`);
  }
  const hand = deck.slice(0, handSize);
  const remainingDeck = deck.slice(handSize);
  return { hand: sortCards(hand), remainingDeck };
}

/**
 * Validates if a card can be played on a specific pile
 */
export function isValidPlay(card: Card | null | undefined, pile: Pile): boolean {
  if (!card || !pile) {
    console.log('Invalid card or pile:', { card, pile });
    return false;
  }

  console.log('Checking play:', {
    cardValue: card.value,
    pileId: pile.id,
    pileType: pile.type,
    pileCurrentValue: pile.currentValue,
    pileCards: pile.cards.map(c => c.value)
  });
 
  // For empty piles, check against current value
  if (!pile.cards || pile.cards.length === 0) {
    if (pile.type === PILE_TYPES.UP) {
      const valid = card.value > pile.currentValue;
      console.log('Empty UP pile check:', { cardValue: card.value, currentValue: pile.currentValue, valid });
      return valid;
    } else {
      const valid = card.value < pile.currentValue;
      console.log('Empty DOWN pile check:', { cardValue: card.value, currentValue: pile.currentValue, valid });
      return valid;
    }
  }
 
  // For non-empty piles, get the last played card's value
  const lastCardValue = pile.cards[pile.cards.length - 1].value;
  
  if (pile.type === PILE_TYPES.UP) {
    const isAscending = card.value > lastCardValue;
    const isSpecialPlay = card.value === lastCardValue - PILE_DIFFERENCE_RULE;
    console.log('UP pile check:', {
      cardValue: card.value,
      lastCardValue,
      isAscending,
      isSpecialPlay,
      valid: isAscending || isSpecialPlay
    });
    return isAscending || isSpecialPlay;
  } else {
    const isDescending = card.value < lastCardValue;
    const isSpecialPlay = card.value === lastCardValue + PILE_DIFFERENCE_RULE;
    console.log('DOWN pile check:', {
      cardValue: card.value,
      lastCardValue,
      isDescending,
      isSpecialPlay,
      valid: isDescending || isSpecialPlay
    });
    return isDescending || isSpecialPlay;
  }
}

/**
 * Draws cards from the deck
 */
export function drawCards(
  deck: Card[], 
  hand: Card[], 
  count: number
): { newHand: Card[]; newDeck: Card[]; } {
  if (count < 0) {
    throw new Error('Count must be non-negative');
  }
  if (deck.length < count) {
    throw new Error('Not enough cards in deck');
  }

  const drawnCards = deck.slice(0, count);
  const newDeck = deck.slice(count);
  const newHand = sortCards([...hand, ...drawnCards]);

  return {
    newHand,
    newDeck
  };
}

/**
 * Updates the game state after a card is played
 * @param prevState Current game state
 * @param cardIndex Index of card being played
 * @param pileId ID of pile being played to
 * @returns Updated game state or null if invalid play
 */
export function updateGameState(
  prevState: {
    currentPlayerUuid: string;
    players: PlayerRecord;
    foundationPiles: Pile[];
  },
  cardIndex: number,
  pileId: string
): typeof prevState | null {
  const { currentPlayerUuid } = prevState;  // Destructure at the start
  const player = prevState.players[currentPlayerUuid];
  const card = player.hand[cardIndex];
  const pile = prevState.foundationPiles.find(p => p.id === pileId);

  if (!pile || !card) return null;
  if (!isValidPlay(card, pile)) return null;

  const newState = { ...prevState };
  
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);
  
  const newPile = {
    ...pile,
    cards: [...pile.cards, card]
  };

  // Use the destructured currentPlayerUuid
  newState.players[currentPlayerUuid] = {
    ...player,
    hand: newHand,
    cardCount: newHand.length
  };
  
  const pileIndex = newState.foundationPiles.findIndex(p => p.id === pileId);
  newState.foundationPiles[pileIndex] = newPile;

  return newState;
}

/**
 * Auto-plays cards from the hand
 */
export function autoPlay(hand: Card[], piles: Pile[]): AutoPlayResult {
  let updatedHand = [...hand];
  let updatedPiles = [...piles];
  let cardsPlayed = 0;

  let madeMove = true;
  while (madeMove && updatedHand.length > 0) {
    madeMove = false;
    
    for (let i = 0; i < updatedHand.length; i++) {
      const card = updatedHand[i];
      const validPiles = getValidMoves(card, updatedPiles);
      
      if (validPiles.length > 0) {
        const targetPile = validPiles.find(p => p.type === PILE_TYPES.UP) || validPiles[0];
        
        updatedPiles = updatedPiles.map(p =>
          p.id === targetPile.id
            ? { ...p, cards: [...p.cards, card] }
            : p
        );
        
        updatedHand = [...updatedHand.slice(0, i), ...updatedHand.slice(i + 1)];
        cardsPlayed++;
        madeMove = true;
        break;
      }
    }
  }

  return { updatedHand, updatedPiles, cardsPlayed };
}

// Utility functions
export const hasValidMove = (hand: Card[], foundationPiles: Pile[]): boolean =>
  hand.some(card => foundationPiles.some(pile => isValidPlay(card, pile)));

export const getValidMoves = (card: Card, piles: Pile[]): Pile[] =>
  piles.filter(pile => isValidPlay(card, pile));

export const checkWinCondition = (piles: Pile[]): boolean =>
  piles.every(pile => 
    (pile.type === PILE_TYPES.UP || pile.type === PILE_TYPES.DOWN) && 
    pile.cards.length === 13
  );
  
export function hasAnyValidMove(player: Player, piles: Pile[]): boolean {
  return player.hand.some(card => piles.some(pile => isValidPlay(card, pile)));
}

/**
 * Maps a player index (0-5) to their heart position on the foundation piles
 * Top row is for players 0-2, bottom row for players 3-5
 */
export const mapPlayerToHeartPosition = (playerIndex: number): { 
  row: 'top' | 'bottom', 
  position: number 
} => {
  if (playerIndex < 0 || playerIndex >= 6) {
    throw new Error('Player index must be between 0 and 5');
  }

  // Players 0-2 are on top row
  if (playerIndex < 3) {
    return {
      row: 'top',
      position: playerIndex
    };
  }
  
  // Players 3-5 are on bottom row
  return {
    row: 'bottom',
    position: playerIndex - 3
  };
};


/**
 * Converts a heart position (row and position) back to a player index (0-5)
 */
export const heartPositionToPlayerIndex = (row: 'top' | 'bottom', position: number): number => {
  if (position < 0 || position >= 3) {
    throw new Error('Position must be between 0 and 2');
  }

  return row === 'top' ? position : position + 3;
};

// File: src/utils/gameUtils.ts
// Add this new function export near the other utility function exports

export const calculateMovement = (card: Card, pile: Pile): number => {
  return isSpecialPlay(card, pile) ? -10 : Math.abs(card.value - pile.currentValue);
};

//Creates foundation piles with proper start values based on settings
 
//Creates foundation piles with proper start values based on settings
export function createFoundationPiles(settings?: { cardMin?: number; cardMax?: number }): Pile[] {
  // If no settings, use DECK.MINDEFAULT and DECK.MAXDEFAULT
  const upStartValue = settings?.cardMin ?? DECK.MINDEFAULT;
  const downStartValue = settings?.cardMax ?? DECK.MAXDEFAULT;

  // Create initial cards for the piles
  const upStartCard = { id: `card-${upStartValue}`, value: upStartValue };
  const downStartCard = { id: `card-${downStartValue}`, value: downStartValue };

  const upPile1: Pile = {
    id: 'up1',
    type: PILE_TYPES.UP,
    cards: [upStartCard],  // Initialize with start card
    startValue: upStartValue,
    currentValue: upStartValue,
    label: 'Ascending 1',
    likeStates: {
      top: DEFAULT_LIKE_STATES,
      bottom: DEFAULT_LIKE_STATES
    }
  };

  const upPile2: Pile = {
    id: 'up2',
    type: PILE_TYPES.UP,
    cards: [upStartCard],  // Initialize with start card
    startValue: upStartValue,
    currentValue: upStartValue,
    label: 'Ascending 2',
    likeStates: {
      top: DEFAULT_LIKE_STATES,
      bottom: DEFAULT_LIKE_STATES
    }
  };

  const downPile1: Pile = {
    id: 'down1',
    type: PILE_TYPES.DOWN,
    cards: [downStartCard],  // Initialize with start card
    startValue: downStartValue,
    currentValue: downStartValue,
    label: 'Descending 1',
    likeStates: {
      top: DEFAULT_LIKE_STATES,
      bottom: DEFAULT_LIKE_STATES
    }
  };

  const downPile2: Pile = {
    id: 'down2',
    type: PILE_TYPES.DOWN,
    cards: [downStartCard],  // Initialize with start card
    startValue: downStartValue,
    currentValue: downStartValue,
    label: 'Descending 2',
    likeStates: {
      top: DEFAULT_LIKE_STATES,
      bottom: DEFAULT_LIKE_STATES
    }
  };

  return [upPile1, upPile2, downPile1, downPile2];
}

export function initializeNewGame(
  gameMode: 'solitaire' | 'multiplayer',
  settings: { 
    cardMin: number; 
    cardMax: number;
    drawPileMin: number;
    drawPileMax: number;
    handSizes: { solitaire: number; twoPlayer: number; multiplayer: number; }
    refreshCardsOnPlay: boolean;
    undoAllowed: boolean;
  },
  players: Player[],
  timestamp: number = Date.now()
): GameState {
  // Create foundation piles with proper settings
  const foundationPiles = createFoundationPiles(settings);
  
  // Create and shuffle deck with proper card range
  const deck = shuffleDeck(createDeck(settings));
  
  // Deal cards based on determined hand size
  const { hands, drawPile } = dealCards(deck, players.length, settings);
  
  // Sort players by join time and assign hands
  const sortedPlayers = [...players].sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0));
  const playersWithHands = sortedPlayers.map((player, index) => ({
      ...player,
      hand: hands[index],
      cardCount: hands[index].length
  }));

  // First player (by join time) starts
  const firstPlayer = playersWithHands[0];

// Convert players array to record
const playersRecord = playersWithHands.reduce<PlayerRecord>((acc, player) => ({
  ...acc,
  [player.uuid]: player
}), {});

return {
  gameId: '',  // Will be set by caller if needed
  gameMode,
  status: gameMode === 'multiplayer' ? 'starting' : 'in_progress',
  players: playersRecord,  
  currentPlayerUuid: firstPlayer.uuid,  
  foundationPiles,
  drawPile,
  cardsPlayedThisTurn: 0,
  minCardsPerTurn: 2,
  turnEnded: false,
  gameOver: false,
  gameWon: false,
  lastUpdate: timestamp,
  settings  // Include settings in the game state

};
}

// Helper Functions
export const getOrderedPlayers = (players: PlayerRecord): Player[] => {
  return Object.values(players)
    .sort((a, b) => {
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      return a.joinedAt - b.joinedAt;
    });
};

export const getNextPlayerUuid = (
  players: PlayerRecord, 
  currentPlayerUuid: string
): string => {
  const orderedPlayers = getOrderedPlayers(players);
  const currentIndex = orderedPlayers.findIndex(p => p.uuid === currentPlayerUuid);
  const nextIndex = (currentIndex + 1) % orderedPlayers.length;
  return orderedPlayers[nextIndex].uuid;
};
export const checkGameOver = (
  gameState: GameState
): { isGameWon: boolean; isGameLost: boolean } => {
  // Check win condition remains the same
  const isGameWon = gameState.drawPile.length === 0 && 
    Object.values(gameState.players).every(player => player.hand.length === 0);

  if (isGameWon) return { isGameWon: true, isGameLost: false };

  // If we've already played enough cards, no need to check for loss
  if (gameState.cardsPlayedThisTurn >= gameState.minCardsPerTurn) {
    return { isGameWon: false, isGameLost: false };
  }

  const currentPlayer = gameState.players[gameState.currentPlayerUuid];
  
  // Add debug logging for each card check
  const validMoveChecks = currentPlayer.hand.map(card => {
    const pileChecks = gameState.foundationPiles.map(pile => {
      const isValid = isValidPlay(card, pile);
      console.log('Checking move:', {
        cardValue: card.value,
        pileId: pile.id,
        pileValue: pile.currentValue,
        isValid
      });
      return isValid;
    });
    return pileChecks.some(isValid => isValid);
  });
  
  const hasValidMoves = validMoveChecks.some(isValid => isValid);
  const canRefreshCards = gameState.settings?.refreshCardsOnPlay && gameState.drawPile.length > 0;
  
  console.log('Game lost check:', {
    cardsPlayedThisTurn: gameState.cardsPlayedThisTurn,
    minCardsPerTurn: gameState.minCardsPerTurn,
    hasValidMoves,
    canRefreshCards,
    settings: gameState.settings,
    isGameLost: !hasValidMoves && !canRefreshCards
  });

  return {
    isGameWon: false,
    isGameLost: !hasValidMoves && !canRefreshCards
  };
};