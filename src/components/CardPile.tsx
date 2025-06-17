  import React from 'react';
  import { type Pile, COLORS, PILE_TYPES, type LikeState } from '../types/gameTypes';
  import './CardPile.css';

  interface CardPileProps {
  pile: Pile;
  onClick?: () => void;
  topLikeStates?: LikeState[];    
  bottomLikeStates?: LikeState[]; 
  onLikeStateChange?: (row: 'top' | 'bottom', position: number) => void;
  playerCount: number; 
  }

  export const CardPile: React.FC<CardPileProps> = ({ 
  pile, 
  onClick,
  topLikeStates = ['none', 'none', 'none'],
  bottomLikeStates = ['none', 'none', 'none'],
  onLikeStateChange, playerCount
  }) => {
    const LIKE_ICONS = {
      none: (position: number, row: 'top' | 'bottom') => {
        // If top row, positions 0,1,2 map to players 1,2,3
        // If bottom row, positions 0,1,2 map to players 4,5,6
        const playerNumber = row === 'top' ? position + 1 : position + 4;
        return playerNumber.toString();
      },
      like: '👍',
      reallyLike: '♡',
      love: '💗'
    } as const;

  const handleHeartClick = (event: React.MouseEvent, row: 'top' | 'bottom', position: number) => {
    event.stopPropagation();  // Prevent triggering pile click
    if (onLikeStateChange) {
      onLikeStateChange(row, position);
    }
  };

  // Generate styles using constants
  const pileStyle = {
    backgroundColor: pile.type === 'UP' ? COLORS.ASCENDING_PILE : COLORS.DESCENDING_PILE
  };

  const insetStyle = {
    background: `linear-gradient(to bottom right, ${COLORS.INSET_GRADIENT_START}, ${COLORS.INSET_GRADIENT_END})`
  };

  // Ensure cards array exists before accessing it
  const topCard = pile.cards && pile.cards.length > 0 
    ? pile.cards[pile.cards.length - 1] 
    : null;

    const renderHeartRow = (states: LikeState[], row: 'top' | 'bottom') => (
      <div className="heart-icons">
        {states.map((state, index) => {
          const playerNumber = row === 'top' ? index + 1 : index + 4;
          // Only show if player number is less than or equal to total players
          if (playerNumber > playerCount) {
            return <span key={index} className="heart-icon empty"></span>;
          }
          return (
            <span 
              key={index} 
              className={`heart-icon ${state}`}
              onClick={(e) => handleHeartClick(e, row, index)}
            >
              {state === 'none' ? playerNumber.toString() : LIKE_ICONS[state]}
            </span>
          );
        })}
      </div>
    );

    return (
      <div className="pile-wrapper">
        {renderHeartRow(topLikeStates, 'top')}
    
        <div 
          className={`card-pile ${pile.type.toLowerCase()}`}
          style={pileStyle}
          onClick={onClick}
          data-pile-id={pile.id}
        >
          {/* Add arrows conditionally based on pile type */}
          {pile.type === PILE_TYPES.UP && (
          <>
            <div className="arrow left-arrow">↑</div>
            <div className="arrow right-arrow">↑</div>
          </>
        )}
        {pile.type === PILE_TYPES.DOWN && (
          <>
            <div className="arrow left-arrow">↓</div>
            <div className="arrow right-arrow">↓</div>
          </>
        )}
          
          <div className="inset-area" style={insetStyle}>
            {topCard ? (
              <div className="top-card">
                {topCard.value}
              </div>
            ) : (
              <div className="starting-value">
                {pile.currentValue}
              </div>
            )}
          </div>
        </div>
    
        {renderHeartRow(bottomLikeStates, 'bottom')}
      </div>
    );
    
    
  }    