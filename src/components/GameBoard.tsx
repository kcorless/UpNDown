// src/components/GameBoard.tsx
import React from 'react';
import { useGame } from '../contexts/GameContext'; // Adjusted path
import Pile from './Pile';
// PlayerHand import is commented out as its definition was not in the original the-game-web.ts
// import PlayerHand from './PlayerHand'; 

const GameBoard: React.FC = () => {
  const { game } = useGame();

  if (!game) return null;

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Assuming game.ascendingPiles and game.descendingPiles exist on the game object */}
        {game.ascendingPiles?.map((value, index) => (
          <Pile
            key={`asc-${index}`}
            value={value}
            isAscending={true}
            pileIndex={index}
          />
        ))}
        {game.descendingPiles?.map((value, index) => (
          <Pile
            key={`desc-${index}`}
            value={value}
            isAscending={false}
            pileIndex={index + 2} // Assuming descending piles start at index 2
          />
        ))}
      </div>
      {/* <PlayerHand /> */} {/* PlayerHand component is not defined in the provided code snippet */}
    </div>
  );
};

export default GameBoard;
