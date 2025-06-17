import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const usePlayerUuid = () => {
  // Use localStorage to persist the player UUID
  const [playerUuid] = useState(() => {
    const storedUuid = localStorage.getItem('playerUuid');
    if (storedUuid) {
      return storedUuid;
    }
    const newUuid = uuidv4();
    localStorage.setItem('playerUuid', newUuid);
    return newUuid;
  });
  return playerUuid;
};