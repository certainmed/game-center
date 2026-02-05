const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

let state = {
    cards: [],
    flipped: [],
    matched: [],
    moves: 0,
    won: false
};

const gridEl = document.getElementById('memory-grid');
const movesEl = document.getElementById('moves-count');
const restartBtn = document.getElementById('btn-restart');
const winMsg = document.getElementById('win-message');
const finalMovesEl = document.getElementById('final-moves');

function init() {
    restartBtn.addEventListener('click', initializeGame);
    initializeGame();
}

function initializeGame() {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, content: emoji }));

    state.cards = shuffled;
    state.flipped = [];
    state.matched = [];
    state.moves = 0;
    state.won = false;

    render();
}

function handleCardClick(id) {
    // Logic from React
    if (state.flipped.length === 2 || state.flipped.includes(id) || state.matched.includes(id)) return;

    state.flipped.push(id);
    renderCards(); // Partial render just to flip

    if (state.flipped.length === 2) {
        state.moves++;
        renderMoves();

        const [firstId, secondId] = state.flipped;
        const firstCard = state.cards.find(c => c.id === parseInt(firstId));
        const secondCard = state.cards.find(c => c.id === parseInt(secondId));

        if (firstCard.content === secondCard.content) {
            state.matched.push(firstId, secondId);
            state.flipped = [];
            checkWin();
            renderCards();
        } else {
            setTimeout(() => {
                state.flipped = [];
                renderCards();
            }, 1000);
        }
    }
}

function checkWin() {
    if (state.matched.length === state.cards.length) {
        state.won = true;
        renderWin();
    }
}

function renderMoves() {
    movesEl.textContent = state.moves;
}

function renderWin() {
    if (state.won) {
        winMsg.classList.remove('hidden');
        finalMovesEl.textContent = state.moves;
    } else {
        winMsg.classList.add('hidden');
    }
}

function renderCards() {
    gridEl.innerHTML = '';
    state.cards.forEach(card => {
        const isFlipped = state.flipped.includes(card.id) || state.matched.includes(card.id);

        const cardEl = document.createElement('div');
        cardEl.className = `memory-card ${isFlipped ? 'flipped' : ''}`;
        cardEl.style.backgroundColor = isFlipped ? 'white' : '#4ecdc4';

        cardEl.addEventListener('click', () => handleCardClick(card.id));

        const contentEl = document.createElement('div');
        contentEl.className = 'memory-card-front';
        contentEl.textContent = card.content;

        cardEl.appendChild(contentEl);
        gridEl.appendChild(cardEl);
    });
}

function render() {
    renderMoves();
    renderWin();
    renderCards();
}

init();
