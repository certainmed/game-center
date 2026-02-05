import React from 'react';
import GameCard from '../components/GameCard';
import { Hash, Brain, Grid3x3, Route, BrickWall, Activity, Ghost } from 'lucide-react';

const games = [
  {
    title: 'Tic Tac Toe',
    description: 'Classic X and O strategy game',
    icon: Hash,
    color: '#ff6b6b',
    to: '/tictactoe'
  },
  {
    title: 'Memory',
    description: 'Test your brain power',
    icon: Brain,
    color: '#4ecdc4',
    to: '/memory'
  },
  {
    title: '2048',
    description: 'Join the numbers!',
    icon: Grid3x3,
    color: '#ffe66d',
    to: '/2048'
  },
  {
    title: 'Flow Free',
    description: 'Connect matching colors',
    icon: Route,
    color: '#6c5ce7',
    to: '/flow'
  },
  {
    title: 'Block Breaker',
    description: 'Smash the bricks',
    icon: BrickWall,
    color: '#ff9f43',
    to: '/breakout'
  },
  {
    title: 'Snake',
    description: 'Eat and grow longer',
    icon: Activity,
    color: '#2ecc71',
    to: '/snake'
  },
  {
    title: 'Pacman',
    description: 'Waka waka waka',
    icon: Ghost,
    color: '#eb4d4b',
    to: '/pacman'
  }
];

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '900',
          color: '#333',
          marginBottom: '0.5rem',
          textShadow: '3px 3px 0px rgba(0,0,0,0.1)'
        }}>
          GAME <span style={{ color: '#ff6b6b' }}>CENTER</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>Choose your challenge!</p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '2rem',
        padding: '0 1rem'
      }}>
        {games.map((game) => (
          <GameCard key={game.title} {...game} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
