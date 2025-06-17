import { database } from '../config/firebase';
import { 
    ref, 
    set, 
    get, 
    onValue, 
    off,
    update,
    runTransaction
} from 'firebase/database';
import { 
    type GameState,
    type Player,
    type PlayerRecord,
    type GameLobby,
    type LobbyStatus,
    type Pile,
    DEFAULT_LIKE_STATES
} from '../types/gameTypes';
import { createFoundationPiles, initializeNewGame, getNextPlayerUuid } from '../utils/gameUtils';
import { getGameStorage, storeActiveGame } from '../utils/gameStorage';

const LOBBY_PATH = 'lobbies';
const MAX_PLAYERS = 6;

export const getLobbyData = async (gameId: string): Promise<GameLobby | null> => {
    try {
        console.log('Getting lobby data for game:', gameId);
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        const snapshot = await get(lobbyRef);
        
        if (!snapshot.exists()) {
            console.log('No lobby found with ID:', gameId);
            return null;
        }
        
        const lobbyData = snapshot.val() as GameLobby;
        console.log('Retrieved lobby full data:', {
            id: lobbyData.id,
            playerCount: Object.keys(lobbyData.players || {}).length,
            status: lobbyData.status,
            lobbyData
        });
        
        return lobbyData;
    } catch (error) {
        console.error('Error getting lobby data:', error);
        throw error;
    }
};

export const generateGameId = (): string => {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const createLobby = async (
    hostUuid: string, 
    hostName: string,
    settings: { 
      cardMin: number; 
      cardMax: number;
      drawPileMin: number;
      drawPileMax: number;
      handSizes: {
        solitaire: number;
        twoPlayer: number;
        multiplayer: number;
      };
      refreshCardsOnPlay: boolean;
      undoAllowed: boolean;
    }
): Promise<string> => {
    try {
        // Get settings from localStorage
        const storage = getGameStorage();
        const currentSettings = storage?.settings || settings;

        if (!currentSettings || 
            typeof currentSettings.cardMin !== 'number' || 
            typeof currentSettings.cardMax !== 'number' ||
            typeof currentSettings.drawPileMin !== 'number' ||
            typeof currentSettings.drawPileMax !== 'number' ||
            !currentSettings.handSizes ||
            typeof currentSettings.handSizes.solitaire !== 'number' ||
            typeof currentSettings.handSizes.twoPlayer !== 'number' ||
            typeof currentSettings.handSizes.multiplayer !== 'number' ||
            typeof currentSettings.refreshCardsOnPlay !== 'boolean' ||
            typeof currentSettings.undoAllowed !== 'boolean') {
            throw new Error('Invalid settings provided');
        }

        console.log('Creating lobby with settings:', {
            hostUuid,
            hostName,
            settings: currentSettings,
            timestamp: new Date().toISOString()
        });
        const gameId = generateGameId();
        // Try to copy to clipboard, but don't block on failure
        try {
            await navigator.clipboard.writeText(gameId);
        } catch (clipboardError) {
            console.error('Failed to copy game ID to clipboard:', clipboardError);
            // Continue with lobby creation even if clipboard fails
        }

        const hostPlayer: Player = {
            uuid: hostUuid,
            name: hostName || 'Host',
            isReady: false,
            isHost: true,
            joinedAt: Date.now(),
            cardCount: 0,
            hand: [],
            stats: {
                totalCardsPlayed: 0,
                specialPlaysCount: 0,
                totalMovement: 0
            }
        };

        // Create foundation piles using settings from localStorage
        console.log('Creating foundation piles with settings:', currentSettings);
        const foundationPiles = createFoundationPiles(currentSettings);

        const lobby: GameLobby = {
            id: gameId,
            host: hostUuid,
            players: {
                [hostUuid]: hostPlayer
            },
            status: 'waiting',
            maxPlayers: MAX_PLAYERS,
            createdAt: Date.now(),
            foundationPiles,
            settings: currentSettings  // Use settings from localStorage
        };

        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        await set(lobbyRef, lobby);
        
        console.log('Created lobby:', gameId);
        return gameId;
    } catch (error) {
        console.error('Error creating lobby:', error);
        throw error;
    }
};


export const joinLobby = async (gameId: string, playerUuid: string, playerName: string): Promise<void> => {
    try {
        console.log('Attempting to join lobby:', { gameId, playerUuid, playerName });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        const snapshot = await get(lobbyRef);
        if (!snapshot.exists()) {
            throw new Error(`Game not found: ${gameId}`);
        }

        const currentData = snapshot.val() as GameLobby;

        // Block join if game in progress
        if (currentData.status === 'in_progress') {
            throw new Error('This game has already started. Please create a new game or join a different one.');
        }
        
        // Existing player check
        if (currentData.players[playerUuid]) {
            console.log('Player already in lobby, updating name if changed');
            if (currentData.players[playerUuid].name !== playerName) {
                await update(ref(database, `${LOBBY_PATH}/${gameId}/players/${playerUuid}`), {
                    name: playerName
                });
            }
            return;
        }

        const currentPlayerCount = Object.keys(currentData.players).length;
        console.log('Current player count before joining:', currentPlayerCount);
        
        if (currentPlayerCount >= MAX_PLAYERS) {
            throw new Error('Game is full');
        }

        const newPlayer: Player = {
            uuid: playerUuid,
            name: playerName,
            isReady: false,
            isHost: false,
            joinedAt: Date.now(),
            cardCount: 0,
            hand: [],
            stats: {
                totalCardsPlayed: 0,
                specialPlaysCount: 0,
                totalMovement: 0
            }
        };

        // Use set instead of update to ensure the new player is added
        await set(ref(database, `${LOBBY_PATH}/${gameId}/players/${playerUuid}`), newPlayer);
        
        console.log('Successfully added player to lobby:', {
            newPlayer,
            updatedPlayerCount: Object.keys(currentData.players).length + 1
        });

        // Verify the update
        const updatedSnapshot = await get(lobbyRef);
        console.log('Updated lobby players:', {
            players: updatedSnapshot.val()?.players ? Object.keys(updatedSnapshot.val().players) : 'No players'
        });

        storeActiveGame({
            gameId,
            playerUuid,
            playerName,
            isHost: false
        });

    } catch (error) {
        console.error('Error joining lobby:', error);
        throw error;
    }
};

export const updateLobbyStatus = async (gameId: string, status: LobbyStatus): Promise<void> => {
    try {
        console.log('Updating lobby status:', { gameId, status });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        await runTransaction(lobbyRef, async (currentData: GameLobby | null) => {
            if (!currentData) {
                throw new Error('Game not found');
            }
            
            return {
                ...currentData,
                status,
                lastUpdate: Date.now()
            };
        });
    } catch (error) {
        console.error('Error updating lobby status:', error);
        throw error;
    }
};

export const startGame = async (gameId: string, gameState: GameState): Promise<void> => {
    try {
        console.log('Starting game with initial state:', {
            gameId,
            foundationPiles: gameState.foundationPiles?.map(p => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardCount: p.cards?.length
            })),
            settings: gameState.settings
        });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        // Convert players array to record structure for Firebase
        const normalizedPlayers = Object.entries(gameState.players).reduce<PlayerRecord>((acc, [uuid, player]) => ({
            ...acc,
            [uuid]: player
        }), {});
        
        // Ensure currentPlayerUuid is set
        if (!gameState.currentPlayerUuid) {
            throw new Error('currentPlayerUuid must be set before starting game');
        }

        // Create complete game state with all required fields
        const updatedGameState: GameState = {
            ...gameState,                     // Preserve all existing fields
            gameId,                          // Update/ensure required fields
            gameMode: gameState.gameMode,
            players: normalizedPlayers,
            currentPlayerUuid: gameState.currentPlayerUuid,
            foundationPiles: gameState.foundationPiles,
            drawPile: gameState.drawPile || [],
            cardsPlayedThisTurn: 0,
            settings: gameState.settings,
            status: 'in_progress' as const,
            gameOver: false,
            gameWon: false,
            lastUpdate: Date.now()
        };

        console.log('Starting game with complete state:', {
            gameId,
            currentPlayerUuid: updatedGameState.currentPlayerUuid,
            playerCount: Object.keys(normalizedPlayers).length,
            foundationPilesCount: updatedGameState.foundationPiles?.length,
            drawPileCount: updatedGameState.drawPile?.length
        });

        // Store full game state
        await set(lobbyRef, updatedGameState);
    } catch (error) {
        console.error('Error starting game:', error);
        throw error;
    }
};

export const updateGameInFirebase = async (gameId: string, gameState: Partial<GameState>): Promise<void> => {
    try {
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        console.log('Updating game in Firebase:', {
            gameId,
            foundationPiles: gameState.foundationPiles?.map(p => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardCount: p.cards?.length
            }))
        });

        // Ensure players maintain their record structure
        const playersRecord = gameState.players && !Array.isArray(gameState.players) ? 
            Object.entries(gameState.players).reduce<PlayerRecord>((acc, [uuid, player]) => ({
                ...acc,
                [uuid]: {
                    ...player,
                    uuid,  // Ensure UUID is included
                    hand: player.hand || [],  // Ensure hand exists
                    stats: player.stats || {
                        totalCardsPlayed: 0,
                        specialPlaysCount: 0,
                        totalMovement: 0
                    }
                }
            }), {}) : 
            {};

        // Update game state
        const updates = {
            ...(gameState.gameMode && { gameMode: gameState.gameMode }),
            ...(gameState.status && { status: gameState.status }),
            players: playersRecord,  // Always use the record structure
            ...(gameState.currentPlayerUuid && { currentPlayerUuid: gameState.currentPlayerUuid }),
            ...(gameState.foundationPiles && { foundationPiles: gameState.foundationPiles }),
            ...(gameState.drawPile && { drawPile: gameState.drawPile }),
            ...(typeof gameState.cardsPlayedThisTurn === 'number' && { cardsPlayedThisTurn: gameState.cardsPlayedThisTurn }),
            ...(gameState.settings && { settings: gameState.settings }),
            ...(typeof gameState.gameOver === 'boolean' && { gameOver: gameState.gameOver }),
            ...(typeof gameState.gameWon === 'boolean' && { gameWon: gameState.gameWon }),
            lastUpdate: Date.now()
        };

        console.log('Firebase update object:', {
            gameId,
            hasFoundationPiles: !!updates.foundationPiles,
            foundationPilesCount: updates.foundationPiles?.length,
            foundationPiles: updates.foundationPiles?.map(p => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardCount: p.cards?.length
            }))
        });

        // Update game state
        await update(lobbyRef, updates);
    } catch (error) {
        console.error('Error updating game in Firebase:', error);
        throw error;
    }
};

export const endTurn = async (gameId: string, currentPlayerUuid: string): Promise<void> => {
    try {
        console.log('Starting endTurn with params:', { gameId, currentPlayerUuid });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        await runTransaction(lobbyRef, (currentData: GameState | null) => {
            if (!currentData) {
                console.error('Game not found at path:', `${LOBBY_PATH}/${gameId}`);
                throw new Error('Game not found');
            }

            // Convert players to PlayerRecord type if needed
            const playersRecord = currentData.players;

            console.log('Turn transition details:', {
                players: Object.entries(playersRecord).map(([id, player]) => ({
                    id,
                    handSize: player.hand?.length ?? 0
                })),
                currentPlayerUuid
            });

            const nextPlayerUuid = getNextPlayerUuid(playersRecord, currentPlayerUuid);
            console.log('Next player:', { currentPlayerUuid, nextPlayerUuid });

            // Reset like states for the current player
            const updatedPiles = (currentData.foundationPiles ?? []).map((pile: Partial<Pile>) => ({
                ...(pile as Pile),
                cards: Array.isArray(pile.cards) ? pile.cards : [],
                likeStates: pile.likeStates || { 
                    top: DEFAULT_LIKE_STATES, 
                    bottom: DEFAULT_LIKE_STATES 
                }
            }));

            const updates = {
                currentPlayerUuid: nextPlayerUuid,
                cardsPlayedThisTurn: 0,
                turnEnded: false,
                foundationPiles: updatedPiles,
                lastUpdate: Date.now()
            };

            return {
                ...currentData,
                ...updates
            };
        });
    } catch (error) {
        console.error('Error ending turn:', error);
        throw error;
    }
};

export const leaveLobby = async (gameId: string, playerUuid: string): Promise<void> => {
    try {
        console.log('Player leaving lobby:', { gameId, playerUuid });
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        await runTransaction(lobbyRef, (currentData: GameLobby | null) => {
            if (!currentData) {
                console.log('No lobby found to leave');
                return null;
            }
            const { [playerUuid]: removedPlayer, ...remainingPlayers } = currentData.players;
            
            if (Object.keys(remainingPlayers).length === 0) {
                console.log('No players left, removing lobby');
                return null;
            }

            if (removedPlayer?.isHost) {
                const newHostId = Object.keys(remainingPlayers)[0];
                remainingPlayers[newHostId].isHost = true;
                currentData.host = newHostId;
            }

            currentData.players = remainingPlayers;
            currentData.lastUpdate = Date.now();
            return currentData;
        });

        console.log('Successfully processed player leaving lobby');

    } catch (error) {
        console.error('Error leaving lobby:', error);
        throw error;
    }
};


export const initializeGameState = (
    gameId: string,
    gameMode: 'solitaire' | 'multiplayer',
    players: Player[],
    settings?: { 
        cardMin: number; 
        cardMax: number;
        drawPileMin: number;
        drawPileMax: number;
        handSizes: {
            solitaire: number;
            twoPlayer: number;
            multiplayer: number;
        };
        refreshCardsOnPlay: boolean;
        undoAllowed: boolean;
    }
): GameState => {
    if (!settings) {
        throw new Error('Settings are required for game initialization');
    }

    // Use initializeNewGame from gameUtils to handle all game setup
    const gameState = initializeNewGame(
        gameMode,
        settings,
        players
    );

    // Add the gameId to the state
    return {
        ...gameState,
        gameId
    };
};

export const prepareGameStart = async (gameId: string): Promise<GameState> => {
    try {
        const lobbyData = await getLobbyData(gameId);
        if (!lobbyData) {
            throw new Error('No lobby found');
        }

        // Convert players object to array and sort by joinedAt timestamp
        const players = Object.entries(lobbyData.players)
            .map(([uuid, player]) => ({
                ...player,
                uuid,
                hand: [],
                cardCount: 0
            }))
            .sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0)); // Sort by joinedAt timestamp

        console.log('Preparing game start with sorted players:', 
            players.map(p => ({ uuid: p.uuid, name: p.name, joinedAt: p.joinedAt }))
        );

        // Initialize game state with sorted players
        const gameState = initializeNewGame(
            'multiplayer',
            lobbyData.settings,
            players,
            Date.now()
        );

        console.log('Game state after initialization:', {
            gameId: gameState.gameId,
            playerCount: Object.keys(gameState.players).length,
            foundationPiles: gameState.foundationPiles?.map(p => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardCount: p.cards?.length
            })),
            drawPileCount: gameState.drawPile?.length,
            settings: gameState.settings
        });

        return gameState;
    } catch (error) {
        console.error('Failed to prepare game start:', error);
        throw error;
    }
};

export const subscribeLobby = (gameId: string, callback: (lobby: GameLobby | null) => void): (() => void) => {
    console.log('Setting up lobby subscription:', gameId);
    const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
    
    const onLobbyUpdate = (snapshot: any) => {
        const data = snapshot.val();
        if (!data) {
            console.log('No data received from Firebase');
            callback(null);
            return;
        }

        console.log('Raw Firebase data received:', {
            playersExist: !!data.players,
            playerFormat: typeof data.players,
            playerKeys: Object.keys(data.players || {}),
            foundationPilesExist: !!data.foundationPiles,
            foundationPileCount: (data.foundationPiles || []).length
        });

        // Convert Firebase data to GameLobby format
        const { players: rawPlayers, ...restData } = data;
        const lobby: GameLobby = {
            ...restData,
            players: Object.entries(rawPlayers || {}).reduce((acc, [uuid, playerData]) => ({
                ...acc,
                [uuid]: {
                    ...(playerData as any),
                    uuid, // Ensure UUID is set correctly
                    hand: (playerData as any).hand || [],
                    isHost: (playerData as any).isHost || false,
                    isReady: (playerData as any).isReady || false,
                    joinedAt: (playerData as any).joinedAt || Date.now(),
                    cardCount: (playerData as any).cardCount || 0,
                    stats: (playerData as any).stats || { 
                        specialPlaysCount: 0, 
                        totalCardsPlayed: 0, 
                        totalMovement: 0 
                    }
                }
            }), {}),
            foundationPiles: (data.foundationPiles || []).map((pile: Partial<Pile>) => ({
                ...(pile as Pile),
                cards: Array.isArray(pile.cards) ? pile.cards : [],
                likeStates: pile.likeStates || { 
                    top: DEFAULT_LIKE_STATES, 
                    bottom: DEFAULT_LIKE_STATES 
                }
            })),
            drawPile: data.drawPile || [],
            cardsPlayedThisTurn: data.cardsPlayedThisTurn || 0,
            status: data.status || 'waiting',
            lastUpdate: data.lastUpdate || Date.now()
        };

        console.log('Foundation piles after data conversion:', {
            piles: (lobby.foundationPiles || []).map(p => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardsCount: p.cards.length
            }))
        });

        console.log('Received Firebase update:', {
            path: `${LOBBY_PATH}/${gameId}`,
            foundationPiles: (lobby.foundationPiles || []).map((p: Pile) => ({
                id: p.id,
                type: p.type,
                currentValue: p.currentValue,
                cardsCount: p.cards?.length || 0
            })),
            currentPlayerUuid: lobby.currentPlayerUuid,  // Fixed
            players: Array.isArray(lobby.players) ? lobby.players.map(p => ({ uuid: p.uuid, name: p.name })) : [],
            cardsPlayedThisTurn: lobby.cardsPlayedThisTurn,
            status: lobby.status,
            lastUpdate: lobby.lastUpdate ? new Date(lobby.lastUpdate).toISOString() : new Date().toISOString()
        });

        callback(lobby);
    };

    onValue(lobbyRef, onLobbyUpdate);

    return () => {
        console.log('Cleaning up lobby subscription');
        off(lobbyRef, 'value', onLobbyUpdate);
    };
};

// In lobbyService.ts
export const resetGame = async (gameId: string): Promise<void> => {
    try {
        console.log('Resetting game:', gameId);
        const lobbyRef = ref(database, `${LOBBY_PATH}/${gameId}`);
        
        // First get current lobby data
        const snapshot = await get(lobbyRef);
        if (!snapshot.exists()) {
            console.error('No lobby found to reset');
            return;
        }

        // Remove the lobby entirely
        await set(lobbyRef, null);
        console.log('Game reset complete:', gameId);

    } catch (error) {
        console.error('Error resetting game:', error);
        throw error;
    }
};