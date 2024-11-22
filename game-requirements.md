# The Game - Requirements Specification

## 1. Game Overview
A cooperative multiplayer card game where players work together to play all their cards on four different piles. Players must communicate and strategize to succeed, as all players either win or lose together.

## 2. Game Rules

### 2.1 Basic Setup
- 2-5 players required
- Two decks of cards numbered 1-100
- Four card piles:
  - Two ascending piles (starting at 1)
  - Two descending piles (starting at 100)
- Each player starts with 7 cards
- Remaining cards form the draw pile

### 2.2 Gameplay Mechanics
- Players must play minimum 2 cards per turn
- Exception: When draw pile is empty, players can play one or more cards
- Special play rules:
  - Ascending piles: Can play a card exactly 10 lower than current top card
  - Descending piles: Can play a card exactly 5 higher than current top card
- Players draw back up to 7 cards after their turn (until draw pile is exhausted)
- No time limit for turns

### 2.3 Win/Loss Conditions
- Win: All players successfully play all their cards
- Loss: Any player cannot make a legal play on their turn
- When a player runs out of cards, their turn is skipped

### 2.4 Player Communication
- In-game chat system
- Stack preference system:
  - Players can "like" or "love" piles when not their turn
  - Purely communicative (no mechanical effect)
  - Signals to other players that they have beneficial cards for that pile

## 3. Technical Requirements

### 3.1 Platform & Architecture
- Web-based application
- Frontend: React with TypeScript
- Backend: Node.js
- Database: SQLite
- Real-time communication: WebSocket (Socket.io)

### 3.2 User Management
- No formal registration required
- Players create/use a persistent UserID
- UserID persists across browser sessions (localStorage)
- No authentication system required (private deployment)

### 3.3 Game Session Management
- 4-character unique game ID for each game
- All players must be present to start game
- New players can join mid-game with game initiator approval
- Game initiator can trigger game start
- New players joining mid-game receive 7 cards from draw pile

### 3.4 Disconnection Handling
- Game state saves automatically
- Game shows "suspended" status after 30 seconds of player disconnection
- Players can reconnect to suspended games
- Game state persists until explicitly abandoned by game initiator
- Chat history preserved during disconnections
- Players see missed chat messages upon reconnection

### 3.5 User Interface Requirements
- Desktop-focused design (mobile support planned for future)
- Ascending piles: Light green background
- Descending piles: Light red background
- Visual displays:
  - Player's own cards
  - Number of cards in other players' hands (not content)
  - Current game state
  - Chat interface
  - Stack preference indicators
  - Turn indicator
  - Draw pile count
  - Game status

### 3.6 Data Persistence Requirements
- Game state must be saveable/restorable
- Chat history must be preserved
- Player sessions must persist across browser restarts
- Game states must be maintained until explicitly abandoned

### 3.7 Real-time Features
- Immediate updates for:
  - Card plays
  - Chat messages
  - Stack preferences
  - Player connections/disconnections
  - Game state changes

### 3.8 Future Considerations
- Mobile device support
- Card movement animations
- Sound effects
- Automatic cleanup of abandoned games

## 4. Development Scope Exclusions
- No lobby system
- No player kick functionality
- No spectator mode
- No sound effects
- No animations (initial version)
- No public deployment
- No user authentication system
- No time limits on turns

## 5. Technical Notes

### 5.1 Data Structures Needed
- Game state
- Player information
- Card information
- Chat messages
- Stack preferences
- Session information

### 5.2 Required APIs
- Game creation/joining
- Game state management
- Card play validation
- Chat system
- Player preference system
- Session management
- Reconnection handling

### 5.3 Real-time Events
- Card plays
- Chat messages
- Player connections/disconnections
- Game state updates
- Stack preference changes
- Turn changes
- Game completion events

This document serves as the primary reference for both gameplay rules and technical implementation requirements. All features and functionalities should be developed according to these specifications unless explicitly modified through change requests.
