import { v4 as uuidv4 } from 'uuid';

// Generate a unique player UUID and store it in localStorage
export const getPlayerUuid = (): string => {
    const storageKey = 'playerUuid';
    const storedUuid = localStorage.getItem(storageKey);
    
    if (storedUuid) {
        console.log('Using stored player UUID:', storedUuid);
        return storedUuid;
    }

    // Generate a new UUID
    const newUuid = uuidv4();
    
    localStorage.setItem(storageKey, newUuid);
    console.log('Generated new player UUID:', newUuid);
    return newUuid;
};
