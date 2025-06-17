import React from 'react';
import { type GameStatsSummary, type PlayerWithStats } from '../types/gameStatisticsTypes';

interface GameStatisticsProps {
  stats: GameStatsSummary;
  className?: string;
  gameMode: 'solitaire' | 'multiplayer';  // Add gameMode prop
}

const calculateAverageMovement = (player: PlayerWithStats): number => {
  return player.stats.totalCardsPlayed > 0
    ? player.stats.totalMovement / player.stats.totalCardsPlayed
    : 0;
};

export const GameStatistics: React.FC<GameStatisticsProps> = ({ stats, className = '', gameMode }) => {
  return (
    <div className={`w-full max-w-4xl rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <h2 className={`text-2xl font-bold ${
          stats.gameWon ? 'text-green-600' : 'text-red-600'
        }`}>
          Game {stats.gameWon ? 'Victory' : 'Over'} Statistics
        </h2>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 px-4 text-left font-semibold">Player</th>
                <th className="py-2 px-4 text-right font-semibold">Cards Played</th>
                <th className="py-2 px-4 text-right font-semibold">Special Plays</th>
                <th className="py-2 px-4 text-right font-semibold">Total Movement</th>
                <th className="py-2 px-4 text-right font-semibold">Avg Movement/Card</th>
              </tr>
            </thead>
            <tbody>
              {stats.players.map((player) => (
                <tr key={player.uuid} className="border-b border-gray-100">
                  <td className="py-2 px-4 font-medium">{player.name}</td>
                  <td className="py-2 px-4 text-right">{player.stats.totalCardsPlayed}</td>
                  <td className="py-2 px-4 text-right">{player.stats.specialPlaysCount}</td>
                  <td className="py-2 px-4 text-right">{player.stats.totalMovement}</td>
                  <td className="py-2 px-4 text-right">
                    {calculateAverageMovement(player).toFixed(1)}
                  </td>
                </tr>
              ))}
              {gameMode === 'multiplayer' && stats.players.length > 1 && (
                <tr key="team-total" className="font-bold bg-gray-50">
                  <td className="py-2 px-4">Team Total</td>
                  <td className="py-2 px-4 text-right">{stats.totalCards}</td>
                  <td className="py-2 px-4 text-right">{stats.totalSpecialPlays}</td>
                  <td className="py-2 px-4 text-right">{stats.totalMovement}</td>
                  <td className="py-2 px-4 text-right">
                    {stats.averageMovementPerCard.toFixed(1)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};