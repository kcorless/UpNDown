// src/App.tsx
import React from 'react';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
import Game from './pages/Game';

// Configure Amplify
Amplify.configure({
  aws_project_region: process.env.REACT_APP_AWS_REGION,
  aws_appsync_graphqlEndpoint: process.env.REACT_APP_APPSYNC_ENDPOINT,
  aws_appsync_region: process.env.REACT_APP_AWS_REGION,
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  Auth: {
    region: process.env.REACT_APP_AWS_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
  }
});

const App: React.FC = () => {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <GameProvider>
            <div className="min-h-screen bg-gray-100">
              <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                  <h1 className="text-xl font-bold">The Game</h1>
                  <div className="flex items-center gap-4">
                    <span>{user?.username}</span>
                    <button 
                      onClick={signOut}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </nav>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:gameId" element={<Game />} />
              </Routes>
            </div>
          </GameProvider>
        </BrowserRouter>
      )}
    </Authenticator>
  );
};

// src/contexts/GameContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { GraphQLSubscription } from '@aws-amplify/api';
import { 
  onGameUpdated,
  onChatMessageReceived,
  onStackPreferencesUpdated 
} from '../graphql/subscriptions';
import { 
  Game,
  ChatMessage,
  StackPreference,
  Player 
} from '../types';

interface GameContextType {
  game: Game | null;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  setStackPreference: (pileIndex: number, preference: StackPreference) => Promise<void>;
  removeStackPreference: (pileIndex: number) => Promise<void>;
  playCard: (cardValue: number, pileIndex: number, isAscending: boolean) => Promise<void>;
  endTurn: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!game?.gameId) return;

    // Subscribe to game updates
    const gameSubscription = API.graphql(
      graphqlOperation(onGameUpdated, { gameId: game.gameId })
    ) as GraphQLSubscription<Game>;

    const messageSubscription = API.graphql(
      graphqlOperation(onChatMessageReceived, { gameId: game.gameId })
    ) as GraphQLSubscription<ChatMessage>;

    // Handle subscriptions...
    
    return () => {
      // Cleanup subscriptions
    };
  }, [game?.gameId]);

  // Implementation of context methods...

  return (
    <GameContext.Provider value={{
      game,
      messages,
      sendMessage,
      setStackPreference,
      removeStackPreference,
      playCard,
      endTurn
    }}>
      {children}
    </GameContext.Provider>
  );
};

// src/components/GameBoard.tsx
import React from 'react';
import { useGame } from '../hooks/useGame';
import Pile from './Pile';
import PlayerHand from './PlayerHand';

const GameBoard: React.FC = () => {
  const { game } = useGame();

  if (!game) return null;

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="grid grid-cols-4 gap-4">
        {game.ascendingPiles.map((value, index) => (
          <Pile
            key={`asc-${index}`}
            value={value}
            isAscending={true}
            pileIndex={index}
          />
        ))}
        {game.descendingPiles.map((value, index) => (
          <Pile
            key={`desc-${index}`}
            value={value}
            isAscending={false}
            pileIndex={index + 2}
          />
        ))}
      </div>
      <PlayerHand />
    </div>
  );
};

// src/components/Pile.tsx
import React from 'react';
import { useGame } from '../hooks/useGame';
import { Heart } from 'lucide-react';

interface PileProps {
  value: number;
  isAscending: boolean;
  pileIndex: number;
}

const Pile: React.FC<PileProps> = ({ value, isAscending, pileIndex }) => {
  const { game, setStackPreference, removeStackPreference } = useGame();
  const isCurrentPlayerTurn = game?.players[game.currentPlayerIndex].id === Auth.user?.username;

  const preferences = game?.stackPreferences.filter(p => p.pileIndex === pileIndex) || [];

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
            key={pref.playerId}
            className="flex items-center bg-white rounded-full shadow px-2 py-1"
          >
            <Heart 
              className={`w-4 h-4 ${pref.preference === 'LOVE' ? 'fill-red-500' : 'text-red-500'}`}
            />
            <span className="text-xs ml-1">{pref.playerName}</span>
          </div>
        ))}
      </div>

      {/* Preference controls */}
      {!isCurrentPlayerTurn && (
        <div className="mt-2">
          <div className="flex gap-2">
            <button
              onClick={() => setStackPreference(pileIndex, 'LIKE')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStackPreference(pileIndex, 'LOVE')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Heart className="w-4 h-4 fill-red-500" />
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

// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../hooks/useGame';

const Chat: React.FC = () => {
  const { messages, sendMessage } = useGame();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.playerId === Auth.user?.username
                ? 'ml-auto'
                : 'mr-auto'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">
                {message.playerName}
              </span>
              <div
                className={`rounded-lg px-4 py-2 max-w-xs ${
                  message.playerId === Auth.user?.username
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-lg border px-4 py-2"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

// src/pages/Game.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import Chat from '../components/Chat';

const Game: React.FC = () => {
  const [showChat, setShowChat] = useState(true);
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className={`flex-1 ${showChat ? 'w-3/4' : 'w-full'}`}>
        <GameBoard />
      </div>
      
      {showChat && (
        <div className="w-1/4 border-l">
          <Chat />
        </div>
      )}
      
      <button
        onClick={() => setShowChat(!showChat)}
        className="absolute right-4 top-20 bg-white p-2 rounded-full shadow"
      >
        {showChat ? 'Hide Chat' : 'Show Chat'}
      </button>
    </div>
  );
};

export default App;
