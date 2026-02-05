import React, { useState, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw, User, Cpu, Swords } from 'lucide-react';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, draw
  const [winner, setWinner] = useState(null);
  const [mode, setMode] = useState('pve'); // pvp, pve
  const [difficulty, setDifficulty] = useState('hard'); // easy, medium, hard

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus('playing');
    setWinner(null);
  };

  const checkWinner = (squares) => {
    for (let combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const isBoardFull = (squares) => {
    return squares.every(square => square !== null);
  };

  const handleClick = (index) => {
    if (board[index] || gameStatus !== 'playing') return;

    // If PvE and it's O's turn (AI), ignore clicks
    if (mode === 'pve' && !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    setBoard(newBoard);

    const win = checkWinner(newBoard);
    if (win) {
      setGameStatus('won');
      setWinner(win);
    } else if (isBoardFull(newBoard)) {
      setGameStatus('draw');
    } else {
      setIsXNext(!isXNext);
    }
  };

  // AI Logic
  useEffect(() => {
    if (mode === 'pve' && !isXNext && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameStatus, mode]);

  const makeAiMove = () => {
    let moveIndex;

    if (difficulty === 'easy') {
      moveIndex = getRandomMove(board);
    } else if (difficulty === 'medium') {
      // 50% chance of optimal, 50% random
      moveIndex = Math.random() > 0.5 ? getBestMove(board) : getRandomMove(board);
    } else {
      moveIndex = getBestMove(board);
    }

    if (moveIndex !== -1) {
      const newBoard = [...board];
      newBoard[moveIndex] = 'O';
      setBoard(newBoard);

      const win = checkWinner(newBoard);
      if (win) {
        setGameStatus('won');
        setWinner(win);
      } else if (isBoardFull(newBoard)) {
        setGameStatus('draw');
      } else {
        setIsXNext(true);
      }
    }
  };

  const getRandomMove = (squares) => {
    const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  };

  const getBestMove = (squares) => {
    // Minimax implementation for 'O' (maximizing player)
    return minimax(squares, 'O').index;
  };

  const minimax = (squares, player) => {
    const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

    const win = checkWinner(squares);
    if (win === 'O') return { score: 10 };
    if (win === 'X') return { score: -10 };
    if (available.length === 0) return { score: 0 };

    const moves = [];

    for (let i = 0; i < available.length; i++) {
      const move = {};
      move.index = available[i];
      const newSquares = [...squares];
      newSquares[available[i]] = player;

      if (player === 'O') {
        const result = minimax(newSquares, 'X');
        move.score = result.score;
      } else {
        const result = minimax(newSquares, 'O');
        move.score = result.score;
      }
      moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }
    return moves[bestMove];
  };

  return (
    <GameWrapper title="Tic Tac Toe" color="#ff6b6b">
      <div style={{ maxWidth: '400px', width: '100%' }}>

        {/* Controls */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => { setMode('pvp'); resetGame(); }}
              style={{
                backgroundColor: mode === 'pvp' ? '#ff6b6b' : 'white',
                color: mode === 'pvp' ? 'white' : '#333',
                borderColor: '#ff6b6b',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Swords size={18} /> PvP
            </button>
            <button
              onClick={() => { setMode('pve'); resetGame(); }}
              style={{
                backgroundColor: mode === 'pve' ? '#ff6b6b' : 'white',
                color: mode === 'pve' ? 'white' : '#333',
                borderColor: '#ff6b6b',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Cpu size={18} /> vs AI
            </button>
          </div>

          {mode === 'pve' && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); resetGame(); }}
                  style={{
                    backgroundColor: difficulty === d ? '#333' : '#f0f0f0',
                    color: difficulty === d ? 'white' : '#333',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    padding: '0.4rem 0.8rem'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#333',
          minHeight: '2rem'
        }}>
          {gameStatus === 'playing' ? (
            <span>Player {isXNext ? 'X' : 'O'}'s Turn</span>
          ) : (
            <span style={{ color: gameStatus === 'won' ? '#2ecc71' : '#f1c40f' }}>
              {gameStatus === 'won' ? `Player ${winner} Wins!` : 'Draw!'}
            </span>
          )}
        </div>

        {/* Board */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          backgroundColor: '#333',
          padding: '10px',
          borderRadius: '10px'
        }}>
          {board.map((cell, idx) => (
            <div
              key={idx}
              onClick={() => handleClick(idx)}
              style={{
                backgroundColor: 'white',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 'bold',
                cursor: gameStatus === 'playing' && (!board[idx]) ? 'pointer' : 'default',
                color: cell === 'X' ? '#ff6b6b' : '#4ecdc4',
                borderRadius: '5px'
              }}
            >
              {cell}
            </div>
          ))}
        </div>

        {/* Reset */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={resetGame}
            style={{
              backgroundColor: '#333',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={18} /> New Game
          </button>
        </div>

      </div>
    </GameWrapper>
  );
};

export default TicTacToe;
