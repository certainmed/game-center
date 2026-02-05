const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const diffButtons = document.querySelectorAll('.btn-diff');

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
const BRICK_WIDTH = (CANVAS_WIDTH - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COLUMN_COUNT - 1))) / BRICK_COLUMN_COUNT;

let state = {
    isPlaying: false,
    gameOver: false,
    won: false,
    score: 0,
    lives: 3,
    difficulty: 'normal',
    ball: { x: 0, y: 0, dx: 0, dy: 0 },
    paddle: { x: 0, width: 100 },
    bricks: []
};

let requestRef;

function init() {
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.difficulty = e.target.dataset.diff;
            state.isPlaying = false;
            initGame();
            renderUI();
        });
    });

    btnReset.addEventListener('click', () => {
        initGame();
        state.isPlaying = true;
        update();
    });

    btnStart.addEventListener('click', () => {
        if (state.gameOver || state.won) {
            initGame();
        }
        state.isPlaying = true;
        update();
    });

    canvas.addEventListener('mousemove', handleMouseMove);

    initGame();
    draw(); // Initial draw
}

function initGame() {
    let speed = 4;
    let paddleW = 100;

    if (state.difficulty === 'easy') { speed = 3; paddleW = 120; }
    if (state.difficulty === 'hard') { speed = 6; paddleW = 80; }

    const bricks = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
      bricks[c] = [];
      for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, color: `hsl(${c * 45}, 70%, 50%)` };
      }
    }

    state.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: speed, dy: -speed };
    state.paddle = { x: (CANVAS_WIDTH - paddleW) / 2, width: paddleW };
    state.bricks = bricks;
    state.score = 0;
    state.lives = 3;
    state.gameOver = false;
    state.won = false;
    state.isPlaying = false;

    renderUI();
}

function update() {
    if (!state.isPlaying) return;

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
        const hitPoint = state.ball.x - (state.ball.paddle.x + state.ball.paddle.width / 2);
        state.ball.dx = hitPoint * 0.15;
      } else {
        // Life Lost
        state.lives--;
        renderUI();
        if (state.lives <= 0) {
          state.gameOver = true;
          state.isPlaying = false;
        } else {
          state.ball.x = CANVAS_WIDTH / 2;
          state.ball.y = CANVAS_HEIGHT - 30;
          state.ball.dx = 4; // Reset speed
          state.ball.dy = -4;
          state.ball.paddle.x = (CANVAS_WIDTH - state.ball.paddle.width) / 2;
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
            renderUI();
          }
        }
      }
    }

    if (activeBricks === 0) {
        state.won = true;
        state.isPlaying = false;
    }

    draw();

    if (state.isPlaying) {
        requestRef = requestAnimationFrame(update);
    } else {
        renderUI(); // Show overlay
    }
}

function draw() {
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
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;

    if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
      state.paddle.x = relativeX - state.paddle.width / 2;
      if (state.paddle.x < 0) state.paddle.x = 0;
      if (state.paddle.x + state.paddle.width > CANVAS_WIDTH) state.paddle.x = CANVAS_WIDTH - state.paddle.width;

      if (!state.isPlaying) draw();
    }
}

function renderUI() {
    scoreEl.textContent = state.score;
    livesEl.textContent = state.lives;

    // Diff Buttons
    diffButtons.forEach(btn => {
        if (btn.dataset.diff === state.difficulty) {
            btn.style.backgroundColor = '#ff9f43';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '#eee';
            btn.style.color = '#333';
        }
    });

    // Overlay
    if (!state.isPlaying || state.gameOver || state.won) {
        overlay.classList.remove('hidden');
        if (state.gameOver) {
            overlayTitle.textContent = "Game Over";
            overlayTitle.style.color = "#e74c3c";
            overlayTitle.classList.remove('hidden');
            btnStart.innerHTML = 'Try Again';
        } else if (state.won) {
            overlayTitle.textContent = "You Win!";
            overlayTitle.style.color = "#2ecc71";
            overlayTitle.classList.remove('hidden');
            btnStart.innerHTML = 'Play Again';
        } else {
            overlayTitle.classList.add('hidden');
            btnStart.innerHTML = '<i data-lucide="play" style="width: 32px; height: 32px;"></i> Start';
            lucide.createIcons();
        }
    } else {
        overlay.classList.add('hidden');
    }
}

init();
