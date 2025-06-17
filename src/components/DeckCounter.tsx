import './DeckCounter.css';

interface DeckCounterProps {
  count: number;
}

export function DeckCounter({ count }: DeckCounterProps) {
  return (
    <div className="deck-counter">
      {count} cards
    </div>
  );
}
