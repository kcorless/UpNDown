import { type FC } from 'react';
import './GameSetup.css';

interface GameSetupProps {
  onStartSolitaire: () => void;
}

export const GameSetup: FC<GameSetupProps> = ({ onStartSolitaire }) => {
  return (
    <div className="game-setup">
      <h1>Up 'n Down</h1>
      <div className="game-modes">
        <button onClick={onStartSolitaire}>
          Start Solitaire Game
        </button>
      </div>
    </div>
  );
};
