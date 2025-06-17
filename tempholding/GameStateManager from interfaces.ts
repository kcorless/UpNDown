import { GameState } from '../types/shared';

export interface GameStateManager {
    // Core state operations
    saveState(gameId: string, state: GameState): Promise<void>;
    loadState(gameId: string): Promise<GameState | null>;
    subscribeToChanges(gameId: string, callback: (state: GameState) => void): () => void;
    
    // Game session management
    createGame(): Promise<string>; // Returns gameId
    joinGame(gameId: string): Promise<boolean>; // Returns success
    leaveGame(gameId: string): Promise<void>;
    
    // Player management
    setPlayer(gameId: string, playerNumber: number): Promise<void>;
    getPlayer(gameId: string): Promise<number>;
    
    // Cleanup
    clearState(gameId: string): Promise<void>;
    disconnect(): void;
}
