// src/pages/Game.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import GameBoard from '../components/GameBoard'; // Adjusted path
import Chat from '../components/Chat'; // Adjusted path

const Game: React.FC = () => {
  const [showChat, setShowChat] = useState(true);
  const { gameId } = useParams<{ gameId: string }>(); // gameId is available if needed

  // Basic error handling or loading state could be added here if gameId is invalid or data is fetching
  // For example: if (!gameId) return <p>No game ID provided.</p>;

  return (
    <div className="flex h-[calc(100vh-64px)]"> {/* Adjusted for typical nav bar height */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${showChat ? 'w-3/4' : 'w-full'}`}>
        <GameBoard />
      </div>
      
      {showChat && (
        <div className="w-1/4 border-l transition-all duration-300 ease-in-out">
          <Chat />
        </div>
      )}
      
      <button
        onClick={() => setShowChat(!showChat)}
        className="absolute right-4 top-[72px] z-10 bg-white p-2 rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={showChat ? 'Hide chat' : 'Show chat'}
      >
        {/* Simple text or icons can be used here */}
        {showChat ? 'Hide Chat' : 'Show Chat'}
      </button>
    </div>
  );
};

export default Game;
