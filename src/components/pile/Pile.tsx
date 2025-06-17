import { type FC } from 'react';
import { type Pile as PileType } from '../../types/gameTypes';
import { Card } from '../card/Card';
import './Pile.css';

interface PileProps {
  pile: PileType;
  onPileClick: () => void;  // Changed from onCardDrop
  isValidTarget?: boolean;  // Add to show if pile is valid target for selected card
  isSelected?: boolean;     // Add to show if this pile's top card is selected
}

export const Pile: FC<PileProps> = ({ 
  pile, 
  onPileClick,
  isValidTarget = false,
  isSelected = false
}) => {
  return (
    <div 
      className={`pile-container ${isValidTarget ? 'valid-target' : ''}`}
      onClick={onPileClick}
    >
      <div className="pile-label">{pile.label}</div>
      <div className="pile">
        {pile.cards.length > 0 && (
          <Card
            card={pile.cards[pile.cards.length - 1]}
            isSelected={isSelected}
          />
        )}
      </div>
    </div>
  );
};