import React from 'react';
import { Link } from 'react-router-dom';

const GameCard = ({ title, description, icon: Icon, color, to }) => {
  return (
    <Link to={to} className="game-card-link">
      <div
        className="game-card"
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: `0 10px 0 ${color}`,
          border: `2px solid ${color}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer',
          height: '100%'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = `0 15px 0 ${color}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 10px 0 ${color}`;
        }}
      >
        <div
          style={{
            backgroundColor: color,
            padding: '1rem',
            borderRadius: '50%',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={48} strokeWidth={2.5} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{title}</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{description}</p>
      </div>
    </Link>
  );
};

export default GameCard;
