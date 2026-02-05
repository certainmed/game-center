import React, { useState, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw } from 'lucide-react';

const Game2048 = () => {
  const [board, setBoard] = useState(Array(16).fill(null));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Initialize
  useEffect(() => {
    initializeGame();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;

      let moved = false;
      if (e.key === 'ArrowUp') moved = moveUp();
      else if (e.key === 'ArrowDown') moved = moveDown();
      else if (e.key === 'ArrowLeft') moved = moveLeft();
      else if (e.key === 'ArrowRight') moved = moveRight();

      if (moved) {
        setTimeout(() => addNewTile(), 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver]);

  const initializeGame = () => {
    let newBoard = Array(16).fill(null);
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
  };

  const addRandomTile = (currentBoard) => {
    const emptyIndices = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return currentBoard;

    const idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[idx] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const addNewTile = () => {
    setBoard(prev => {
      const newBoard = addRandomTile(prev);
      if (isGameOver(newBoard)) {
        setGameOver(true);
      }
      return newBoard;
    });
  };

  const isGameOver = (currentBoard) => {
    if (currentBoard.includes(null)) return false;

    // Check for merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const val = currentBoard[i * 4 + j];
        // Check right
        if (j < 3 && val === currentBoard[i * 4 + j + 1]) return false;
        // Check down
        if (i < 3 && val === currentBoard[(i + 1) * 4 + j]) return false;
      }
    }
    return true;
  };

  // Move Logic
  const moveLeft = () => {
    let newBoard = [...board];
    let moved = false;
    let addedScore = 0;

    for (let i = 0; i < 4; i++) {
      let row = [newBoard[i*4], newBoard[i*4+1], newBoard[i*4+2], newBoard[i*4+3]];
      let filtered = row.filter(val => val);

      for (let j = 0; j < filtered.length - 1; j++) {
        if (filtered[j] === filtered[j+1]) {
          filtered[j] *= 2;
          addedScore += filtered[j];
          filtered.splice(j+1, 1);
        }
      }

      while (filtered.length < 4) filtered.push(null);

      if (row.some((val, idx) => val !== filtered[idx])) moved = true;

      newBoard[i*4] = filtered[0];
      newBoard[i*4+1] = filtered[1];
      newBoard[i*4+2] = filtered[2];
      newBoard[i*4+3] = filtered[3];
    }

    if (moved) {
      setBoard(newBoard);
      setScore(s => s + addedScore);
    }
    return moved;
  };

  const moveRight = () => {
    let newBoard = [...board];
    let moved = false;
    let addedScore = 0;

    for (let i = 0; i < 4; i++) {
      let row = [newBoard[i*4], newBoard[i*4+1], newBoard[i*4+2], newBoard[i*4+3]];
      let filtered = row.filter(val => val);

      // Right specific merge logic (from right to left in the filtered array)
      for (let j = filtered.length - 1; j > 0; j--) {
        if (filtered[j] === filtered[j-1]) {
          filtered[j] *= 2;
          addedScore += filtered[j];
          filtered.splice(j-1, 1);
          j--; // Adjust index
        }
      }

      while (filtered.length < 4) filtered.unshift(null);

      if (row.some((val, idx) => val !== filtered[idx])) moved = true;

      newBoard[i*4] = filtered[0];
      newBoard[i*4+1] = filtered[1];
      newBoard[i*4+2] = filtered[2];
      newBoard[i*4+3] = filtered[3];
    }

    if (moved) {
      setBoard(newBoard);
      setScore(s => s + addedScore);
    }
    return moved;
  };

  const moveUp = () => {
    let newBoard = [...board];
    let moved = false;
    let addedScore = 0;

    for (let j = 0; j < 4; j++) {
      let col = [newBoard[j], newBoard[j+4], newBoard[j+8], newBoard[j+12]];
      let filtered = col.filter(val => val);

      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i+1]) {
          filtered[i] *= 2;
          addedScore += filtered[i];
          filtered.splice(i+1, 1);
        }
      }

      while (filtered.length < 4) filtered.push(null);

      if (col.some((val, idx) => val !== filtered[idx])) moved = true;

      newBoard[j] = filtered[0];
      newBoard[j+4] = filtered[1];
      newBoard[j+8] = filtered[2];
      newBoard[j+12] = filtered[3];
    }

    if (moved) {
      setBoard(newBoard);
      setScore(s => s + addedScore);
    }
    return moved;
  };

  const moveDown = () => {
    let newBoard = [...board];
    let moved = false;
    let addedScore = 0;

    for (let j = 0; j < 4; j++) {
      let col = [newBoard[j], newBoard[j+4], newBoard[j+8], newBoard[j+12]];
      let filtered = col.filter(val => val);

      for (let i = filtered.length - 1; i > 0; i--) {
        if (filtered[i] === filtered[i-1]) {
          filtered[i] *= 2;
          addedScore += filtered[i];
          filtered.splice(i-1, 1);
          i--;
        }
      }

      while (filtered.length < 4) filtered.unshift(null);

      if (col.some((val, idx) => val !== filtered[idx])) moved = true;

      newBoard[j] = filtered[0];
      newBoard[j+4] = filtered[1];
      newBoard[j+8] = filtered[2];
      newBoard[j+12] = filtered[3];
    }

    if (moved) {
      setBoard(newBoard);
      setScore(s => s + addedScore);
    }
    return moved;
  };

  const getTileColor = (value) => {
    const colors = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  };

  const getTextColor = (value) => {
    return value >= 8 ? '#f9f6f2' : '#776e65';
  };

  return (
    <GameWrapper title="2048 Endless" color="#ffe66d">
      <div style={{ maxWidth: '400px', width: '100%' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#bbada0',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            Score: {score}
          </div>
          <button
            onClick={initializeGame}
            style={{
              backgroundColor: '#8f7a66',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={18} /> Restart
          </button>
        </div>

        <div style={{
          backgroundColor: '#bbada0',
          padding: '10px',
          borderRadius: '10px',
          position: 'relative'
        }}>
          {gameOver && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(238, 228, 218, 0.73)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '10px'
            }}>
              <h2 style={{ fontSize: '3rem', color: '#776e65', marginBottom: '1rem' }}>Game Over!</h2>
              <button
                onClick={initializeGame}
                style={{
                  backgroundColor: '#8f7a66',
                  color: 'white',
                  fontSize: '1.2rem',
                  padding: '1rem 2rem'
                }}
              >
                Try Again
              </button>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px'
          }}>
            {board.map((cell, idx) => (
              <div
                key={idx}
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  backgroundColor: cell ? getTileColor(cell) : 'rgba(238, 228, 218, 0.35)',
                  color: cell ? getTextColor(cell) : 'transparent',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cell > 1000 ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.1s ease-in-out'
                }}
              >
                {cell}
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#776e65' }}>
          Use Arrow Keys to move tiles
        </p>

      </div>
    </GameWrapper>
  );
};

export default Game2048;
