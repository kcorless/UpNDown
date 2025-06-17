# Up-N-Down Card Game Project Overview

## Project Structure

/src
├── adapters/           # Data adapters for external services
├── components/         # React components
│   ├── card/          # Card-related components
│   ├── game/          # Game-related components
│   ├── howto/         # Tutorial and help components
│   ├── modal/         # Modal dialog components
│   ├── pile/          # Card pile components
│   └── settings/      # Game settings components
├── config/            # Configuration files
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── interfaces/        # TypeScript interfaces
├── services/          # Backend services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions

## Key Components

### Core Game Components
- [App.tsx](cci:7://file:///Users/kcorless/UpNDown/src/App.tsx:0:0-0:0): Main application component, handles routing and game mode selection
- [MultiplayerGame.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/game/MultiplayerGame.tsx:0:0-0:0): Manages multiplayer game logic and UI
- `SolitaireGame.tsx`: Manages single-player game logic and UI
- [Card.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/Card.tsx:0:0-0:0): Renders individual cards with drag-and-drop functionality
- [CardPile.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/CardPile.tsx:0:0-0:0): Manages foundation piles and card stacks

### Game Setup & Management
- [GameSetup.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/GameSetup.tsx:0:0-0:0): Initial game setup and configuration
- [GameLobby.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/GameLobby.tsx:0:0-0:0): Multiplayer lobby management
- [MultiplayerSetup.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/MultiplayerSetup.tsx:0:0-0:0): Multiplayer game configuration
- [GameStatistics.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/GameStatistics.tsx:0:0-0:0): Displays game statistics and scores

### UI Components
- `Modal/`: Reusable modal dialogs
- `ErrorBoundary/`: Error handling components
- `DeckCounter/`: Shows remaining cards in deck

## Context Providers
- `GameStateContext`: Manages core game state
- `MultiplayerContext`: Handles multiplayer state
- `SettingsContext`: Manages game settings
- `UIContext`: Controls UI state
- `GameFlowContext`: Manages game flow and turns

## Services
- `lobbyService.ts`: Firebase integration for multiplayer
- `gameService.ts`: Core game logic and rules

## Data Flow

### Solitaire Game Flow
1. [App.tsx](cci:7://file:///Users/kcorless/UpNDown/src/App.tsx:0:0-0:0) → Initializes game contexts
2. User selects single-player mode
3. `SolitaireGame.tsx` → Manages game state locally
4. Game state updates flow through `GameStateContext`
5. UI components react to state changes

### Multiplayer Game Flow
1. [App.tsx](cci:7://file:///Users/kcorless/UpNDown/src/App.tsx:0:0-0:0) → Initializes game contexts
2. User creates/joins multiplayer game
3. [GameLobby.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/GameLobby.tsx:0:0-0:0) → Manages player connections
4. [MultiplayerGame.tsx](cci:7://file:///Users/kcorless/UpNDown/src/components/game/MultiplayerGame.tsx:0:0-0:0) → Syncs with Firebase
5. State changes:
   - Local changes → Firebase → Other players
   - Remote changes → Firebase → Local state
6. UI updates through context providers

## Key Features
- Real-time multiplayer synchronization
- Drag-and-drop card movement
- Game state persistence
- Player turn management
- Foundation pile validation
- Game statistics tracking

## Technical Stack
- React (Hooks & Context)
- TypeScript
- Firebase Realtime Database
- CSS Modules