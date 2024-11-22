# Technical Components Inventory

## 1. Database Components
- `database-schema.sql`: Complete SQLite schema definition including tables, indexes, and views
- `database-init.ts`: Database initialization and connection management code
- `database-migrations/`: Directory containing versioned database schema changes
- `data-access-layer/`: TypeScript interfaces and data access methods for each table

## 2. Backend Infrastructure
- `server.ts`: Main Express server setup and configuration
- `websocket-handler.ts`: Socket.io setup and event handling
- `session-manager.ts`: User session management and persistence
- `game-state-manager.ts`: Core game state management and synchronization
- `card-validator.ts`: Game rules and card play validation logic
- `error-handler.ts`: Centralized error handling and logging
- `config.ts`: Server configuration and environment variables
- `types/`: Shared TypeScript interfaces and types
- `utils/`: Utility functions and helpers

## 3. Frontend Components
### Core Components
- `App.tsx`: Main application component and routing
- `GameBoard.tsx`: Main game interface container
- `PlayerHand.tsx`: Player's cards display and interaction
- `CardPile.tsx`: Individual pile display and play area
- `GameControls.tsx`: Game action buttons and controls
- `PlayerList.tsx`: Display of all players and their status
- `ChatInterface.tsx`: Game chat implementation
- `PreferenceIndicator.tsx`: Stack preference UI component

### State Management
- `gameContext.tsx`: Game state context and provider
- `gameReducer.ts`: Game state management reducer
- `actionCreators.ts`: Typed action creators for game state
- `socketContext.tsx`: WebSocket connection context and provider

### Utilities
- `apiClient.ts`: API interaction utilities
- `gameUtils.ts`: Game-specific helper functions
- `validators.ts`: Client-side validation functions
- `types.ts`: Frontend type definitions

## 4. API Endpoints
- `routes/game.ts`: Game creation and management endpoints
- `routes/player.ts`: Player management endpoints
- `routes/state.ts`: Game state endpoints
- `routes/chat.ts`: Chat message endpoints
- `middleware/`: Custom middleware for request handling

## 5. Testing
- `tests/unit/`: Unit tests for game logic
- `tests/integration/`: Integration tests for API endpoints
- `tests/e2e/`: End-to-end tests for complete game flows
- `test-utils/`: Testing utilities and helpers

## 6. Build and Deployment
- `webpack.config.js`: Frontend build configuration
- `tsconfig.json`: TypeScript configuration
- `package.json`: Project dependencies and scripts
- `dockerfile`: Container definition (optional)
- `.env.example`: Example environment variables
- `.gitignore`: Git ignore rules

## 7. Documentation

### Infrastructure Setup Document
- `BACKEND_SETUP.md`: Comprehensive guide for setting up the MacOS backend server, including Node.js installation, database setup, environment configuration, and server deployment steps.

### Client Setup Document
- `CLIENT_SETUP.md`: Instructions for accessing and using the game client, including browser requirements, URL access, creating a user ID, and basic gameplay instructions.

## 8. Infrastructure Scripts
- `scripts/install-dependencies.sh`: Script to install all required MacOS dependencies
- `scripts/init-database.sh`: Database initialization script
- `scripts/start-server.sh`: Server startup script with environment checks
- `scripts/backup-database.sh`: Database backup utility
- `scripts/health-check.sh`: Server health monitoring script

## 9. Monitoring and Maintenance
- `logger.ts`: Logging configuration and utilities
- `metrics.ts`: Basic game metrics collection
- `maintenance.ts`: Database cleanup and maintenance utilities

Each component above represents a discrete unit of functionality that needs to be implemented. The components are organized to maintain separation of concerns while ensuring all game requirements are met through their combined functionality.
