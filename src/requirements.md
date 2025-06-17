# The Game - Requirements Specification

## 1. Game Overview
A cooperative multiplayer card game where players work together to play all their cards on four different piles. Players must communicate and strategize to succeed, as all players either win or lose together.

## 2. Game Rules

### 2.1 Basic Setup
- 2-6 players required except for solitaire mode, which is 1 player
- One deck of draw cards numbered 2-99 (but the starting and ending values are stored as variables so they can be changed)
- Four card piles:
  - Two ascending piles (starting at 1 (or one less than the minimum card value))
  - Two descending piles (starting at 100 (or one more than the maximum draw card value))
- Each player starts with 7 cards (2 player game) or 6 cards (3-8 player game) or 10 cards (solitaire game).  These starting number of cards are stored in a variable so they can be changed.
- Remaining cards form the draw pile
- user settings are available that allow to change some game parameters such as hand size, draw pile size, and card range


### 2.2 Gameplay Mechanics
- Players must play minimum 2 cards per turn as long as draw pile is not empty.  In solitaire mode, there are no turns - it is continuous play
- Special play rules:
  - Ascending piles: Can play a card exactly 10 lower than current top card
  - Descending piles: Can play a card exactly 10 higher than current top card
- Players draw back up to full hand size after their turn (until draw pile is exhausted)
- No time limit for turns
- when a player ends their turn, they receive replacement cards for the cards they played from the draw pile
- if there are no cards left in the draw pile, we have reached the final stage.  During the final stage, players may play only a single card (but are allowed to play more)
- players can undo the last card played if undo is enabled in settings
- In multiplayer mode,When a player runs out of cards, their turn is skipped, and the game continues with the next player who has cards


### 2.3 Win/Loss Conditions
- Win: All players successfully play all their cards
- Loss: The player whose turn it is cannot make a legal play on their turn

### 2.4 Player Communication 
- In-game chat system (future)
- Foundation pile like/reallylike/llove preference system:
  - Players can "like", "really like"or "love" piles only when not their turn
  - Purely communicative (no mechanical effect)
  - Signals to other players that they have beneficial cards for that pile
  - when a player's turn starts any like/reallylike/love preferences are reset

## 3. Technical Requirements

### 3.1 Platform & Architecture
- Web-based application
- Frontend: React with TypeScript
- Backend: Node.js
- Database: Firebase

### 3.2 User Management
- No formal registration required
- Players create/use a persistent UserID
- UserID is a UUID that persists across browser sessions (localStorage)
- No authentication system required (private deployment)

### 3.3 Game Session Management
- 6-character unique game ID for each game
- The host decided when to start the game
- only the settings of the host player apply to the game
- Game host can trigger game start

### 3.4 Disconnection Handling
- Game state saves automatically
- Game state persists until explicitly abandoned by game initiator
- Chat history preserved during disconnections (future)
- Players see missed chat messages upon reconnection (future)

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
- Chat history must be preserved (future)
- Game states must be maintained until explicitly abandoned

### 3.7 Real-time Features
- Immediate updates for:
  - Card plays
  - Chat messages (future)
  - Foundation pile like/reallylike/love preferences
  - Game state changes


### 3.8 Game Statistics
- For each player, the game will track the following statistics (as well as in aggregate across all players)
- Cards played
- absolute value of the movement in value of the foundation pile for each card played
- NUmber of special plays (-10 or +10 cards)
- Average movement of foundation pile per card played


TO DO LIST
-fixes
  get like/reallylike/love working
  settings not applying to current game.
- use separate firebase for dev and prod
-add game ID to the UI
-add turn sequence to UI
-get rid of firebase use for solitaire or clean it up at end
-allow join mid-game (Nooooo!)
-patterned cards
-player names/sign in with google
-only start game if registered
-special play visuals
-peak at other hands (in preferences too)
-interactive chat
-allow kick of inactive player

