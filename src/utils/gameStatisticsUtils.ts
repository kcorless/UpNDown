// src/utils/gameStatisticsUtils.ts

import type { GameState } from '../types/gameTypes';
import type { GameStatsSummary, PlayerWithStats } from '../types/gameStatisticsTypes';

export const calculateGameStatsSummary = (gameState: GameState): GameStatsSummary => {
  // Convert PlayerRecord to array before mapping
  const players: PlayerWithStats[] = Object.values(gameState.players).map(player => ({
    uuid: player.uuid,  // Changed from id to uuid
    name: player.name,
    stats: player.stats
  }));

  const totalCards = players.reduce(
    (sum, player) => sum + player.stats.totalCardsPlayed,
    0
  );

  const totalSpecialPlays = players.reduce(
    (sum, player) => sum + player.stats.specialPlaysCount,
    0
  );

  const totalMovement = players.reduce(
    (sum, player) => sum + player.stats.totalMovement,
    0
  );

  const averageMovementPerCard = totalCards > 0 ? totalMovement / totalCards : 0;

  return {
    players,
    totalCards,
    totalSpecialPlays,
    totalMovement,
    averageMovementPerCard,
    gameWon: gameState.gameWon
  };
};
