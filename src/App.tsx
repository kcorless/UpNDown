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

export default App;
