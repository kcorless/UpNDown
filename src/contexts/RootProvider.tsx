import { type FC, type ReactNode } from 'react';
import { GameStateProvider } from './GameStateContext';
import { UIProvider } from './UIContext';
import { MultiplayerProvider } from './MultiplayerContext';

interface RootProviderProps {
  children: ReactNode;
}

export const RootProvider: FC<RootProviderProps> = ({ children }) => {
  return (
    <GameStateProvider>
      <UIProvider>
        <MultiplayerProvider>
          {children}
        </MultiplayerProvider>
      </UIProvider>
    </GameStateProvider>
  );
};
