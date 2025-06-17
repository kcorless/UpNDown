import React, { type FC, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { createLobby, joinLobby } from '../services/lobbyService';
import './MultiplayerSetup.css';

interface MultiplayerSetupProps {
    onCreateGame: (gameId: string) => void;
    onJoinGame: (gameId: string) => void;
}

export const MultiplayerSetup: FC<MultiplayerSetupProps> = ({ onCreateGame, onJoinGame }) => {
    const [error, setError] = useState<string | null>(null);
    const [gameCode, setGameCode] = useState<string>('');
    const [playerName, setPlayerName] = useState('');
    const [showJoinForm, setShowJoinForm] = useState(false);
    const { settings } = useSettings();
    const { state: { currentPlayerUuid } } = useMultiplayer();

    const handleCreateGame = async () => {
        if (!playerName) {
            setError('Please enter a name');
            return;
        }

        if (!currentPlayerUuid) {
            setError('Player ID not found');
            return;
        }
    
        try {
            // Pass all user settings to Firebase
            const newGameId = await createLobby(currentPlayerUuid, playerName, settings);
    
            console.log('Successfully created game:', { 
                newGameId, 
                currentPlayerUuid,
                settings 
            });
          
        

            onCreateGame(newGameId);
        } catch (error) {
            console.error('Failed to create game:', error);
            setError('Failed to create game. Please try again.');
        }
    };

    const handleJoinGame = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!playerName) {
            setError('Please enter a name');
            return;
        }

        if (!gameCode) {
            setError('Please enter a game code');
            return;
        }

        if (!currentPlayerUuid) {
            setError('Player ID not found');
            return;
        }

        try {
            await joinLobby(gameCode, currentPlayerUuid, playerName);
            console.log('Successfully joined game:', { gameCode, currentPlayerUuid });
            onJoinGame(gameCode);
        } catch (error) {
            console.error('Failed to join game:', error);
            setError('Failed to join game. Please check the game code and try again.');
        }
    };

    return (
        <div className="multiplayer-setup">
            <h2>Multiplayer Setup</h2>
            
            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}
             
            {/* Player Name Input */}
            <div className="input-group">
                <label htmlFor="playerName">Your Name:</label>
                <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                />
            </div>

            {!showJoinForm ? (
                // Create Game Section
                <div className="create-game-section">
                    <button 
                        className="create-game-button"
                        onClick={handleCreateGame}
                        disabled={!playerName}
                    >
                        Create New Game
                    </button>
                    <button 
                        className="switch-button"
                        onClick={() => setShowJoinForm(true)}
                    >
                        Join Existing Game
                    </button>
                </div>
            ) : (
                // Join Game Section
                <div className="join-game-section">
                    <form onSubmit={handleJoinGame}>
                        <div className="input-group">
                            <label htmlFor="gameCode">Game Code:</label>
                            <input
                                type="text"
                                id="gameCode"
                                value={gameCode}
                                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                                placeholder="Enter game code"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="join-game-button"
                            disabled={!playerName || !gameCode}
                        >
                            Join Game
                        </button>
                        <button 
                            type="button"
                            className="switch-button"
                            onClick={() => setShowJoinForm(false)}
                        >
                            Create New Game
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};