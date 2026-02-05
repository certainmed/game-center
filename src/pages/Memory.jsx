import React, { useState, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw } from 'lucide-react';

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

const Memory = () => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, content: emoji }));

    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWon(false);
  };

  const handleCardClick = (id) => {
    // Prevent clicking if 2 cards already flipped or clicked card is already flipped/matched
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard.content === secondCard.content) {
        setMatched([...matched, firstId, secondId]);
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      setWon(true);
    }
  }, [matched, cards]);

  return (
    <GameWrapper title="Memory Game" color="#4ecdc4">
      <div style={{ maxWidth: '600px', width: '100%' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
            Moves: <span style={{ color: '#4ecdc4' }}>{moves}</span>
          </div>
          <button
            onClick={initializeGame}
            style={{
              backgroundColor: '#333',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={18} /> Restart
          </button>
        </div>

        {won && (
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: '#4ecdc4',
            color: 'white',
            borderRadius: '10px',
            animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <h2 style={{ margin: 0 }}>You Won! 🎉</h2>
            <p style={{ margin: 0 }}>It took you {moves} moves.</p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '15px',
          perspective: '1000px'
        }}>
          {cards.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                style={{
                  height: '100px',
                  backgroundColor: isFlipped ? 'white' : '#4ecdc4',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  transition: 'transform 0.6s, background-color 0.3s',
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                   transform: 'rotateY(180deg)',
                   display: isFlipped ? 'block' : 'none'
                }}>
                  {card.content}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </GameWrapper>
  );
};

export default Memory;
