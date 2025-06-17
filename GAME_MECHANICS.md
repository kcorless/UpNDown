# Up-n-Down Solitaire - Game Mechanics and Implementation Guide

## Game Overview
Up-n-Down Solitaire is a unique card game featuring four foundation piles with special ascending and descending rules. The game emphasizes strategic card placement and planning ahead. It can be played in both solitaire and multiplayer modes (2-8 players).

## Core Game Mechanics

### Foundation Piles
- **Total Piles**: 4 foundation piles
  - 2 Ascending piles (marked with "1↑")
  - 2 Descending piles (marked with "100↓")

### Card Placement Rules

#### Ascending Piles
- Must start with a card value > 1
- Valid plays:
  1. Play a card with a higher value than the top card
  2. Play a card that is exactly 10 less than the top card
  Example: If top card is 23, you can play:
  - Any card > 23
  - Card value 13 (23 - 10)

#### Descending Piles
- Must start with a card value < 100
- Valid plays:
  1. Play a card with a lower value than the top card
  2. Play a card that is exactly 10 more than the top card
  Example: If top card is 35, you can play:
  - Any card < 35
  - Card value 45 (35 + 10)

### Game Flow
1. Player starts with a hand of cards
2. On each turn:
   - Player can play one card to any valid foundation pile
   - After playing, if there are cards in the draw pile, player draws one card (solitaire mode only)
   - Cards in hand are automatically sorted by value
3. Game continues until:
   - All cards are played successfully, or
   - No valid moves are possible (game over)

## Multiplayer Mode

### Setup and Players
- Supports 2-8 players
- Each player gets an equal share of cards
- The draw pile in multiplayer mode is used to replace any played cards from a player at the conclusion of their turn
- Game ID system for match creation and joining

### Turn Mechanics
1. **Turn Order**
   - Players take turns clockwise
   - Each player can see their own hand and the foundation piles
   - Other players' hands are not visible to other players

2. **Turn Structure**
   - Player must play at least two card per turn but can play as many as they choose
   - When the draw pile is empty, each player must only play one card instead of two.  They can still play more than one card if they choose.
   - No drawing of new cards until after the players turn is complete (when they click on "End Turn")
   - Turn ends after:
     * Successfully playing at least two cards
   - Game automatically advances to next player

3. **Valid Moves**
   - Same rules as solitaire for foundation piles
   - Players must play.  If the player whose turn it is to play cannot play, the game is over.
   This means that the game engine must constantly check if the current player has a valid move and if not, the game is over.

### Winning Conditions
1. **Primary Victory**
   - The gmae is over when all players have played all their cards.  There is no individual victory.  Either all players win or no one wins.
   - When the game is won, both players receive a victory message and there is a button to return to the lobby.

2. **Game Over Scenarios**
   - The player whose turn it is to play cannot play
   - No valid moves possible for the current player
   - All cards successfully played (this is the winning condition)

### State Management Differences

#### Game State
```typescript
interface MultiplayerGameState {
  players: {
    id: string;
    name: string;
    hand: Card[];
    cardCount: number;
  }[];
  currentPlayer: number;
  foundationPiles: FoundationPile[];
  turnEnded: boolean;
  cardsPlayedThisTurn: number;
  gameOver: boolean;
}
```

#### Player Management
- Each player has unique ID and display name
- Player state includes:
  * Current hand of cards
  * Card count (visible to other players)
  * Turn status

#### Turn Validation
```typescript
const isPlayerTurn = (gameState: GameState, playerId: string): boolean => {
  return gameState.players[gameState.currentPlayer].id === playerId;
};
```

### Multiplayer Implementation Details

1. **Game Creation**
   - Host creates game and receives game ID
   - Other players join using game ID
   - Game starts when host initiates

2. **State Synchronization**
   - Real-time updates via Firebase
   - Each client maintains local state
   - Server validates moves and broadcasts updates

3. **Error Handling**
   - Player disconnection handling
   - Invalid move prevention
   - Turn timeout management

### Multiplayer Best Practices


### Common Multiplayer Issues

1. **State Synchronization**
   - Problem: Players seeing different game states
   - Solution: Single source of truth via Firebase
   - Regular state validation and sync

2. **Turn Management**
   - Problem: Multiple players acting simultaneously
   - Solution: Server-side turn validation
   - Clear turn indicators in UI

3. **Player Disconnection**
   - Problem: Handling disconnected players
   - Solution: Automatic turn skipping
   - Rejoin mechanism with state recovery

### Testing Multiplayer Scenarios

1. **Basic Multiplayer Flow**
   - Game creation and joining
   - Turn rotation
   - Card playing sequence

2. **Edge Cases**
   - Player disconnection/reconnection
   - Simultaneous move attempts
   - Turn timeout handling

3. **Victory Conditions**
   - First player out
   - All players stuck
   - Complete game playthrough

## Implementation Details

### State Management
- Game state includes:
  - Foundation piles
  - Player's hand
  - Draw pile
  - Game mode (solitaire/multiplayer)
  - Current player
  - Turn status

### Critical Components

#### Move Validation
- `isValidPlay(card, pileCards, targetPile)`: Validates if a card can be played
- Checks for:
  1. Correct pile type (ascending/descending)
  2. Valid card value relative to top card
  3. Special +10/-10 rule compliance

#### Game Over Detection
- Checks performed after each move
- Verifies if any card in hand can be played on any foundation pile
- Must use current game state, not stale state

### Key Implementation Fixes

1. **State Synchronization**
   - Always use updated state when checking for valid moves
   - Create new state object before validation checks
   - Apply state updates atomically

2. **Move Validation Logic**
   - Explicit checks for empty piles
   - Proper handling of ascending/descending rules
   - Clear logging of validation steps

3. **UI/State Consistency**
   - Sort hand cards by value after drawing
   - Update pile displays immediately after moves
   - Clear selected card after successful play

### Debugging Features

#### Console Logging
Important game events are logged with clear headers:
```
=== ATTEMPTING PLAY ===
=== CHECKING GAME OVER ===
### VALID PLAY ###
### INVALID PLAY ###
```

Logged information includes:
- Current hand contents
- Foundation pile states
- Card play attempts
- Move validation results

## Best Practices

1. **State Updates**
   ```typescript
   let newGameState = {
     ...gameState,
     foundationPiles: newPiles,
     players: updatedPlayers,
     // other state updates
   };
   setGameState(newGameState);
   ```

2. **Move Validation**
   ```typescript
   if (isValidPlay(selectedCard, targetPile.cards, targetPile)) {
     // Proceed with move
   } else {
     // Log invalid play details
   }
   ```

3. **Game Over Checks**
   ```typescript
   const canPlay = canMakeAnyMove(currentPlayerHand, newGameState.foundationPiles);
   if (!canPlay) {
     setGameOver(true);
   }
   ```

## Common Issues and Solutions

1. **Stale State References**
   - Problem: Using old state in async operations
   - Solution: Create and use new state object before checks

2. **Move Validation Edge Cases**
   - Problem: Missing special rule checks
   - Solution: Explicit validation for +10/-10 rules

3. **UI/State Sync**
   - Problem: Display not matching internal state
   - Solution: Consistent state updates and immediate UI refresh

## Testing Scenarios

1. **Basic Moves**
   - Playing higher cards on ascending piles
   - Playing lower cards on descending piles

2. **Special Rules**
   - Playing card 10 less on ascending pile
   - Playing card 10 more on descending pile

3. **Edge Cases**
   - Empty pile starts
   - Single card remaining
   - Multiple valid moves available

## Up-n-Down Solitaire Game Documentation

## Overview
Up-n-Down Solitaire is a unique card game that combines traditional solitaire mechanics with innovative foundation pile rules. The game supports both single-player (solitaire) and multiplayer modes (2-8 players).

## Game Modes

### Solitaire Mode
- Single player against the game
- Goal: Place all cards from your hand onto foundation piles
- Game ends when no more valid moves are possible
- Win condition: All cards successfully placed on foundation piles

### Multiplayer Mode
- 2-8 players
- Turn-based gameplay
- Real-time state synchronization
- Players compete to place their cards first
- Win condition: First player to empty their hand

## Game Mechanics

### Foundation Piles
The game features 4 foundation piles with unique placement rules:

#### Ascending Piles (2)
- Start with any card > 1
- Valid placements:
  * Higher than current top card
  * Exactly 10 less than current top card
- Example: On a pile with 85, you can play:
  * Any card > 85
  * 75 (85 - 10)

#### Descending Piles (2)
- Start with any card < 100
- Valid placements:
  * Lower than current top card
  * Exactly 10 more than current top card
- Example: On a pile with 35, you can play:
  * Any card < 35
  * 45 (35 + 10)

### Card Distribution
- Initial deal: Each player receives a hand of cards
- Remaining cards form the draw pile
- Draw pile is only used in solitaire mode

### Turn Structure
1. Player selects a card from their hand
2. Player chooses a valid foundation pile
3. If placement is valid:
   - Card is moved to foundation pile
   - Turn continues (can play multiple cards)
4. If no valid moves:
   - In solitaire: Draw new card if available
   - In multiplayer: Turn passes to next player

## Implementation Details

### State Management
- React hooks for local state
- Firebase Realtime Database for multiplayer synchronization
- Local storage for game persistence
- Comprehensive game state tracking:
  * Player hands
  * Foundation piles
  * Current player
  * Game phase
  * Move history

### Key Components

#### Card Component
- Visual representation of numbered cards
- Interactive hover and selection states
- Displays card value prominently
- Supports drag-and-drop (planned feature)

#### Foundation Pile Component
- Visual feedback for valid/invalid targets
- Stacked card display
- Clear indication of pile type (ascending/descending)
- Shows pile rules on hover

#### Game Layout
- Horizontal arrangement of foundation piles
- Single-row scrollable player hand
- Dedicated draw pile area
- Game controls in header
- Responsive design for various screen sizes

### Game Controls
- Reset Game: Starts new game in current mode
- Quit Game: Returns to mode selection
- Automatic game over detection
- Confirmation dialogs for important actions

### Move Validation
- Comprehensive `isValidPlay` function checks:
  * Card value rules
  * Special +10/-10 rule
  * Pile type compatibility
- Real-time validation feedback
- Prevents invalid moves

### Error Handling
- Graceful error recovery
- Clear error messages
- State consistency checks
- Network error handling for multiplayer

## Technical Stack
- React with TypeScript
- Vite for build tooling
- Firebase for backend services
- CSS Modules for styling
- Local Storage for persistence

## Future Enhancements
1. Drag-and-drop card movement
2. Advanced multiplayer features:
   - Chat system
   - Player rankings
   - Game history
3. Animation improvements
4. Mobile optimization
5. Offline support
6. Achievement system

## Security Considerations
- Player authentication
- Move validation on server
- Rate limiting
- Data encryption
- Session management

## Development Guidelines
1. Maintain type safety with TypeScript
2. Follow React best practices
3. Write clear documentation
4. Include unit tests
5. Consider accessibility
6. Optimize performance

This documentation will be updated as new features are added or game mechanics are modified.
