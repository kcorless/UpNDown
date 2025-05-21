// src/components/Pile.tsx
import React from 'react';
import { useGame } from '../contexts/GameContext'; // Adjusted path
import { Heart } from 'lucide-react';
import { Auth } from 'aws-amplify'; // Added Auth import

interface PileProps {
  value: number;
  isAscending: boolean;
  pileIndex: number;
}

const Pile: React.FC<PileProps> = ({ value, isAscending, pileIndex }) => {
  const { game, setStackPreference, removeStackPreference } = useGame();
  
  // Ensure game, game.players, game.currentPlayerIndex, and Auth.user are defined before access
  const currentUser = Auth.user?.username; // Get current user's username
  const isCurrentPlayerTurn = game && game.players && typeof game.currentPlayerIndex === 'number' && game.players[game.currentPlayerIndex]
    ? game.players[game.currentPlayerIndex].id === currentUser
    : false;

  const preferences = game?.stackPreferences?.filter(p => p.pileIndex === pileIndex) || [];

  // Placeholder for StackPreference type if not explicitly defined or imported
  // type StackPreferenceValue = 'LIKE' | 'LOVE'; 

  const handleSetPreference = (preferenceValue: 'LIKE' | 'LOVE') => {
    // Assuming StackPreference is a string type like 'LIKE' or 'LOVE' based on usage
    setStackPreference(pileIndex, preferenceValue as any); // Using 'as any' if StackPreference type is complex
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="bg-white rounded-lg shadow-md p-4 w-32 h-48 flex flex-col items-center justify-center">
        <span className="text-2xl mb-2">{isAscending ? '↑' : '↓'}</span>
        <span className="text-4xl font-bold">{value}</span>
      </div>
      
      {/* Preferences */}
      <div className="absolute -right-2 top-0 flex flex-col gap-1">
        {preferences.map(pref => (
          <div 
            key={pref.playerId} // Ensure pref.playerId is unique and stable
            className="flex items-center bg-white rounded-full shadow px-2 py-1"
          >
            <Heart 
              className={`w-4 h-4 ${pref.preference === 'LOVE' ? 'fill-red-500' : 'text-red-500'}`}
            />
            {/* Ensure pref.playerName exists on the preference object */}
            <span className="text-xs ml-1">{pref.playerName || 'Player'}</span>
          </div>
        ))}
      </div>

      {/* Preference controls */}
      {/* This condition should be verified: Show controls if it's NOT the current player's turn? */}
      {!isCurrentPlayerTurn && (
        <div className="mt-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleSetPreference('LIKE')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSetPreference('LOVE')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Heart className="w-4 h-4 fill-red-500" /> {/* This implies LOVE fills the heart */}
            </button>
            <button
              onClick={() => removeStackPreference(pileIndex)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pile;
