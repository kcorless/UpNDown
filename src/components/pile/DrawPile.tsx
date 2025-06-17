import { type FC } from 'react';
import './DrawPile.css';

interface DrawPileProps {
  count: number;
  onClick: () => void;
}

export const DrawPile: FC<DrawPileProps> = ({ count, onClick }) => {
  return (
    <div className="draw-pile-container">
      <button 
        className="draw-pile-button" 
        onClick={onClick}
        disabled={count === 0}
      >
        {count}
      </button>
    </div>
  );
};
