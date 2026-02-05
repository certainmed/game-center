const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

let state = {
    board: Array(9).fill(null),
    isXNext: true,
    gameStatus: 'playing', // playing, won, draw
    winner: null,
    mode: 'pve', // pvp, pve
    difficulty: 'hard' // easy, medium, hard
};

// DOM Elements
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status-display');
const btnPvP = document.getElementById('btn-pvp');
const btnPvE = document.getElementById('btn-pve');
const diffControls = document.getElementById('difficulty-controls');
const btnReset = document.getElementById('btn-reset');
const diffButtons = document.querySelectorAll('.btn-diff');

function init() {
    renderBoard();
    updateUI();

    // Bind Events
    btnPvP.addEventListener('click', () => setMode('pvp'));
    btnPvE.addEventListener('click', () => setMode('pve'));

    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => setDifficulty(e.target.dataset.diff));
    });

    btnReset.addEventListener('click', resetGame);

    render();
}

function setMode(mode) {
    state.mode = mode;
    resetGame();
}

function setDifficulty(diff) {
    state.difficulty = diff;
    resetGame();
}

function resetGame() {
    state.board = Array(9).fill(null);
    state.isXNext = true;
    state.gameStatus = 'playing';
    state.winner = null;
    render();

    // AI might need to move if it goes first? But here X goes first and X is usually Player.
    // React code: isXNext=true init. AI moves when !isXNext and mode=pve.
}

function checkWinner(squares) {
    for (let combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

function isBoardFull(squares) {
    return squares.every(square => square !== null);
}

function handleClick(index) {
    if (state.board[index] || state.gameStatus !== 'playing') return;

    // If PvE and it's O's turn (AI), ignore clicks
    if (state.mode === 'pve' && !state.isXNext) return;

    makeMove(index, state.isXNext ? 'X' : 'O');
}

function makeMove(index, player) {
    state.board[index] = player;

    const win = checkWinner(state.board);
    if (win) {
        state.gameStatus = 'won';
        state.winner = win;
    } else if (isBoardFull(state.board)) {
        state.gameStatus = 'draw';
    } else {
        state.isXNext = !state.isXNext;
    }
    render();

    // Trigger AI
    if (state.mode === 'pve' && !state.isXNext && state.gameStatus === 'playing') {
        setTimeout(makeAiMove, 500);
    }
}

function makeAiMove() {
    let moveIndex;

    if (state.difficulty === 'easy') {
        moveIndex = getRandomMove(state.board);
    } else if (state.difficulty === 'medium') {
        moveIndex = Math.random() > 0.5 ? getBestMove(state.board) : getRandomMove(state.board);
    } else {
        moveIndex = getBestMove(state.board);
    }

    if (moveIndex !== -1) {
        // AI is 'O'
        state.board[moveIndex] = 'O';

        const win = checkWinner(state.board);
        if (win) {
            state.gameStatus = 'won';
            state.winner = win;
        } else if (isBoardFull(state.board)) {
            state.gameStatus = 'draw';
        } else {
            state.isXNext = true;
        }
        render();
    }
}

function getRandomMove(squares) {
    const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
}

function getBestMove(squares) {
    return minimax(squares, 'O').index;
}

function minimax(squares, player) {
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
}

function renderBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.backgroundColor = 'white';
        cell.style.height = '100px';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.fontSize = '3rem';
        cell.style.fontWeight = 'bold';
        cell.style.borderRadius = '5px';
        cell.dataset.index = i;

        cell.addEventListener('click', () => handleClick(i));
        boardEl.appendChild(cell);
    }
}

function updateUI() {
    // Buttons styling
    const activeColor = '#ff6b6b';
    const inactiveColor = 'white';

    btnPvP.style.backgroundColor = state.mode === 'pvp' ? activeColor : inactiveColor;
    btnPvP.style.color = state.mode === 'pvp' ? 'white' : '#333';
    btnPvP.style.borderColor = activeColor;

    btnPvE.style.backgroundColor = state.mode === 'pve' ? activeColor : inactiveColor;
    btnPvE.style.color = state.mode === 'pve' ? 'white' : '#333';
    btnPvE.style.borderColor = activeColor;

    if (state.mode === 'pve') {
        diffControls.classList.remove('hidden');
    } else {
        diffControls.classList.add('hidden');
    }

    diffButtons.forEach(btn => {
        if (btn.dataset.diff === state.difficulty) {
            btn.style.backgroundColor = '#333';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.color = '#333';
        }
    });

    // Status
    if (state.gameStatus === 'playing') {
        statusEl.textContent = `Player ${state.isXNext ? 'X' : 'O'}'s Turn`;
        statusEl.style.color = '#333';
    } else if (state.gameStatus === 'won') {
        statusEl.textContent = `Player ${state.winner} Wins!`;
        statusEl.style.color = '#2ecc71';
    } else {
        statusEl.textContent = 'Draw!';
        statusEl.style.color = '#f1c40f';
    }
}

function render() {
    updateUI();

    // Update Board Content
    const cells = boardEl.children;
    for (let i = 0; i < 9; i++) {
        const val = state.board[i];
        cells[i].textContent = val;
        cells[i].style.color = val === 'X' ? '#ff6b6b' : '#4ecdc4';

        const clickable = state.gameStatus === 'playing' && !val;
        if (state.mode === 'pve' && !state.isXNext) {
             cells[i].style.cursor = 'default';
        } else {
             cells[i].style.cursor = clickable ? 'pointer' : 'default';
        }
    }
}

// Start
init();
