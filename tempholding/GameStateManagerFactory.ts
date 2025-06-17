import { type GameStateManager } from '../utils/gameStateManager';
import { FirebaseGameStateManager } from '../adapters/FirebaseGameStateManager';

type GameMode = 'solitaire' | 'multiplayer';

export class GameStateManagerFactory {
  static create(mode: GameMode): GameStateManager {
    switch (mode) {
      case 'multiplayer':
        return new FirebaseGameStateManager();
      default:
        throw new Error(`Unsupported game mode: ${mode}`);
    }
  }
}
