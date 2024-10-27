// src/pages/Home.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, graphqlOperation } from 'aws-amplify';
import { createGame, joinGame } from '../graphql/mutations';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'initial' | 'new' | 'join'>('initial');
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNewGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data } = await API.graphql(graphqlOperation(createGame, { 
        playerName: playerName.trim() 
      }));
      const gameId = data.createGame.gameId;
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
    }
    setIsLoading(false);
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (joinGameId.length !== 4) {
      setError('Game ID must be 4 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data } = await API.graphql(graphqlOperation(joinGame, { 
        gameId: joinGameId,
        playerName: playerName.trim()
      }));
      navigate(`/game/${data.joinGame.gameId}`);
    } catch (err) {
      setError('Invalid game ID or game is full');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to The Game</h2>
          <p className="mt-2 text-gray-600">Play with friends and work together!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 'initial' ? (
            <div className="space-y-4">
              <button
                onClick={() => setStep('new')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Game
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">or</span>
                </div>
              </div>
              <button
                onClick={() => setStep('join')}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join Existing Game
              </button>
            </div>
          ) : (
            <form onSubmit={step === 'join' ? handleJoinGame : handleNewGame} className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  placeholder="Enter your name"
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {step === 'join' && (
                <div>
                  <label htmlFor="gameId" className="block text-sm font-medium text-gray-700">
                    Game ID
                  </label>
                  <input
                    type="text"
                    id="gameId"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                    maxLength={4}
                    placeholder="Enter 4-character game ID"
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep('initial')}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !playerName.trim() || (step === 'join' && joinGameId.length !== 4)}
                  className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : step === 'join' ? 'Join Game' : 'Create Game'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
