const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const MOVES = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

let state = {
    mode: 'single', // single, ai-vs-ai, human-vs-ai
    difficulty: 'medium',
    isPlaying: false,
    winner: null,
    boards: [] // { snakes: [], food: {}, id: 1 }
};

let gameInterval;
const canvasContainer = document.getElementById('canvas-container');
const btnStart = document.getElementById('btn-start');
const winnerMsg = document.getElementById('winner-msg');
const modeButtons = document.querySelectorAll('.btn-mode');
const diffButtons = document.querySelectorAll('.btn-diff');

function init() {
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Traverse up to button if clicked on icon
            const target = e.target.closest('button');
            setMode(target.dataset.mode);
        });
    });

    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.difficulty = e.target.dataset.diff;
            stopGame();
            renderUI();
        });
    });

    btnStart.addEventListener('click', () => {
        if (state.isPlaying) {
            initGame(); // Restart
        } else {
            initGame();
        }
    });

    window.addEventListener('keydown', handleKeyDown);

    setMode('single');
}

function setMode(mode) {
    state.mode = mode;
    stopGame();
    state.winner = null;

    // Setup Canvases immediately for visual
    setupCanvases();
    // Clear them
    state.boards.forEach((board, idx) => {
        const ctx = document.getElementById(`canvas-${idx}`).getContext('2d');
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    });

    renderUI();
}

function setupCanvases() {
    canvasContainer.innerHTML = '';

    // Determine number of boards
    let numBoards = 1;
    if (state.mode === 'human-vs-ai') numBoards = 2;

    // Create board objects placeholder
    // But actual state is set in initGame. Here just UI.

    for (let i = 0; i < numBoards; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        if (state.mode === 'human-vs-ai') {
            const label = document.createElement('div');
            label.style.textAlign = 'center';
            label.style.marginBottom = '5px';
            label.style.fontWeight = 'bold';
            label.textContent = i === 0 ? 'You' : 'AI';
            wrapper.appendChild(label);
        }

        const canvas = document.createElement('canvas');
        canvas.id = `canvas-${i}`;
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        canvas.style.border = '4px solid #333';
        canvas.style.borderRadius = '4px';
        canvas.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';

        wrapper.appendChild(canvas);
        canvasContainer.appendChild(wrapper);
    }
}

function stopGame() {
    state.isPlaying = false;
    clearInterval(gameInterval);
}

function initGame() {
    stopGame();

    const initialSnakes1 = state.mode === 'ai-vs-ai'
      ? [
          { body: [{x: 5, y: 18}, {x:5, y:19}, {x:5, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#ff6b6b', isAi: true, alive: true, score: 0 },
          { body: [{x: 15, y: 18}, {x:15, y:19}, {x:15, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#4ecdc4', isAi: true, alive: true, score: 0 }
        ]
      : [{ body: [{x: 10, y: 18}, {x:10, y:19}, {x:10, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#2ecc71', isAi: false, alive: true, score: 0 }];

    const initialSnakes2 = state.mode === 'human-vs-ai'
      ? [{ body: [{x: 10, y: 18}, {x:10, y:19}, {x:10, y:20}], dir: MOVES.UP, nextDir: MOVES.UP, color: '#ff6b6b', isAi: true, alive: true, score: 0 }]
      : [];

    let newBoards = [];

    newBoards.push({
      snakes: JSON.parse(JSON.stringify(initialSnakes1)),
      food: getRandomPos(initialSnakes1),
      id: 0
    });

    if (state.mode === 'human-vs-ai') {
      newBoards.push({
        snakes: JSON.parse(JSON.stringify(initialSnakes2)),
        food: getRandomPos(initialSnakes2),
        id: 1
      });
    }

    state.boards = newBoards;
    state.winner = null;
    state.isPlaying = true;

    let speed = 100;
    if (state.difficulty === 'easy') speed = 150;
    if (state.difficulty === 'hard') speed = 60;

    gameInterval = setInterval(update, speed);
    renderUI();
}

function getRandomPos(snakes) {
    let x, y, valid;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      valid = true;
      for (let snake of snakes) {
        for (let part of snake.body) {
          if (part.x === x && part.y === y) {
            valid = false; break;
          }
        }
      }
    } while (!valid);
    return { x, y };
}

function handleKeyDown(e) {
    if (!state.isPlaying) return;

    const board0 = state.boards[0];
    if (board0 && board0.snakes.length > 0 && !board0.snakes[0].isAi) {
        const snake = board0.snakes[0];
        switch(e.key) {
          case 'ArrowUp': if (snake.dir !== MOVES.DOWN) snake.nextDir = MOVES.UP; break;
          case 'ArrowDown': if (snake.dir !== MOVES.UP) snake.nextDir = MOVES.DOWN; break;
          case 'ArrowLeft': if (snake.dir !== MOVES.RIGHT) snake.nextDir = MOVES.LEFT; break;
          case 'ArrowRight': if (snake.dir !== MOVES.LEFT) snake.nextDir = MOVES.RIGHT; break;
        }
    }
}

function update() {
    state.boards.forEach(board => {
        board.snakes.forEach(snake => {
            if (!snake.alive) return;

            if (snake.isAi) {
                snake.nextDir = getAiMove(snake, board.food, board.snakes, GRID_SIZE);
            }

            snake.dir = snake.nextDir;
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
                for (let part of otherSnake.body) {
                    if (head.x === part.x && head.y === part.y) {
                        snake.alive = false;
                        return;
                    }
                }
            }

            if (!snake.alive) return;

            snake.body.unshift(head);

            if (head.x === board.food.x && head.y === board.food.y) {
                snake.score += 10;
                board.food = getRandomPos(board.snakes);
            } else {
                snake.body.pop();
            }
        });
    });

    checkWin();
    draw();
}

function getAiMove(snake, food, allSnakes, gridSize) {
    const head = snake.body[0];
    const moves = [MOVES.UP, MOVES.DOWN, MOVES.LEFT, MOVES.RIGHT];

    const safeMoves = moves.filter(move => {
      const nextX = head.x + move.x;
      const nextY = head.y + move.y;
      if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) return false;
      for (let s of allSnakes) {
        if (!s.alive) continue;
        for (let part of s.body) {
          if (nextX === part.x && nextY === part.y) return false;
        }
      }
      return true;
    });

    if (safeMoves.length === 0) return snake.dir;

    if (state.difficulty === 'easy') {
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    // Medium/Hard: Greedy
    safeMoves.sort((a, b) => {
      const distA = Math.abs((head.x + a.x) - food.x) + Math.abs((head.y + a.y) - food.y);
      const distB = Math.abs((head.x + b.x) - food.x) + Math.abs((head.y + b.y) - food.y);
      return distA - distB;
    });

    return safeMoves[0];
}

function checkWin() {
    let gameOver = false;
    let msg = '';
    let color = '';

    if (state.mode === 'human-vs-ai') {
        const human = state.boards[0].snakes[0];
        const ai = state.boards[1].snakes[0];

        if (!human.alive && ai.alive) { msg = 'AI Wins'; color = '#e74c3c'; gameOver = true; }
        else if (human.alive && !ai.alive) { msg = 'You Win'; color = '#2ecc71'; gameOver = true; }
        else if (!human.alive && !ai.alive) { msg = 'Draw'; color = '#f1c40f'; gameOver = true; }
    } else if (state.mode === 'ai-vs-ai') {
        const s1 = state.boards[0].snakes[0];
        const s2 = state.boards[0].snakes[1];

        if (!s1.alive && s2.alive) { msg = 'Blue Wins'; color = '#4ecdc4'; gameOver = true; }
        else if (s1.alive && !s2.alive) { msg = 'Red Wins'; color = '#ff6b6b'; gameOver = true; }
        else if (!s1.alive && !s2.alive) { msg = 'Draw'; color = '#f1c40f'; gameOver = true; }
    } else {
        if (!state.boards[0].snakes[0].alive) {
            msg = 'Game Over'; color = '#e74c3c'; gameOver = true;
        }
    }

    if (gameOver) {
        state.winner = msg;
        state.winnerColor = color;
        stopGame();
        renderUI();
    }
}

function draw() {
    state.boards.forEach((board, idx) => {
        const canvas = document.getElementById(`canvas-${idx}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Grid
        ctx.strokeStyle = '#353b48';
        ctx.lineWidth = 1;
        for (let i=0; i<=GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i*CELL_SIZE, 0); ctx.lineTo(i*CELL_SIZE, CANVAS_SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i*CELL_SIZE); ctx.lineTo(CANVAS_SIZE, i*CELL_SIZE); ctx.stroke();
        }

        // Food
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(
            board.food.x * CELL_SIZE + CELL_SIZE/2,
            board.food.y * CELL_SIZE + CELL_SIZE/2,
            CELL_SIZE/2 - 2, 0, Math.PI*2
        );
        ctx.fill();

        // Snakes
        board.snakes.forEach(snake => {
            if (!snake.alive) return;
            ctx.fillStyle = snake.color;
            snake.body.forEach(part => {
                ctx.fillRect(part.x * CELL_SIZE + 1, part.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            });

            // Eyes
            const head = snake.body[0];
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(head.x * CELL_SIZE + 6, head.y * CELL_SIZE + 6, 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(head.x * CELL_SIZE + 14, head.y * CELL_SIZE + 6, 2, 0, Math.PI*2); ctx.fill();
        });
    });
}

function renderUI() {
    // Buttons
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === state.mode) {
            btn.style.backgroundColor = '#2ecc71';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = 'white';
            btn.style.color = '#333';
        }
    });

    diffButtons.forEach(btn => {
        if (btn.dataset.diff === state.difficulty) {
            btn.style.backgroundColor = '#333';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '#eee';
            btn.style.color = '#333';
        }
    });

    // Start Button Text
    btnStart.innerHTML = state.isPlaying
        ? '<i data-lucide="refresh-cw" style="width: 20px; height: 20px;"></i> Restart'
        : '<i data-lucide="play" style="width: 20px; height: 20px;"></i> Start Game';
    lucide.createIcons();

    // Winner Msg
    if (state.winner) {
        winnerMsg.textContent = state.winner;
        winnerMsg.style.color = state.winnerColor;
        winnerMsg.classList.remove('hidden');
    } else {
        winnerMsg.classList.add('hidden');
    }
}

init();
