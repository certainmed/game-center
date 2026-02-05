let state = {
    board: Array(16).fill(null),
    score: 0,
    gameOver: false
};

const gridEl = document.getElementById('grid-2048');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const btnRestart = document.getElementById('btn-restart');
const btnTryAgain = document.getElementById('btn-try-again');

function init() {
    btnRestart.addEventListener('click', initializeGame);
    btnTryAgain.addEventListener('click', initializeGame);
    window.addEventListener('keydown', handleKeyDown);
    initializeGame();
}

function initializeGame() {
    let newBoard = Array(16).fill(null);
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    state.board = newBoard;
    state.score = 0;
    state.gameOver = false;
    render();
}

function handleKeyDown(e) {
    if (state.gameOver) return;

    let moved = false;
    if (e.key === 'ArrowUp') moved = moveUp();
    else if (e.key === 'ArrowDown') moved = moveDown();
    else if (e.key === 'ArrowLeft') moved = moveLeft();
    else if (e.key === 'ArrowRight') moved = moveRight();

    if (moved) {
        setTimeout(() => addNewTile(), 150);
        render(); // Render immediately after move
    }
}

function addRandomTile(currentBoard) {
    const emptyIndices = currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return currentBoard;

    const idx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[idx] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
}

function addNewTile() {
    state.board = addRandomTile(state.board);
    if (isGameOver(state.board)) {
        state.gameOver = true;
    }
    render();
}

function isGameOver(currentBoard) {
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
}

function moveLeft() {
    let newBoard = [...state.board];
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
        state.board = newBoard;
        state.score += addedScore;
    }
    return moved;
}

function moveRight() {
    let newBoard = [...state.board];
    let moved = false;
    let addedScore = 0;

    for (let i = 0; i < 4; i++) {
        let row = [newBoard[i*4], newBoard[i*4+1], newBoard[i*4+2], newBoard[i*4+3]];
        let filtered = row.filter(val => val);

        for (let j = filtered.length - 1; j > 0; j--) {
            if (filtered[j] === filtered[j-1]) {
                filtered[j] *= 2;
                addedScore += filtered[j];
                filtered.splice(j-1, 1);
                j--;
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
        state.board = newBoard;
        state.score += addedScore;
    }
    return moved;
}

function moveUp() {
    let newBoard = [...state.board];
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
        state.board = newBoard;
        state.score += addedScore;
    }
    return moved;
}

function moveDown() {
    let newBoard = [...state.board];
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
        state.board = newBoard;
        state.score += addedScore;
    }
    return moved;
}

function render() {
    scoreEl.textContent = state.score;

    if (state.gameOver) {
        gameOverEl.classList.remove('hidden');
    } else {
        gameOverEl.classList.add('hidden');
    }

    gridEl.innerHTML = '';
    state.board.forEach(cell => {
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.aspectRatio = '1/1';
        div.style.borderRadius = '3px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontWeight = 'bold';
        div.style.transition = 'all 0.1s ease-in-out';

        if (cell) {
            div.textContent = cell;
            div.className = `tile-${cell}`;
            div.style.fontSize = cell > 1000 ? '1.5rem' : '2rem';
        } else {
            div.style.backgroundColor = 'rgba(238, 228, 218, 0.35)';
        }

        gridEl.appendChild(div);
    });
}

init();
