import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const GameWrapper = ({ title, children, color = '#333' }) => {
  return (
    <div className="game-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderBottom: '2px solid rgba(0,0,0,0.05)',
        backgroundColor: 'white'
      }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold',
            color: '#666',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}
        >
          <ArrowLeft size={20} />
          Back
        </Link>
        <h2 style={{ margin: 0, color: color }}>{title}</h2>
      </nav>

      <main style={{
        flex: 1,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {children}
      </main>
    </div>
  );
};

export default GameWrapper;
