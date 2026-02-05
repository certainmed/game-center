import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TicTacToe from './pages/TicTacToe';
import Memory from './pages/Memory';
import Game2048 from './pages/Game2048';
import FlowFree from './pages/FlowFree';
import Breakout from './pages/Breakout';
import Snake from './pages/Snake';
import Pacman from './pages/Pacman';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/flow" element={<FlowFree />} />
        <Route path="/breakout" element={<Breakout />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="/pacman" element={<Pacman />} />
      </Routes>
    </Router>
  );
}

export default App;
