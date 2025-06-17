export interface PlayerGameStats {
  totalCardsPlayed: number;
  specialPlaysCount: number;
  totalMovement: number;
  averageMovementPerCard?: number;  // Calculated field
}

export interface PlayerWithStats {
  uuid: string;  // Changed from id to uuid to match Player type
  name: string;
  stats: PlayerGameStats;
}

export interface GameStatsSummary {
  players: PlayerWithStats[];
  totalCards: number;
  totalSpecialPlays: number;
  totalMovement: number;
  averageMovementPerCard: number;
  gameWon: boolean;
}
