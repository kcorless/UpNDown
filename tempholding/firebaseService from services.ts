import { ref, set, onValue, get, update, off } from 'firebase/database';
import { database } from '../config/firebase';
import { GameState } from '../types/shared';

export class FirebaseService {
  private static gameRef(gameId: string) {
    return ref(database, `games/${gameId}`);
  }

  static async saveGameState(gameId: string, state: GameState): Promise<void> {
    try {
      await set(this.gameRef(gameId), state);
    } catch (error) {
      console.error('Error saving game state:', error);
      throw error;
    }
  }

  static async loadGameState(gameId: string): Promise<GameState | null> {
    try {
      const snapshot = await get(this.gameRef(gameId));
      return snapshot.val();
    } catch (error) {
      console.error('Error loading game state:', error);
      throw error;
    }
  }

  static subscribeToGameState(
    gameId: string,
    onUpdate: (state: GameState | null) => void
  ): () => void {
    const gameRef = this.gameRef(gameId);
    
    onValue(gameRef, (snapshot) => {
      const state = snapshot.val();
      onUpdate(state);
    });

    return () => off(gameRef);
  }

  static async updateGameState(
    gameId: string,
    updates: Partial<GameState>
  ): Promise<void> {
    try {
      await update(this.gameRef(gameId), updates);
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }
}
