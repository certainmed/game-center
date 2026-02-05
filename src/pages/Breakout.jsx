import React, { useRef, useState, useEffect } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw, Play, Pause } from 'lucide-react';

const Breakout = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [difficulty, setDifficulty] = useState('normal'); // easy, normal, hard

  // Game Constants
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  const BALL_RADIUS = 8;
  const PADDLE_HEIGHT = 15;
  const BRICK_ROW_COUNT = 5;
  const BRICK_COLUMN_COUNT = 8;
  const BRICK_PADDING = 10;
  const BRICK_OFFSET_TOP = 30;
  const BRICK_OFFSET_LEFT = 35;
  // Calculated brick width
  const BRICK_WIDTH = (CANVAS_WIDTH - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT;

  // Game State (Refs for performance in loop)
  const gameState = useRef({
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 4, dy: -4 },
    paddle: { x: (CANVAS_WIDTH - 100) / 2, width: 100 },
    bricks: [],
    score: 0,
    lives: 3
  });

  const initGame = () => {
    // Difficulty settings
    let speed = 4;
    let paddleW = 100;

    if (difficulty === 'easy') { speed = 3; paddleW = 120; }
    if (difficulty === 'hard') { speed = 6; paddleW = 80; }

    const bricks = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      bricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, color: `hsl(${c * 45}, 70%, 50%)` };
      }
    }

    gameState.current = {
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: speed, dy: -speed },
      paddle: { x: (CANVAS_WIDTH - paddleW) / 2, width: paddleW },
      bricks: bricks,
      score: 0,
      lives: 3
    };

    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    initGame();
    // eslint-disable-next-line
  }, [difficulty]);

  const update = () => {
    if (!isPlaying || gameOver || won) return;

    const state = gameState.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ball movement
    state.ball.x += state.ball.dx;
    state.ball.y += state.ball.dy;

    // Wall Collision
    if (state.ball.x + state.ball.dx > CANVAS_WIDTH - BALL_RADIUS || state.ball.x + state.ball.dx < BALL_RADIUS) {
      state.ball.dx = -state.ball.dx;
    }
    if (state.ball.y + state.ball.dy < BALL_RADIUS) {
      state.ball.dy = -state.ball.dy;
    } else if (state.ball.y + state.ball.dy > CANVAS_HEIGHT - BALL_RADIUS) {
      // Paddle Collision
      if (state.ball.x > state.ball.paddle.x && state.ball.x < state.ball.paddle.x + state.ball.paddle.width) {
        state.ball.dy = -state.ball.dy;
        // Add some english based on where it hit the paddle
        const hitPoint = state.ball.x - (state.ball.paddle.x + state.ball.paddle.width / 2);
        state.ball.dx = hitPoint * 0.15; // Normalize
      } else {
        // Life Lost
        state.lives--;
        setLives(state.lives);
        if (state.lives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
        } else {
          // Reset ball
          state.ball.x = CANVAS_WIDTH / 2;
          state.ball.y = CANVAS_HEIGHT - 30;
          state.ball.dx = 4;
          state.ball.dy = -4;
          state.ball.paddle.x = (CANVAS_WIDTH - state.ball.paddle.width) / 2;
          // Small pause?
        }
      }
    }

    // Brick Collision
    let activeBricks = 0;
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        const b = state.bricks[c][r];
        if (b.status === 1) {
          activeBricks++;
          if (state.ball.x > b.x && state.ball.x < b.x + BRICK_WIDTH && state.ball.y > b.y && state.ball.y < b.y + 20) {
            state.ball.dy = -state.ball.dy;
            b.status = 0;
            state.score++;
            setScore(state.score);
          }
        }
      }
    }

    if (activeBricks === 0) {
        setWon(true);
        setIsPlaying(false);
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = gameState.current;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Bricks
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        if (state.bricks[c][r].status === 1) {
          const brickX = (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT;
          const brickY = (r * (20 + BRICK_PADDING)) + BRICK_OFFSET_TOP;
          state.bricks[c][r].x = brickX;
          state.bricks[c][r].y = brickY;

          ctx.beginPath();
          ctx.rect(brickX, brickY, BRICK_WIDTH, 20);
          ctx.fillStyle = state.bricks[c][r].color;
          ctx.fill();
          ctx.closePath();
        }
      }
    }

    // Draw Paddle
    ctx.beginPath();
    ctx.rect(state.paddle.x, CANVAS_HEIGHT - PADDLE_HEIGHT, state.paddle.width, PADDLE_HEIGHT);
    ctx.fillStyle = "#ff9f43";
    ctx.fill();
    ctx.closePath();

    // Draw Ball
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();
    ctx.closePath();
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      draw(); // Draw initial state
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, gameOver, won]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const state = gameState.current;

    if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
      state.paddle.x = relativeX - state.paddle.width / 2;
      // Clamp
      if (state.paddle.x < 0) state.paddle.x = 0;
      if (state.paddle.x + state.paddle.width > CANVAS_WIDTH) state.paddle.x = CANVAS_WIDTH - state.paddle.width;

      if (!isPlaying) draw(); // Redraw paddle while paused
    }
  };

  return (
    <GameWrapper title="Block Breaker" color="#ff9f43">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '600px',
          alignItems: 'center'
        }}>
          <div style={{ fontWeight: 'bold' }}>
            Score: <span style={{ color: '#ff9f43' }}>{score}</span> | Lives: {lives}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
             {['easy', 'normal', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setIsPlaying(false); }}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.8rem',
                    backgroundColor: difficulty === d ? '#ff9f43' : '#eee',
                    color: difficulty === d ? 'white' : '#333'
                  }}
                >
                  {d}
                </button>
             ))}
          </div>

          <button
            onClick={() => { initGame(); setIsPlaying(true); }}
            style={{
              backgroundColor: '#333',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem'
            }}
          >
            <RefreshCw size={16} /> Reset
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            style={{
              backgroundColor: '#f0f4f8',
              border: '4px solid #333',
              borderRadius: '8px',
              cursor: 'none', // Hide cursor over canvas for immersion
              maxWidth: '100%',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}
          />

          {(!isPlaying || gameOver || won) && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.6)',
              borderRadius: '4px'
            }}>
              {gameOver ? (
                <h2 style={{ fontSize: '2rem', color: '#e74c3c' }}>Game Over</h2>
              ) : won ? (
                <h2 style={{ fontSize: '2rem', color: '#2ecc71' }}>You Win!</h2>
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  style={{
                    fontSize: '1.5rem',
                    padding: '1rem 2rem',
                    backgroundColor: '#ff9f43',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <Play size={32} /> Start
                </button>
              )}

              {(gameOver || won) && (
                 <button
                  onClick={() => { initGame(); setIsPlaying(true); }}
                  style={{
                    marginTop: '1rem',
                    fontSize: '1.2rem',
                    padding: '0.8rem 1.5rem',
                    backgroundColor: '#333',
                    color: 'white'
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ marginTop: '1rem', color: '#666' }}>
          Move your mouse to control the paddle
        </p>
      </div>
    </GameWrapper>
  );
};

export default Breakout;
