import React, { createContext, useContext, useState } from 'react';
import { DECK, DRAWPILE, userDECK, userDRAWPILE } from '../types/gameTypes';
import { getGameStorage, storeGameStorage } from '../utils/gameStorage';

export interface GameSettings {
    [userDECK.MIN]: number;
    [userDECK.MAX]: number;
    [userDRAWPILE.MIN]: number;
    [userDRAWPILE.MAX]: number;
    handSizes: {
        solitaire: number;
        twoPlayer: number;
        multiplayer: number;
    };
    refreshCardsOnPlay: boolean;
    undoAllowed: boolean;
}

interface SettingsContextType {
    settings: GameSettings;
    updateSettings: (newSettings: GameSettings) => void;
    saveSettingsToStorage: (newSettings: GameSettings) => void;
    loadSettingsFromStorage: () => GameSettings;
}

// Initialize default settings using system DECK values
export const defaultSettings: GameSettings = {
    [userDECK.MIN]: DECK.MINDEFAULT,
    [userDECK.MAX]: DECK.MAXDEFAULT,
    [userDRAWPILE.MIN]: DRAWPILE.MINDEFAULT,
    [userDRAWPILE.MAX]: DRAWPILE.MAXDEFAULT,
    handSizes: {
        solitaire: 8,
        twoPlayer: 7,
        multiplayer: 6
    },
    refreshCardsOnPlay: false,
    undoAllowed: false
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize settings state from game storage only during bootstrap
    const [settings, setSettings] = useState<GameSettings>(() => {
        const storage = getGameStorage();
        return storage?.settings || defaultSettings;
    });

    // This function only updates the in-memory settings state
    const updateSettings = (newSettings: GameSettings) => {
        setSettings(newSettings);
    };

    // This function is only called from the settings screen
    const saveSettingsToStorage = (newSettings: GameSettings) => {
        const storage = getGameStorage();
        if (storage) {
            const newStorage = {
                ...storage,
                settings: newSettings
            };
            storeGameStorage(newStorage);
        }
        setSettings(newSettings);
    };

    // This function is only called during game bootstrap
    const loadSettingsFromStorage = (): GameSettings => {
        const storage = getGameStorage();
        return storage?.settings || defaultSettings;
    };

    return (
        <SettingsContext.Provider value={{ 
            settings, 
            updateSettings, 
            saveSettingsToStorage,
            loadSettingsFromStorage 
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};