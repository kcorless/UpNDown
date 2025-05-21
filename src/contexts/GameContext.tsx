// src/contexts/GameContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import { GraphQLSubscription, ZenObservable } from '@aws-amplify/api';
import { 
  onGameUpdated,
  onChatMessageReceived,
  onStackPreferencesUpdated 
} from '../graphql/subscriptions'; // Path relative to src/contexts/
import { 
  Game,
  ChatMessage,
  StackPreference,
  // Player // Player type is not directly used in this file after changes, but good to keep if other types depend on it
} from '../types'; // Path relative to src/contexts/

// Define payload types for subscriptions
interface OnGameUpdatedPayload {
  value: {
    data: {
      onGameUpdated: Game;
    };
  };
}

interface OnChatMessageReceivedPayload {
  value: {
    data: {
      onChatMessageReceived: ChatMessage;
    };
  };
}

interface OnStackPreferencesUpdatedPayload {
  value: {
    data: {
      onStackPreferencesUpdated: Game; // Assuming this returns the full Game object
    };
  };
}

interface GameContextType {
  game: Game | null;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  setStackPreference: (pileIndex: number, preference: StackPreference) => Promise<void>;
  removeStackPreference: (pileIndex: number) => Promise<void>;
  playCard: (cardValue: number, pileIndex: number, isAscending: boolean) => Promise<void>;
  endTurn: () => Promise<void>;
  // Manually set game for initialization (e.g. after fetching or creating a game)
  initializeGame: (initialGame: Game) => void; 
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Effect for initializing game and messages (e.g., from Home page navigation)
  const initializeGame = useCallback((initialGame: Game) => {
    setGame(initialGame);
    // Potentially fetch initial messages or set them if included in initialGame object
    // setMessages(initialGame.initialMessages || []); 
  }, []);


  useEffect(() => {
    if (!game?.gameId) return;

    let gameSub: ZenObservable.Subscription | undefined;
    let messageSub: ZenObservable.Subscription | undefined;
    let stackPrefsSub: ZenObservable.Subscription | undefined;

    // Subscribe to game updates
    try {
      gameSub = (API.graphql(
        graphqlOperation(onGameUpdated, { gameId: game.gameId })
      ) as GraphQLSubscription<OnGameUpdatedPayload>).subscribe({
        next: ({ value }) => {
          console.log("GameSubscription received:", value.data.onGameUpdated);
          setGame(value.data.onGameUpdated);
        },
        error: (error) => console.error("GameSubscription error:", error)
      });

      // Subscribe to chat messages
      messageSub = (API.graphql(
        graphqlOperation(onChatMessageReceived, { gameId: game.gameId })
      ) as GraphQLSubscription<OnChatMessageReceivedPayload>).subscribe({
        next: ({ value }) => {
          console.log("MessageSubscription received:", value.data.onChatMessageReceived);
          setMessages(prevMessages => [...prevMessages, value.data.onChatMessageReceived]);
        },
        error: (error) => console.error("MessageSubscription error:", error)
      });

      // Subscribe to stack preferences updates
      stackPrefsSub = (API.graphql(
        graphqlOperation(onStackPreferencesUpdated, { gameId: game.gameId })
      ) as GraphQLSubscription<OnStackPreferencesUpdatedPayload>).subscribe({
        next: ({ value }) => {
          console.log("StackPrefsSubscription received:", value.data.onStackPreferencesUpdated);
          // Assuming onStackPreferencesUpdated returns the full Game object
          setGame(value.data.onStackPreferencesUpdated);
        },
        error: (error) => console.error("StackPrefsSubscription error:", error)
      });

    } catch (error) {
      console.error("Error setting up subscriptions:", error);
    }
    
    return () => {
      console.log("Cleaning up subscriptions for gameId:", game?.gameId);
      gameSub?.unsubscribe();
      messageSub?.unsubscribe();
      stackPrefsSub?.unsubscribe();
    };
  }, [game?.gameId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!game?.gameId) {
      console.error("Cannot send message, gameId is not available.");
      return;
    }
    console.log('sendMessage called with:', content, 'for gameId:', game.gameId);
    // Placeholder: Actual implementation would involve an API call
    // e.g., await API.graphql(graphqlOperation(createChatMessageMutation, { input: { gameId: game.gameId, content, /* other fields */ } }));
  }, [game?.gameId]);
  
  const setStackPreference = useCallback(async (pileIndex: number, preference: StackPreference) => {
    if (!game?.gameId) {
      console.error("Cannot set stack preference, gameId is not available.");
      return;
    }
    console.log('setStackPreference called with:', pileIndex, preference, 'for gameId:', game.gameId);
    // Placeholder: e.g., await API.graphql(graphqlOperation(updateStackPreferenceMutation, { input: { gameId: game.gameId, pileIndex, preference, /* other fields */ } }));
  }, [game?.gameId]);

  const removeStackPreference = useCallback(async (pileIndex: number) => {
    if (!game?.gameId) {
      console.error("Cannot remove stack preference, gameId is not available.");
      return;
    }
    console.log('removeStackPreference called with:', pileIndex, 'for gameId:', game.gameId);
    // Placeholder: e.g., await API.graphql(graphqlOperation(removeStackPreferenceMutation, { input: { gameId: game.gameId, pileIndex, /* other fields */ } }));
  }, [game?.gameId]);

  const playCard = useCallback(async (cardValue: number, pileIndex: number, isAscending: boolean) => {
    if (!game?.gameId) {
      console.error("Cannot play card, gameId is not available.");
      return;
    }
    console.log('playCard called with:', cardValue, pileIndex, isAscending, 'for gameId:', game.gameId);
    // Placeholder: e.g., await API.graphql(graphqlOperation(playCardMutation, { input: { gameId: game.gameId, cardValue, pileIndex, /* other fields */ } }));
  }, [game?.gameId]);

  const endTurn = useCallback(async () => {
    if (!game?.gameId) {
      console.error("Cannot end turn, gameId is not available.");
      return;
    }
    console.log('endTurn called for gameId:', game.gameId);
    // Placeholder: e.g., await API.graphql(graphqlOperation(endTurnMutation, { input: { gameId: game.gameId, /* other fields */ } }));
  }, [game?.gameId]);

  const contextValue = useMemo(() => ({
    game,
    messages,
    sendMessage,
    setStackPreference,
    removeStackPreference,
    playCard,
    endTurn,
    initializeGame,
  }), [
    game, 
    messages, 
    sendMessage, 
    setStackPreference, 
    removeStackPreference, 
    playCard, 
    endTurn,
    initializeGame,
  ]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
