import React, { useState, useEffect } from 'react';
import { Modal } from '../modal/Modal';
import { useSettings } from '../../contexts/SettingsContext';
import { userDECK, userDRAWPILE, DECK } from '../../types/gameTypes';
import './GameSettings.css';

interface GameSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isHost: boolean;
    isMainMenu?: boolean;
    currentSettings: {
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
    };
    onSaveSettings?: (settings: GameSettingsProps['currentSettings']) => void;
}

export const GameSettings = React.memo<GameSettingsProps>(({
    isOpen,
    onClose,
    isHost,
    isMainMenu = false,
    currentSettings,
    onSaveSettings
}) => {
    const { updateSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(currentSettings);
    const [error, setError] = useState<string | null>(null);
    const canEdit = isMainMenu || isHost;

    useEffect(() => {
        setLocalSettings(currentSettings);
    }, [currentSettings]);

    const validateSettings = (newSettings: typeof currentSettings): string | null => {
        if (newSettings[userDECK.MIN] < DECK.MINDEFAULT || 
            newSettings[userDECK.MIN] > DECK.MAXDEFAULT) {
            return `Minimum card value must be between ${DECK.MINDEFAULT} and ${DECK.MAXDEFAULT}`;
        }
        
        if (newSettings[userDECK.MAX] < DECK.MINDEFAULT || 
            newSettings[userDECK.MAX] > DECK.MAXDEFAULT) {
            return `Maximum card value must be between ${DECK.MINDEFAULT} and ${DECK.MAXDEFAULT}`;
        }
        
        if (newSettings[userDECK.MIN] > newSettings[userDECK.MAX]) {
            return 'Minimum card value cannot be greater than maximum card value';
        }

        if (newSettings[userDRAWPILE.MIN] < DECK.MINDEFAULT || 
            newSettings[userDRAWPILE.MIN] > DECK.MAXDEFAULT) {
            return `Minimum draw pile value must be between ${DECK.MINDEFAULT} and ${DECK.MAXDEFAULT}`;
        }
        
        if (newSettings[userDRAWPILE.MAX] < DECK.MINDEFAULT || 
            newSettings[userDRAWPILE.MAX] > DECK.MAXDEFAULT) {
            return `Maximum draw pile value must be between ${DECK.MINDEFAULT} and ${DECK.MAXDEFAULT}`;
        }
        
        if (newSettings[userDRAWPILE.MIN] > newSettings[userDRAWPILE.MAX]) {
            return 'Minimum draw pile value cannot be greater than maximum draw pile value';
        }

        return null;
    };

    const handleSettingsChange = (newSettings: typeof localSettings) => {
        const validationError = validateSettings(newSettings);
        setError(validationError);
        if (!validationError) {
            setLocalSettings(newSettings);
        }
    };

    const handleSave = () => {
        const validationError = validateSettings(localSettings);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (onSaveSettings) {
            onSaveSettings(localSettings);
        } else {
            updateSettings(localSettings);
        }
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideClose={true}>
            <div className="game-settings">
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Game Settings</h2>
                
                {error && <div className="settings-error">{error}</div>}
                
                <section className="settings-section">
                    <h3>Card Range</h3>
                    <div className="settings-row">
                        <label>
                            <span>Minimum Card Value:</span>
                            <input
                                type="number"
                                value={localSettings[userDECK.MIN]}
                                onChange={(e) => handleSettingsChange({
                                    ...localSettings,
                                    [userDECK.MIN]: parseInt(e.target.value)
                                })}
                                disabled={!canEdit}
                                readOnly={!canEdit}
                            />
                            <span className="default-text">Default: 2</span>
                        </label>
                        
                        <label>
                            <span>Maximum Card Value:</span>
                            <input
                                type="number"
                                value={localSettings[userDECK.MAX]}
                                onChange={(e) => handleSettingsChange({
                                    ...localSettings,
                                    [userDECK.MAX]: parseInt(e.target.value)
                                })}
                                disabled={!canEdit}
                                readOnly={!canEdit}
                            />
                            <span className="default-text">Default: 99</span>
                        </label>
                    </div>
                </section>
                
                <section className="settings-section">
                    <h3>Hand Sizes</h3>
                    <div className="settings-row">
                        <label>
                            <span>Solitaire:</span>
                            <input
                                type="number"
                                value={localSettings.handSizes.solitaire}
                                onChange={(e) => handleSettingsChange({
                                    ...localSettings,
                                    handSizes: {
                                        ...localSettings.handSizes,
                                        solitaire: parseInt(e.target.value)
                                    }
                                })}
                                disabled={!canEdit}
                                readOnly={!canEdit}
                            />
                            <span className="default-text">Default: 8</span>
                        </label>
                        
                        <label>
                            <span>Two Player:</span>
                            <input
                                type="number"
                                value={localSettings.handSizes.twoPlayer}
                                onChange={(e) => handleSettingsChange({
                                    ...localSettings,
                                    handSizes: {
                                        ...localSettings.handSizes,
                                        twoPlayer: parseInt(e.target.value)
                                    }
                                })}
                                disabled={!canEdit}
                                readOnly={!canEdit}
                            />
                            <span className="default-text">Default: 7</span>
                        </label>
                        
                        <label>
                            <span>Multiplayer:</span>
                            <input
                                type="number"
                                value={localSettings.handSizes.multiplayer}
                                onChange={(e) => handleSettingsChange({
                                    ...localSettings,
                                    handSizes: {
                                        ...localSettings.handSizes,
                                        multiplayer: parseInt(e.target.value)
                                    }
                                })}
                                disabled={!canEdit}
                                readOnly={!canEdit}
                            />
                            <span className="default-text">Default: 6</span>
                        </label>
                    </div>
                </section>
                
                <section className="settings-section game-behavior">
                    <h3>Game Behavior</h3>
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.refreshCardsOnPlay}
                            onChange={(e) => handleSettingsChange({
                                ...localSettings,
                                refreshCardsOnPlay: e.target.checked
                            })}
                            disabled={!canEdit}
                            readOnly={!canEdit}
                        />
                        <span>Refresh Multiplayer Cards Immediately</span>
                        <span className="default-text">Default: False</span>
                    </label>
                    
                    <label>
                        <input
                            type="checkbox"
                            checked={localSettings.undoAllowed}
                            onChange={(e) => handleSettingsChange({
                                ...localSettings,
                                undoAllowed: e.target.checked
                            })}
                            disabled={!canEdit}
                            readOnly={!canEdit}
                        />
                        <span>Allow Undo Last Play</span>
                        <span className="default-text">Default: False</span>
                    </label>
                </section>
                
                {canEdit && (
                    <button className="save-button" onClick={handleSave}>
                        Save Settings
                    </button>
                )}
            </div>
        </Modal>
    );
});