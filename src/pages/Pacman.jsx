import React, { useRef, useEffect, useState } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw, Play } from 'lucide-react';

const TILE_SIZE = 20;
const MAP_WIDTH = 19;
const MAP_HEIGHT = 21;

// 1: Wall, 0: Pellet, 2: Empty, 3: Ghost House, 4: Pacman Start
const LEVEL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,1,3,1,1,2,1,0,1,1,1,1],
  [2,2,2,2,0,2,2,1,3,3,3,1,2,2,0,2,2,2,2],
  [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,0,4,0,0,0,0,0,1,0,0,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] // Padding row
];

const Pacman = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const gameState = useRef({
    pacman: { x: 9 * TILE_SIZE + 10, y: 16 * TILE_SIZE + 10, dir: {x:0, y:0}, nextDir: {x:0, y:0}, speed: 2 },
    ghosts: [
      { x: 9 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, color: '#ff6b6b', dir: {x:0, y:0}, speed: 1.5 }, // Blinky
      { x: 8 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, color: '#4ecdc4', dir: {x:0, y:0}, speed: 1.5 }, // Inky
      { x: 10 * TILE_SIZE + 10, y: 10 * TILE_SIZE + 10, color: '#ffe66d', dir: {x:0, y:0}, speed: 1.5 } // Clyde
    ],
    map: [],
    pelletsRemaining: 0
  });

  const initGame = () => {
    // Deep copy map
    const newMap = LEVEL_MAP.map(row => [...row]);
    let pellets = 0;
    newMap.forEach(row => row.forEach(cell => { if(cell === 0) pellets++; }));

    gameState.current = {
      pacman: { x: 9 * TILE_SIZE + 10, y: 16 * TILE_SIZE + 10, dir: {x:1, y:0}, nextDir: {x:1, y:0}, speed: 2 },
      ghosts: [
        { x: 9 * TILE_SIZE + 10, y: 8 * TILE_SIZE + 10, color: '#ff6b6b', dir: {x:0, y:0}, speed: 2 },
        { x: 8 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: '#4ecdc4', dir: {x:0, y:0}, speed: 1.5 },
        { x: 10 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: '#ffe66d', dir: {x:0, y:0}, speed: 1 }
      ],
      map: newMap,
      pelletsRemaining: pellets
    };

    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      const state = gameState.current;
      switch(e.key) {
        case 'ArrowUp': state.pacman.nextDir = {x:0, y:-1}; break;
        case 'ArrowDown': state.pacman.nextDir = {x:0, y:1}; break;
        case 'ArrowLeft': state.pacman.nextDir = {x:-1, y:0}; break;
        case 'ArrowRight': state.pacman.nextDir = {x:1, y:0}; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const update = () => {
    if (!isPlaying || gameOver || won) return;

    const state = gameState.current;

    // --- Pacman Logic ---
    moveEntity(state.pacman, state.map, true);

    // Eat Pellets
    const gridX = Math.floor(state.pacman.x / TILE_SIZE);
    const gridY = Math.floor(state.pacman.y / TILE_SIZE);

    if (state.map[gridY] && state.map[gridY][gridX] === 0) {
      // Check if center is reached close enough to eat
      const centerX = gridX * TILE_SIZE + TILE_SIZE/2;
      const centerY = gridY * TILE_SIZE + TILE_SIZE/2;
      const dist = Math.abs(state.pacman.x - centerX) + Math.abs(state.pacman.y - centerY);

      if (dist < 5) {
        state.map[gridY][gridX] = 2; // Empty
        setScore(s => s + 10);
        state.pelletsRemaining--;
        if (state.pelletsRemaining <= 0) {
          setWon(true);
          setIsPlaying(false);
        }
      }
    }

    // --- Ghost Logic ---
    state.ghosts.forEach(ghost => {
      // Simple random movement at intersections
      const gx = Math.floor(ghost.x / TILE_SIZE);
      const gy = Math.floor(ghost.y / TILE_SIZE);

      // If centered in tile, maybe change direction
      const centerX = gx * TILE_SIZE + TILE_SIZE/2;
      const centerY = gy * TILE_SIZE + TILE_SIZE/2;

      if (Math.abs(ghost.x - centerX) < 2 && Math.abs(ghost.y - centerY) < 2) {
         // Get valid directions
         const dirs = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
         const validDirs = dirs.filter(d => !isWall(gx + d.x, gy + d.y, state.map));

         // Dont go back immediately if possible
         const forwardDirs = validDirs.filter(d => !(d.x === -ghost.dir.x && d.y === -ghost.dir.y));

         if (forwardDirs.length > 0) {
             // Bias towards Pacman
             // Simple chase
             forwardDirs.sort((a,b) => {
                 const da = Math.abs((gx + a.x) - (state.pacman.x/TILE_SIZE)) + Math.abs((gy + a.y) - (state.pacman.y/TILE_SIZE));
                 const db = Math.abs((gx + b.x) - (state.pacman.x/TILE_SIZE)) + Math.abs((gy + b.y) - (state.pacman.y/TILE_SIZE));
                 return da - db;
             });
             // Add randomness
             if (Math.random() < 0.3) {
                 ghost.dir = forwardDirs[Math.floor(Math.random() * forwardDirs.length)];
             } else {
                 ghost.dir = forwardDirs[0];
             }
         } else if (validDirs.length > 0) {
             ghost.dir = validDirs[0];
         } else {
             // Dead end (shouldn't happen in pacman loops usually)
             ghost.dir = {x: -ghost.dir.x, y: -ghost.dir.y};
         }
      }

      moveEntity(ghost, state.map, false);

      // Collision with Pacman
      const dist = Math.abs(state.pacman.x - ghost.x) + Math.abs(state.pacman.y - ghost.y);
      if (dist < TILE_SIZE / 1.5) {
         handleDeath();
      }
    });

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const handleDeath = () => {
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setGameOver(true);
        setIsPlaying(false);
      } else {
        // Reset positions
        const state = gameState.current;
        state.pacman.x = 9 * TILE_SIZE + 10;
        state.pacman.y = 16 * TILE_SIZE + 10;
        state.pacman.dir = {x:1, y:0};
        state.pacman.nextDir = {x:1, y:0};

        state.ghosts[0].x = 9 * TILE_SIZE + 10; state.ghosts[0].y = 8 * TILE_SIZE + 10;
        state.ghosts[1].x = 8 * TILE_SIZE + 10; state.ghosts[1].y = 9 * TILE_SIZE + 10;
        state.ghosts[2].x = 10 * TILE_SIZE + 10; state.ghosts[2].y = 9 * TILE_SIZE + 10;
      }
      return newLives;
    });
  };

  const isWall = (c, r, map) => {
    if (r < 0 || r >= MAP_HEIGHT || c < 0 || c >= MAP_WIDTH) return true;
    return map[r][c] === 1;
  };

  const moveEntity = (entity, map, isPlayer) => {
    // Try to turn if valid
    if (isPlayer && (entity.nextDir.x !== entity.dir.x || entity.nextDir.y !== entity.dir.y)) {
        // Check if nextDir is valid from CURRENT snapped position
        const gx = Math.round((entity.x - 10) / TILE_SIZE);
        const gy = Math.round((entity.y - 10) / TILE_SIZE);

        // Only turn if we are close to center of tile
        const centerX = gx * TILE_SIZE + 10;
        const centerY = gy * TILE_SIZE + 10;

        if (Math.abs(entity.x - centerX) < 3 && Math.abs(entity.y - centerY) < 3) {
            if (!isWall(gx + entity.nextDir.x, gy + entity.nextDir.y, map)) {
                entity.x = centerX;
                entity.y = centerY;
                entity.dir = entity.nextDir;
            }
        }
    }

    const nextX = entity.x + entity.dir.x * entity.speed;
    const nextY = entity.y + entity.dir.y * entity.speed;

    // Check wall collision ahead
    // To do this robustly, check the tile corners of the entity box
    const radius = 9;

    // Simple center check + lookahead
    // Determine grid cell of the "front" of the entity
    const checkX = Math.floor((nextX + entity.dir.x * radius) / TILE_SIZE);
    const checkY = Math.floor((nextY + entity.dir.y * radius) / TILE_SIZE);

    if (!isWall(checkX, checkY, map)) {
       entity.x = nextX;
       entity.y = nextY;
    } else {
       // Snap to center if stopped?
       // entity.dir = {x:0, y:0};
    }

    // Tunnel (Wrap around)
    if (entity.x < 0) entity.x = MAP_WIDTH * TILE_SIZE;
    if (entity.x > MAP_WIDTH * TILE_SIZE) entity.x = 0;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = gameState.current;

    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    state.map.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (cell === 1) {
          ctx.fillStyle = '#0984e3';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#0984e3';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.shadowBlur = 0;

          // Inner detail to look cooler
          ctx.fillStyle = '#1e272e';
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        } else if (cell === 0) {
          ctx.fillStyle = '#ffeaa7';
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 2, 0, Math.PI*2);
          ctx.fill();
        }
      });
    });

    // Draw Pacman
    const pm = state.pacman;
    ctx.fillStyle = '#ffeaa7';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffeaa7';
    ctx.beginPath();
    // Mouth logic
    const angle = Math.atan2(pm.dir.y, pm.dir.x);
    const bite = (Date.now() % 200) / 100 * 0.5;
    ctx.arc(pm.x, pm.y, 8, angle + bite, angle + 2*Math.PI - bite);
    ctx.lineTo(pm.x, pm.y);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Ghosts
    state.ghosts.forEach(g => {
       ctx.fillStyle = g.color;
       ctx.beginPath();
       ctx.arc(g.x, g.y - 2, 8, Math.PI, 0);
       ctx.lineTo(g.x + 8, g.y + 8);
       ctx.lineTo(g.x - 8, g.y + 8);
       ctx.fill();

       // Eyes
       ctx.fillStyle = 'white';
       ctx.beginPath(); ctx.arc(g.x - 3, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(g.x + 3, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
       ctx.fillStyle = 'black';
       ctx.beginPath(); ctx.arc(g.x - 3 + g.dir.x*2, g.y - 2 + g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(g.x + 3 + g.dir.x*2, g.y - 2 + g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill();
    });
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    } else {
        // Initial draw
        setTimeout(draw, 100);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, gameOver, won]);

  return (
    <GameWrapper title="Pacman" color="#eb4d4b">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '1rem',
          fontWeight: 'bold'
        }}>
          <div>Score: <span style={{ color: '#eb4d4b' }}>{score}</span></div>
          <div>Lives: {lives}</div>
        </div>

        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH * TILE_SIZE}
            height={MAP_HEIGHT * TILE_SIZE}
            style={{
              backgroundColor: '#1e272e',
              border: '4px solid #333',
              borderRadius: '4px',
              boxShadow: '0 0 20px rgba(0,0,0,0.3)'
            }}
          />

          {(!isPlaying || gameOver || won) && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
               {gameOver ? (
                 <h2 style={{ fontSize: '2rem', color: '#e74c3c' }}>Game Over</h2>
               ) : won ? (
                 <h2 style={{ fontSize: '2rem', color: '#2ecc71' }}>You Win!</h2>
               ) : null}

               <button
                 onClick={initGame}
                 style={{
                   marginTop: '1rem',
                   fontSize: '1.2rem',
                   padding: '1rem 2rem',
                   backgroundColor: '#eb4d4b',
                   color: 'white',
                   display: 'flex', alignItems: 'center', gap: '0.5rem'
                 }}
               >
                 <Play /> {gameOver || won ? 'Play Again' : 'Start'}
               </button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
};

export default Pacman;
