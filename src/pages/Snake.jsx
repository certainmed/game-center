import React, { useState, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw, Play, User, Cpu, Users } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const MOVES = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const Snake = () => {
  const [mode, setMode] = useState('single'); // single, ai-vs-ai, human-vs-ai
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState(null); // 'left', 'right', 'tie'

  // Refs for game state to avoid closure staleness in loop
  const gameState = useRef({
    boards: [] // Array of board objects
  });

  const requestRef = useRef();
  const canvasRefs = useRef([]);

  // Initialization
  const initGame = () => {
    const createBoard = (isAi) => ({
      snake: [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }],
      direction: MOVES.UP,
      nextDirection: MOVES.UP, // Buffer for input
      food: { x: 5, y: 5 },
      color: isAi ? '#ff6b6b' : '#2ecc71',
      isAi: isAi,
      score: 0,
      alive: true
    });

    let boards = [];
    if (mode === 'single') {
      boards = [createBoard(false)];
    } else if (mode === 'ai-vs-ai') {
      // For same board AI vs AI, we need special handling.
      // User requirements: "Two snakes on the same board for AI vs AI"
      // Wait, my architecture assumed separate boards.
      // Let's adapt. If ai-vs-ai, we have 1 board with 2 snakes?
      // Or just reuse the logic.
      // Let's make "boards" represent "contexts".
      // If AI vs AI (Same Board), we have ONE board context but TWO snakes in it.
      // But my `checkCollision` logic would need to handle multiple snakes.

      // Let's simplify:
      // Mode 'single': 1 board, 1 snake.
      // Mode 'human-vs-ai': 2 boards, 1 snake each (Split screen).
      // Mode 'ai-vs-ai': 1 board, 2 snakes.

      // Actually, implementing 'ai-vs-ai' on same board is complex for collision (head-to-head, head-to-body).
      // Let's implement it as:
      // Board object has `snakes` array.

      boards = [{
        width: GRID_SIZE,
        height: GRID_SIZE,
        snakes: [
          { ...createBoard(true).snake, body: [{x:5, y:10}], direction: MOVES.UP, color: '#ff6b6b', id: 1 }, // This structure is getting messy if I mix types.
          { ...createBoard(true).snake, body: [{x:15, y:10}], direction: MOVES.UP, color: '#4ecdc4', id: 2 }
        ],
        food: { x: 10, y: 5 }
      }];

      // Redesigning state structure for flexibility:
      // Game has `contexts`. Each context is a canvas.
      // Single: 1 context, 1 snake.
      // Human vs AI: 2 contexts, 1 snake each.
      // AI vs AI: 1 context, 2 snakes.

    } else { // human-vs-ai
      boards = [createBoard(false), createBoard(true)];
    }

    // ACTUALLY, to keep it manageable and robust given the time:
    // I will implement a unified `GameEngine` that takes a configuration.

    // Let's stick to the "Context" approach.
    // But for AI vs AI on same board, it's just 1 context with 2 snakes.

    const initialSnakes1 = mode === 'ai-vs-ai'
      ? [
          { body: [{x: 5, y: 18}, {x:5, y:19}, {x:5, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#ff6b6b', isAi: true, alive: true, score: 0 },
          { body: [{x: 15, y: 18}, {x:15, y:19}, {x:15, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#4ecdc4', isAi: true, alive: true, score: 0 }
        ]
      : [{ body: [{x: 10, y: 18}, {x:10, y:19}, {x:10, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#2ecc71', isAi: false, alive: true, score: 0 }];

    const initialSnakes2 = mode === 'human-vs-ai'
      ? [{ body: [{x: 10, y: 18}, {x:10, y:19}, {x:10, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#ff6b6b', isAi: true, alive: true, score: 0 }]
      : [];

    // State structure:
    // boards: [ { snakes: [], food: {} } ]

    let newBoards = [];

    // Board 1
    newBoards.push({
      snakes: initialSnakes1,
      food: getRandomPos(initialSnakes1),
      id: 1
    });

    // Board 2 (Only for Human vs AI)
    if (mode === 'human-vs-ai') {
      newBoards.push({
        snakes: initialSnakes2,
        food: getRandomPos(initialSnakes2),
        id: 2
      });
    }

    gameState.current = { boards: newBoards };
    setWinner(null);
    setIsPlaying(true);
  };

  const getRandomPos = (snakes) => {
    let x, y, valid;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      valid = true;
      // Check collision with any snake body
      for (let snake of snakes) {
        for (let part of snake.body) {
          if (part.x === x && part.y === y) {
            valid = false; break;
          }
        }
      }
    } while (!valid);
    return { x, y };
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;

      const board0 = gameState.current.boards[0];
      // Human controls snake 0 in board 0 (if not AI)
      if (board0 && board0.snakes.length > 0 && !board0.snakes[0].isAi) {
        const snake = board0.snakes[0];
        switch(e.key) {
          case 'ArrowUp': if (snake.dir !== MOVES.DOWN) snake.nextDir = MOVES.UP; break;
          case 'ArrowDown': if (snake.dir !== MOVES.UP) snake.nextDir = MOVES.DOWN; break;
          case 'ArrowLeft': if (snake.dir !== MOVES.RIGHT) snake.nextDir = MOVES.LEFT; break;
          case 'ArrowRight': if (snake.dir !== MOVES.LEFT) snake.nextDir = MOVES.RIGHT; break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, mode]);


  // Game Loop
  useEffect(() => {
    if (isPlaying) {
      // Speed depends on difficulty
      let speed = 100;
      if (difficulty === 'easy') speed = 150;
      if (difficulty === 'hard') speed = 60;

      const interval = setInterval(update, speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, difficulty, mode]);

  const update = () => {
    const state = gameState.current;
    let anyChange = false;

    state.boards.forEach(board => {
      let boardActive = false;

      // Update each snake
      board.snakes.forEach(snake => {
        if (!snake.alive) return;
        boardActive = true;

        // AI Logic
        if (snake.isAi) {
          snake.nextDir = getAiMove(snake, board.food, board.snakes, GRID_SIZE);
        }

        // Update direction
        snake.dir = snake.nextDir;

        // Move head
        const head = { ...snake.body[0] };
        head.x += snake.dir.x;
        head.y += snake.dir.y;

        // Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          snake.alive = false;
          return;
        }

        // Self/Other Snake Collision
        for (let otherSnake of board.snakes) {
           if (!otherSnake.alive) continue;
           // Check against body parts
           for (let part of otherSnake.body) {
             if (head.x === part.x && head.y === part.y) {
               snake.alive = false;
               return;
             }
           }
        }

        if (!snake.alive) return;

        // Move
        snake.body.unshift(head);

        // Food Collision
        if (head.x === board.food.x && head.y === board.food.y) {
          snake.score += 10;
          board.food = getRandomPos(board.snakes);
        } else {
          snake.body.pop();
        }
      });
    });

    // Check Win Conditions
    if (mode === 'human-vs-ai') {
      const human = state.boards[0].snakes[0];
      const ai = state.boards[1].snakes[0];

      if (!human.alive && ai.alive) {
        setWinner('AI Wins');
        setIsPlaying(false);
      } else if (human.alive && !ai.alive) {
        setWinner('You Win');
        setIsPlaying(false);
      } else if (!human.alive && !ai.alive) {
        setWinner('Draw');
        setIsPlaying(false);
      }
    } else if (mode === 'ai-vs-ai') {
      const s1 = state.boards[0].snakes[0];
      const s2 = state.boards[0].snakes[1];

      if (!s1.alive && s2.alive) { setWinner('Blue Wins'); setIsPlaying(false); }
      else if (s1.alive && !s2.alive) { setWinner('Red Wins'); setIsPlaying(false); }
      else if (!s1.alive && !s2.alive) { setWinner('Draw'); setIsPlaying(false); }
    } else {
      // Single player
      if (!state.boards[0].snakes[0].alive) {
        setWinner('Game Over');
        setIsPlaying(false);
      }
    }

    draw();
  };

  // AI Algorithm
  const getAiMove = (snake, food, allSnakes, gridSize) => {
    const head = snake.body[0];
    const moves = [MOVES.UP, MOVES.DOWN, MOVES.LEFT, MOVES.RIGHT];

    // Filter safe moves
    const safeMoves = moves.filter(move => {
      const nextX = head.x + move.x;
      const nextY = head.y + move.y;

      // Wall
      if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) return false;

      // Bodies
      for (let s of allSnakes) {
        if (!s.alive) continue;
        for (let part of s.body) {
          if (nextX === part.x && nextY === part.y) return false;
        }
      }
      return true;
    });

    if (safeMoves.length === 0) return snake.dir; // No choice, die.

    // Difficulty Logic
    if (difficulty === 'easy') {
      // Random safe move
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    // Medium/Hard: Greedy approach towards food
    // Sort safe moves by distance to food
    safeMoves.sort((a, b) => {
      const distA = Math.abs((head.x + a.x) - food.x) + Math.abs((head.y + a.y) - food.y);
      const distB = Math.abs((head.x + b.x) - food.x) + Math.abs((head.y + b.y) - food.y);
      return distA - distB;
    });

    // For Hard, we should do BFS to ensure we don't get trapped, but Greedy + Safe is decent for 'Hard' in this context without implementing full A*
    // To make it slightly smarter for 'Hard', maybe look 2 steps ahead?
    // Let's stick to Greedy for now, it's usually "Medium-Hard" in feeling.

    return safeMoves[0];
  };

  const draw = () => {
    gameState.current.boards.forEach((board, idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Clear
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Grid (Optional, faint)
      ctx.strokeStyle = '#353b48';
      ctx.lineWidth = 1;
      for (let i=0; i<=GRID_SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i*CELL_SIZE, 0); ctx.lineTo(i*CELL_SIZE, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*CELL_SIZE); ctx.lineTo(CANVAS_SIZE, i*CELL_SIZE); ctx.stroke();
      }

      // Draw Food
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(
        board.food.x * CELL_SIZE + CELL_SIZE/2,
        board.food.y * CELL_SIZE + CELL_SIZE/2,
        CELL_SIZE/2 - 2, 0, Math.PI*2
      );
      ctx.fill();

      // Draw Snakes
      board.snakes.forEach(snake => {
        if (!snake.alive) return; // Or draw dead snake faded?
        ctx.fillStyle = snake.color;
        snake.body.forEach(part => {
          ctx.fillRect(part.x * CELL_SIZE + 1, part.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        });

        // Eyes for Head
        const head = snake.body[0];
        ctx.fillStyle = 'white';
        // Simple logic for eyes based on direction... skipped for brevity, just dots
        ctx.beginPath(); ctx.arc(head.x * CELL_SIZE + 6, head.y * CELL_SIZE + 6, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(head.x * CELL_SIZE + 14, head.y * CELL_SIZE + 6, 2, 0, Math.PI*2); ctx.fill();
      });
    });
  };

  // Trigger initial draw
  useEffect(() => {
    if (!isPlaying) {
      // Clear canvases
       canvasRefs.current.forEach(canvas => {
         if (canvas) {
           const ctx = canvas.getContext('2d');
           ctx.clearRect(0,0,CANVAS_SIZE, CANVAS_SIZE);
           ctx.fillStyle = '#2d3436';
           ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
         }
       });
    }
  }, [isPlaying, mode]);

  return (
    <GameWrapper title="Snake" color="#2ecc71">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { setMode('single'); setIsPlaying(false); }}
            style={{
               backgroundColor: mode === 'single' ? '#2ecc71' : 'white',
               color: mode === 'single' ? 'white' : '#333',
               display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <User size={18} /> Single
          </button>
          <button
            onClick={() => { setMode('ai-vs-ai'); setIsPlaying(false); }}
            style={{
               backgroundColor: mode === 'ai-vs-ai' ? '#2ecc71' : 'white',
               color: mode === 'ai-vs-ai' ? 'white' : '#333',
               display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Users size={18} /> AI vs AI
          </button>
          <button
            onClick={() => { setMode('human-vs-ai'); setIsPlaying(false); }}
            style={{
               backgroundColor: mode === 'human-vs-ai' ? '#2ecc71' : 'white',
               color: mode === 'human-vs-ai' ? 'white' : '#333',
               display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Cpu size={18} /> Human vs AI
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
           {['easy', 'medium', 'hard'].map(d => (
             <button
                key={d}
                onClick={() => { setDifficulty(d); setIsPlaying(false); }}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.8rem',
                  backgroundColor: difficulty === d ? '#333' : '#eee',
                  color: difficulty === d ? 'white' : '#333',
                  textTransform: 'capitalize'
                }}
             >
               {d}
             </button>
           ))}
        </div>

        {winner && (
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: winner.includes('Win') ? '#2ecc71' : '#e74c3c',
            animation: 'popIn 0.3s ease'
          }}>
            {winner}
          </div>
        )}

        {/* Canvases */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Board 1 */}
          <div style={{ position: 'relative' }}>
             {mode === 'human-vs-ai' && <div style={{ textAlign: 'center', marginBottom: '5px', fontWeight: 'bold' }}>You</div>}
             <canvas
                ref={el => canvasRefs.current[0] = el}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{
                  border: '4px solid #333',
                  borderRadius: '4px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                }}
             />
          </div>

          {/* Board 2 (Only Human vs AI) */}
          {mode === 'human-vs-ai' && (
             <div style={{ position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '5px', fontWeight: 'bold' }}>AI</div>
                <canvas
                    ref={el => canvasRefs.current[1] = el}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    style={{
                      border: '4px solid #333',
                      borderRadius: '4px',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                    }}
                />
             </div>
          )}
        </div>

        <button
          onClick={initGame}
          style={{
            marginTop: '1rem',
            backgroundColor: '#333',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.8rem 1.5rem',
            fontSize: '1.2rem'
          }}
        >
          {isPlaying ? <RefreshCw size={20} /> : <Play size={20} />}
          {isPlaying ? 'Restart' : 'Start Game'}
        </button>

      </div>
    </GameWrapper>
  );
};

export default Snake;
