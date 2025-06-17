import React from 'react';
import { type Card as CardType } from '../types/gameTypes';
import './Card.css';

interface CardProps {
  card: CardType;
  draggable?: boolean;
  onClick?: (card: CardType) => void;
}

export const Card: React.FC<CardProps> = ({ card, draggable = false, onClick }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('Starting drag for card:', card.id, card.value);
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="card"
      draggable={draggable}
      onDragStart={handleDragStart}
      onClick={() => onClick?.(card)}
    >
      {card.value}
    </div>
  );
};