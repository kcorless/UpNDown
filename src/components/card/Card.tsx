import { type FC } from 'react';
import { type Card as CardType } from '../../types/gameTypes';
import './Card.css';

interface CardProps {
  card: CardType;
  isSelected?: boolean;  // Add this prop
  onClick?: () => void;
}

export const Card: FC<CardProps> = ({ 
  card, 
  isSelected = false,  // Default to false
  onClick 
}) => {
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {card.value}
    </div>
  );
};