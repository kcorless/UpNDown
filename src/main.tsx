import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { GameStateProvider } from './contexts/GameStateContext'
import { MultiplayerProvider } from './contexts/MultiplayerContext'
import { GameFlowProvider } from './contexts/GameFlowContext'
import { UIProvider } from './contexts/UIContext'
import { SettingsProvider } from './contexts/SettingsContext'  // Add this import
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UIProvider>
      <GameFlowProvider>
        <SettingsProvider>  {/* Add this provider */}
          <GameStateProvider>
            <MultiplayerProvider>
              <App />
            </MultiplayerProvider>
          </GameStateProvider>
        </SettingsProvider>
      </GameFlowProvider>
    </UIProvider>
  </React.StrictMode>,
)