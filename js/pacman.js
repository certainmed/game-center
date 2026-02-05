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
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const btnStart = document.getElementById('btn-start');

let state = {
    score: 0,
    lives: 3,
    isPlaying: false,
    gameOver: false,
    won: false,
    pacman: {},
    ghosts: [],
    map: [],
    pelletsRemaining: 0
};

let requestRef;

function init() {
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;

    btnStart.addEventListener('click', () => {
        if (!state.isPlaying) {
             initGame();
        }
    });

    window.addEventListener('keydown', handleKeyDown);

    // Initial Draw (Empty map background)
    state.map = LEVEL_MAP.map(row => [...row]);
    draw();
}

function initGame() {
    const newMap = LEVEL_MAP.map(row => [...row]);
    let pellets = 0;
    newMap.forEach(row => row.forEach(cell => { if(cell === 0) pellets++; }));

    state = {
        score: 0,
        lives: 3,
        isPlaying: true,
        gameOver: false,
        won: false,
        pacman: { x: 9 * TILE_SIZE + 10, y: 16 * TILE_SIZE + 10, dir: {x:1, y:0}, nextDir: {x:1, y:0}, speed: 2 },
        ghosts: [
            { x: 9 * TILE_SIZE + 10, y: 8 * TILE_SIZE + 10, color: '#ff6b6b', dir: {x:0, y:0}, speed: 2 },
            { x: 8 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: '#4ecdc4', dir: {x:0, y:0}, speed: 1.5 },
            { x: 10 * TILE_SIZE + 10, y: 9 * TILE_SIZE + 10, color: '#ffe66d', dir: {x:0, y:0}, speed: 1 }
        ],
        map: newMap,
        pelletsRemaining: pellets
    };

    renderUI();
    update();
}

function handleKeyDown(e) {
    if (!state.isPlaying) return;
    switch(e.key) {
        case 'ArrowUp': state.pacman.nextDir = {x:0, y:-1}; break;
        case 'ArrowDown': state.pacman.nextDir = {x:0, y:1}; break;
        case 'ArrowLeft': state.pacman.nextDir = {x:-1, y:0}; break;
        case 'ArrowRight': state.pacman.nextDir = {x:1, y:0}; break;
    }
}

function update() {
    if (!state.isPlaying) return;

    // Pacman Movement
    moveEntity(state.pacman, state.map, true);

    // Eating
    const gridX = Math.floor(state.pacman.x / TILE_SIZE);
    const gridY = Math.floor(state.pacman.y / TILE_SIZE);

    if (state.map[gridY] && state.map[gridY][gridX] === 0) {
        const centerX = gridX * TILE_SIZE + TILE_SIZE/2;
        const centerY = gridY * TILE_SIZE + TILE_SIZE/2;
        const dist = Math.abs(state.pacman.x - centerX) + Math.abs(state.pacman.y - centerY);

        if (dist < 5) {
            state.map[gridY][gridX] = 2; // Empty
            state.score += 10;
            state.pelletsRemaining--;
            if (state.pelletsRemaining <= 0) {
                state.won = true;
                state.isPlaying = false;
            }
        }
    }

    // Ghost Logic
    state.ghosts.forEach(ghost => {
        const gx = Math.floor(ghost.x / TILE_SIZE);
        const gy = Math.floor(ghost.y / TILE_SIZE);
        const centerX = gx * TILE_SIZE + TILE_SIZE/2;
        const centerY = gy * TILE_SIZE + TILE_SIZE/2;

        if (Math.abs(ghost.x - centerX) < 2 && Math.abs(ghost.y - centerY) < 2) {
            const dirs = [{x:0,y:-1}, {x:0,y:1}, {x:-1,y:0}, {x:1,y:0}];
            const validDirs = dirs.filter(d => !isWall(gx + d.x, gy + d.y, state.map));
            const forwardDirs = validDirs.filter(d => !(d.x === -ghost.dir.x && d.y === -ghost.dir.y));

            if (forwardDirs.length > 0) {
                 forwardDirs.sort((a,b) => {
                     const da = Math.abs((gx + a.x) - (state.pacman.x/TILE_SIZE)) + Math.abs((gy + a.y) - (state.pacman.y/TILE_SIZE));
                     const db = Math.abs((gx + b.x) - (state.pacman.x/TILE_SIZE)) + Math.abs((gy + b.y) - (state.pacman.y/TILE_SIZE));
                     return da - db;
                 });
                 if (Math.random() < 0.3) {
                     ghost.dir = forwardDirs[Math.floor(Math.random() * forwardDirs.length)];
                 } else {
                     ghost.dir = forwardDirs[0];
                 }
            } else if (validDirs.length > 0) {
                 ghost.dir = validDirs[0];
            } else {
                 ghost.dir = {x: -ghost.dir.x, y: -ghost.dir.y};
            }
        }

        moveEntity(ghost, state.map, false);

        // Collision
        const dist = Math.abs(state.pacman.x - ghost.x) + Math.abs(state.pacman.y - ghost.y);
        if (dist < TILE_SIZE / 1.5) {
            handleDeath();
        }
    });

    renderUI();
    draw();

    if (state.isPlaying) {
        requestRef = requestAnimationFrame(update);
    }
}

function handleDeath() {
    state.lives--;
    if (state.lives <= 0) {
        state.gameOver = true;
        state.isPlaying = false;
    } else {
        // Reset positions
        state.pacman.x = 9 * TILE_SIZE + 10;
        state.pacman.y = 16 * TILE_SIZE + 10;
        state.pacman.dir = {x:1, y:0};
        state.pacman.nextDir = {x:1, y:0};

        state.ghosts[0].x = 9 * TILE_SIZE + 10; state.ghosts[0].y = 8 * TILE_SIZE + 10;
        state.ghosts[1].x = 8 * TILE_SIZE + 10; state.ghosts[1].y = 9 * TILE_SIZE + 10;
        state.ghosts[2].x = 10 * TILE_SIZE + 10; state.ghosts[2].y = 9 * TILE_SIZE + 10;
    }
}

function isWall(c, r, map) {
    if (r < 0 || r >= MAP_HEIGHT || c < 0 || c >= MAP_WIDTH) return true;
    return map[r][c] === 1;
}

function moveEntity(entity, map, isPlayer) {
    if (isPlayer && (entity.nextDir.x !== entity.dir.x || entity.nextDir.y !== entity.dir.y)) {
        const gx = Math.round((entity.x - 10) / TILE_SIZE);
        const gy = Math.round((entity.y - 10) / TILE_SIZE);
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
    const radius = 9;
    const checkX = Math.floor((nextX + entity.dir.x * radius) / TILE_SIZE);
    const checkY = Math.floor((nextY + entity.dir.y * radius) / TILE_SIZE);

    if (!isWall(checkX, checkY, map)) {
       entity.x = nextX;
       entity.y = nextY;
    }

    if (entity.x < 0) entity.x = MAP_WIDTH * TILE_SIZE;
    if (entity.x > MAP_WIDTH * TILE_SIZE) entity.x = 0;
}

function draw() {
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Map
    state.map.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        if (cell === 1) {
          ctx.fillStyle = '#0984e3';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
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

    // Pacman
    const pm = state.pacman;
    if (pm.x) {
        ctx.fillStyle = '#ffeaa7';
        ctx.beginPath();
        const angle = Math.atan2(pm.dir.y, pm.dir.x);
        const bite = (Date.now() % 200) / 100 * 0.5;
        ctx.arc(pm.x, pm.y, 8, angle + bite, angle + 2*Math.PI - bite);
        ctx.lineTo(pm.x, pm.y);
        ctx.fill();
    }

    // Ghosts
    state.ghosts.forEach(g => {
       ctx.fillStyle = g.color;
       ctx.beginPath();
       ctx.arc(g.x, g.y - 2, 8, Math.PI, 0);
       ctx.lineTo(g.x + 8, g.y + 8);
       ctx.lineTo(g.x - 8, g.y + 8);
       ctx.fill();
       ctx.fillStyle = 'white';
       ctx.beginPath(); ctx.arc(g.x - 3, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(g.x + 3, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
       ctx.fillStyle = 'black';
       ctx.beginPath(); ctx.arc(g.x - 3 + g.dir.x*2, g.y - 2 + g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(g.x + 3 + g.dir.x*2, g.y - 2 + g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill();
    });
}

function renderUI() {
    scoreEl.textContent = state.score;
    livesEl.textContent = state.lives;

    if (!state.isPlaying || state.gameOver || state.won) {
        overlay.classList.remove('hidden');
        if (state.gameOver) {
            overlayTitle.textContent = "Game Over";
            overlayTitle.style.color = "#e74c3c";
            overlayTitle.classList.remove('hidden');
            btnStart.innerHTML = 'Play Again';
        } else if (state.won) {
            overlayTitle.textContent = "You Win!";
            overlayTitle.style.color = "#2ecc71";
            overlayTitle.classList.remove('hidden');
            btnStart.innerHTML = 'Play Again';
        } else {
            overlayTitle.classList.add('hidden');
            btnStart.innerHTML = '<i data-lucide="play"></i> Start';
            lucide.createIcons();
        }
    } else {
        overlay.classList.add('hidden');
    }
}

init();
