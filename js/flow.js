const LEVELS = {
  easy: [
    {
      size: 5,
      flows: [
        { color: '#ff6b6b', points: [[0, 0], [4, 2]] },
        { color: '#4ecdc4', points: [[0, 1], [3, 4]] },
        { color: '#ffe66d', points: [[0, 2], [2, 2]] },
        { color: '#6c5ce7', points: [[1, 4], [4, 4]] },
        { color: '#ff9f43', points: [[2, 0], [4, 1]] }
      ]
    },
    {
      size: 5,
      flows: [
        { color: '#ff6b6b', points: [[0, 0], [2, 3]] },
        { color: '#4ecdc4', points: [[0, 4], [4, 4]] },
        { color: '#ffe66d', points: [[1, 2], [3, 2]] },
        { color: '#6c5ce7', points: [[2, 0], [2, 4]] }
      ]
    }
  ],
  medium: [
    {
      size: 7,
      flows: [
        { color: '#ff6b6b', points: [[0, 0], [6, 2]] },
        { color: '#4ecdc4', points: [[1, 0], [4, 3]] },
        { color: '#ffe66d', points: [[2, 2], [5, 5]] },
        { color: '#6c5ce7', points: [[3, 0], [6, 6]] },
        { color: '#ff9f43', points: [[0, 6], [3, 4]] },
        { color: '#2ecc71', points: [[5, 0], [1, 5]] }
      ]
    }
  ],
  hard: [
    {
      size: 9,
      flows: [
        { color: '#ff6b6b', points: [[0, 0], [8, 8]] },
        { color: '#4ecdc4', points: [[0, 8], [8, 0]] },
        { color: '#ffe66d', points: [[4, 0], [4, 8]] },
        { color: '#6c5ce7', points: [[0, 4], [8, 4]] },
        { color: '#ff9f43', points: [[2, 2], [6, 6]] },
        { color: '#2ecc71', points: [[2, 6], [6, 2]] }
      ]
    }
  ]
};

let state = {
    difficulty: 'easy',
    levelIndex: 0,
    paths: {}, // { color: [[r,c], ...] }
    activeColor: null,
    isDrawing: false,
    completed: false
};

const gridEl = document.getElementById('flow-grid');
const completeMsg = document.getElementById('level-complete');
const diffButtons = document.querySelectorAll('.btn-diff');
const btnReset = document.getElementById('btn-reset');

function init() {
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.difficulty = e.target.dataset.diff;
            state.levelIndex = 0;
            resetLevel();
        });
    });

    btnReset.addEventListener('click', resetLevel);

    gridEl.addEventListener('mouseleave', handleMouseUp);
    window.addEventListener('mouseup', handleMouseUp);

    resetLevel();
}

function getLevel() {
    return LEVELS[state.difficulty][state.levelIndex] || LEVELS['easy'][0];
}

function resetLevel() {
    state.paths = {};
    state.activeColor = null;
    state.isDrawing = false;
    state.completed = false;
    render();
}

function getCellContent(r, c) {
    const level = getLevel();
    // Check endpoints
    for (let flow of level.flows) {
      if ((flow.points[0][0] === r && flow.points[0][1] === c) ||
          (flow.points[1][0] === r && flow.points[1][1] === c)) {
        return { type: 'endpoint', color: flow.color };
      }
    }

    // Check paths
    for (let color in state.paths) {
      const path = state.paths[color];
      if (!path) continue;
      for (let i = 0; i < path.length; i++) {
        if (path[i][0] === r && path[i][1] === c) {
          return { type: 'path', color: color };
        }
      }
    }
    return null;
}

function handleMouseDown(r, c) {
    if (state.completed) return;
    const content = getCellContent(r, c);

    if (content) {
        state.activeColor = content.color;
        state.isDrawing = true;

        if (content.type === 'endpoint') {
            state.paths[content.color] = [[r, c]];
        } else {
            // Truncate
            const oldPath = state.paths[content.color];
            const idx = oldPath.findIndex(p => p[0] === r && p[1] === c);
            state.paths[content.color] = oldPath.slice(0, idx + 1);
        }
        render();
    }
}

function handleMouseEnter(r, c) {
    if (!state.isDrawing || !state.activeColor || state.completed) return;

    const currentPath = state.paths[state.activeColor] || [];
    const lastPoint = currentPath[currentPath.length - 1];

    if (!lastPoint) return;

    const dist = Math.abs(r - lastPoint[0]) + Math.abs(c - lastPoint[1]);
    if (dist !== 1) return;

    const content = getCellContent(r, c);

    // Backtracking check
    if (currentPath.length > 1) {
        const prevStep = currentPath[currentPath.length - 2];
        if (prevStep[0] === r && prevStep[1] === c) {
            state.paths[state.activeColor] = currentPath.slice(0, -1);
            render();
            return;
        }
    }

    if (!content) {
        state.paths[state.activeColor] = [...currentPath, [r, c]];
        render();
    } else if (content.color === state.activeColor && content.type === 'endpoint') {
        const startPoint = currentPath[0];
        if (startPoint[0] !== r || startPoint[1] !== c) {
            state.paths[state.activeColor] = [...currentPath, [r, c]];
            render();
        }
    } else if (content.color === state.activeColor && content.type === 'path') {
        const idx = currentPath.findIndex(p => p[0] === r && p[1] === c);
        if (idx !== -1) {
            state.paths[state.activeColor] = currentPath.slice(0, idx + 1);
            render();
        }
    }
}

function handleMouseUp() {
    if (state.isDrawing) {
        state.isDrawing = false;
        state.activeColor = null;
        checkCompletion();
        render();
    }
}

function checkCompletion() {
    const level = getLevel();
    let allConnected = true;
    for (let flow of level.flows) {
        const path = state.paths[flow.color];
        if (!path || path.length < 2) {
            allConnected = false; break;
        }
        const start = path[0];
        const end = path[path.length - 1];
        const p1 = flow.points[0];
        const p2 = flow.points[1];
        const startsAtP1 = start[0] === p1[0] && start[1] === p1[1];
        const startsAtP2 = start[0] === p2[0] && start[1] === p2[1];
        const endsAtP1 = end[0] === p1[0] && end[1] === p1[1];
        const endsAtP2 = end[0] === p2[0] && end[1] === p2[1];
        if (!((startsAtP1 && endsAtP2) || (startsAtP2 && endsAtP1))) {
            allConnected = false; break;
        }
    }

    let gridCovered = true;
    const gridSize = level.size;
    for(let r=0; r<gridSize; r++){
        for(let c=0; c<gridSize; c++){
             if (!getCellContent(r,c)) {
                 gridCovered = false; break;
             }
        }
        if(!gridCovered) break;
    }

    if (allConnected && gridCovered) {
        state.completed = true;
    } else {
        state.completed = false;
    }
}

function render() {
    const level = getLevel();
    const gridSize = level.size;

    // UI Update
    diffButtons.forEach(btn => {
        if (btn.dataset.diff === state.difficulty) {
            btn.style.backgroundColor = '#6c5ce7';
            btn.style.color = 'white';
        } else {
            btn.style.backgroundColor = '#f0f0f0';
            btn.style.color = '#333';
        }
    });

    if (state.completed) {
        completeMsg.classList.remove('hidden');
    } else {
        completeMsg.classList.add('hidden');
    }

    // Grid Render
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const r = Math.floor(i / gridSize);
        const c = i % gridSize;
        const content = getCellContent(r, c);

        const cell = document.createElement('div');
        cell.style.width = '100%';
        cell.style.aspectRatio = '1/1';
        cell.style.backgroundColor = '#2d3436';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.position = 'relative';

        // Event Listeners
        cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleMouseDown(r, c);
        });
        cell.addEventListener('mouseenter', () => handleMouseEnter(r, c));

        if (content) {
            if (content.type === 'endpoint') {
                const dot = document.createElement('div');
                dot.style.width = '70%';
                dot.style.height = '70%';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = content.color;
                dot.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
                dot.style.zIndex = '2';
                cell.appendChild(dot);
            } else if (content.type === 'path') {
                const dot = document.createElement('div');
                dot.style.width = '40%';
                dot.style.height = '40%';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = content.color;
                dot.style.zIndex = '1';
                cell.appendChild(dot);
            }

            // Connectors
            if (content.type === 'path' || content.type === 'endpoint') {
                const path = state.paths[content.color];
                if (path) {
                    const idx = path.findIndex(p => p[0] === r && p[1] === c);
                    if (idx !== -1) {
                        const prev = path[idx - 1];
                        const next = path[idx + 1];

                        [prev, next].forEach(target => {
                            if (target) {
                                const dr = target[0] - r;
                                const dc = target[1] - c;
                                const connector = document.createElement('div');
                                connector.style.position = 'absolute';
                                connector.style.backgroundColor = content.color;
                                connector.style.zIndex = '1';

                                if (dr === 1) { // Down
                                    connector.style.bottom = '0'; connector.style.left = '30%'; connector.style.width = '40%'; connector.style.height = '50%';
                                } else if (dr === -1) { // Up
                                    connector.style.top = '0'; connector.style.left = '30%'; connector.style.width = '40%'; connector.style.height = '50%';
                                } else if (dc === 1) { // Right
                                    connector.style.right = '0'; connector.style.top = '30%'; connector.style.height = '40%'; connector.style.width = '50%';
                                } else if (dc === -1) { // Left
                                    connector.style.left = '0'; connector.style.top = '30%'; connector.style.height = '40%'; connector.style.width = '50%';
                                }
                                cell.appendChild(connector);
                            }
                        });
                    }
                }
            }
        }
        gridEl.appendChild(cell);
    }
}

init();
