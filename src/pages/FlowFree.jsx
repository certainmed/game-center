import React, { useState, useEffect, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

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

const FlowFree = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [levelIndex, setLevelIndex] = useState(0);
  const [paths, setPaths] = useState({}); // { color: [[r,c], [r,c], ...] }
  const [activeColor, setActiveColor] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const level = LEVELS[difficulty][levelIndex] || LEVELS['easy'][0];
  const gridSize = level.size;

  useEffect(() => {
    resetLevel();
  }, [difficulty, levelIndex]);

  const resetLevel = () => {
    // Initialize paths with just start points? No, empty paths initially?
    // Actually better to initialize with empty arrays or just handle logic
    setPaths({});
    setActiveColor(null);
    setIsDrawing(false);
    setCompleted(false);
  };

  const getCellContent = (r, c) => {
    // Check endpoints
    for (let flow of level.flows) {
      if ((flow.points[0][0] === r && flow.points[0][1] === c) ||
          (flow.points[1][0] === r && flow.points[1][1] === c)) {
        return { type: 'endpoint', color: flow.color };
      }
    }

    // Check paths
    for (let color in paths) {
      const path = paths[color];
      if (!path) continue;
      for (let i = 0; i < path.length; i++) {
        if (path[i][0] === r && path[i][1] === c) {
          return { type: 'path', color: color };
        }
      }
    }

    return null;
  };

  const handleMouseDown = (r, c) => {
    if (completed) return;
    const content = getCellContent(r, c);

    // Start drawing from an endpoint or existing path
    if (content) {
      setActiveColor(content.color);
      setIsDrawing(true);

      // If clicking endpoint, start fresh path from that endpoint
      if (content.type === 'endpoint') {
        setPaths(prev => ({ ...prev, [content.color]: [[r, c]] }));
      } else {
        // Truncate path to this point
        const oldPath = paths[content.color];
        const idx = oldPath.findIndex(p => p[0] === r && p[1] === c);
        setPaths(prev => ({ ...prev, [content.color]: oldPath.slice(0, idx + 1) }));
      }
    }
  };

  const handleMouseEnter = (r, c) => {
    if (!isDrawing || !activeColor || completed) return;

    const currentPath = paths[activeColor] || [];
    const lastPoint = currentPath[currentPath.length - 1];

    if (!lastPoint) return; // Should not happen

    // Check adjacency (manhattan distance = 1)
    const dist = Math.abs(r - lastPoint[0]) + Math.abs(c - lastPoint[1]);
    if (dist !== 1) return;

    // Check valid move
    // Can move to empty cell OR endpoint of SAME color
    // Cannot move to cell occupied by OTHER path (unless we backtrack?)
    // Cannot move to cell occupied by OWN path (unless backtracking - handled by mouseDown logic mostly)

    const content = getCellContent(r, c);

    // Check if we hit our own previous step (backtracking)
    if (currentPath.length > 1) {
      const prevStep = currentPath[currentPath.length - 2];
      if (prevStep[0] === r && prevStep[1] === c) {
        // Remove last step
        setPaths(prev => ({ ...prev, [activeColor]: currentPath.slice(0, -1) }));
        return;
      }
    }

    if (!content) {
      // Empty cell, add to path
      setPaths(prev => ({ ...prev, [activeColor]: [...currentPath, [r, c]] }));
    } else if (content.color === activeColor && content.type === 'endpoint') {
       // Hit target endpoint
       // Check if this endpoint is NOT the starting one (length > 1)
       // Actually start point is in path[0], so if this is different from path[0], it's the other end.
       const startPoint = currentPath[0];
       if (startPoint[0] !== r || startPoint[1] !== c) {
         setPaths(prev => ({ ...prev, [activeColor]: [...currentPath, [r, c]] }));
         // We don't stop drawing here necessarily, but usually user lifts mouse
       }
    } else if (content.color === activeColor && content.type === 'path') {
      // Hit own path elsewhere (loop/self-intersect). Truncate to that point.
      const idx = currentPath.findIndex(p => p[0] === r && p[1] === c);
      if (idx !== -1) {
         setPaths(prev => ({ ...prev, [activeColor]: currentPath.slice(0, idx + 1) }));
      }
    }
    // If content is other color, block.
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setActiveColor(null);
    checkCompletion();
  };

  const checkCompletion = () => {
    // Check if all flows are connected
    let allConnected = true;
    for (let flow of level.flows) {
      const path = paths[flow.color];
      if (!path || path.length < 2) {
        allConnected = false;
        break;
      }
      const start = path[0];
      const end = path[path.length - 1];

      const p1 = flow.points[0];
      const p2 = flow.points[1];

      // Check if path connects p1 and p2
      const startsAtP1 = start[0] === p1[0] && start[1] === p1[1];
      const startsAtP2 = start[0] === p2[0] && start[1] === p2[1];
      const endsAtP1 = end[0] === p1[0] && end[1] === p1[1];
      const endsAtP2 = end[0] === p2[0] && end[1] === p2[1];

      if (!((startsAtP1 && endsAtP2) || (startsAtP2 && endsAtP1))) {
        allConnected = false;
        break;
      }
    }

    // Check if grid is full
    let filledCount = 0;
    for (let color in paths) {
      filledCount += paths[color].length; // Note: endpoints are counted in path
      // But endpoints are also physical cells.
      // We need to count unique cells covered.
    }
    // Actually simpler: iterate grid
    let gridCovered = true;
    // Iterate all cells
    for(let r=0; r<gridSize; r++){
        for(let c=0; c<gridSize; c++){
            if (!getCellContent(r,c)) {
                gridCovered = false; // Note: getCellContent returns endpoints too
                break;
            }
        }
    }

    if (allConnected && gridCovered) {
      setCompleted(true);
    }
  };

  // Re-check completion whenever paths change (and mouse is up, or continuously?)
  // Let's check continuously to give instant feedback
  useEffect(() => {
    if (!isDrawing) {
        // checkCompletion(); // Actually better to check inside render or effect
    }
    // Logic inside checkCompletion uses state, so let's run it here

    let allConnected = true;
    for (let flow of level.flows) {
      const path = paths[flow.color];
      if (!path || path.length < 2) {
        allConnected = false;
        break;
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
        allConnected = false;
        break;
      }
    }

    let gridCovered = true;
    for(let r=0; r<gridSize; r++){
        for(let c=0; c<gridSize; c++){
             // Logic to check if (r,c) is in any path or is an endpoint
             let covered = false;
             // Check endpoints
             for (let flow of level.flows) {
               if ((flow.points[0][0] === r && flow.points[0][1] === c) ||
                   (flow.points[1][0] === r && flow.points[1][1] === c)) {
                 covered = true; break;
               }
             }
             if(!covered) {
                 for (let color in paths) {
                     if (paths[color].some(p => p[0] === r && p[1] === c)) {
                         covered = true; break;
                     }
                 }
             }
             if(!covered) { gridCovered = false; break; }
        }
    }

    if (allConnected && gridCovered) {
        setCompleted(true);
    } else {
        setCompleted(false);
    }

  }, [paths, level]);


  return (
    <GameWrapper title="Flow Free" color="#6c5ce7">
      <div style={{ maxWidth: '500px', width: '100%' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {['easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); setLevelIndex(0); }}
              style={{
                backgroundColor: difficulty === d ? '#6c5ce7' : '#f0f0f0',
                color: difficulty === d ? 'white' : '#333',
                textTransform: 'capitalize'
              }}
            >
              {d}
            </button>
          ))}
          <button
            onClick={resetLevel}
            style={{ marginLeft: '1rem', backgroundColor: '#333', color: 'white' }}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {completed && (
           <div style={{
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#2ecc71',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
           }}>
             <CheckCircle2 /> Level Complete!
           </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: '2px',
            backgroundColor: '#333',
            padding: '5px',
            borderRadius: '5px',
            margin: '0 auto',
            touchAction: 'none' // Prevent scrolling while dragging
          }}
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
            const r = Math.floor(idx / gridSize);
            const c = idx % gridSize;
            const content = getCellContent(r, c);

            return (
              <div
                key={idx}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  backgroundColor: '#2d3436', // dark background for cells
                  borderRadius: '0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {/* Render Endpoint Dot */}
                {content && content.type === 'endpoint' && (
                  <div style={{
                    width: '70%',
                    height: '70%',
                    borderRadius: '50%',
                    backgroundColor: content.color,
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    zIndex: 2
                  }} />
                )}

                {/* Render Path Center */}
                {content && content.type === 'path' && (
                   <div style={{
                    width: '40%',
                    height: '40%',
                    backgroundColor: content.color,
                    borderRadius: '50%', // Round joins
                    zIndex: 1
                   }} />
                )}

                {/* Render Path Connectors */}
                {/* Note: This is tricky with just grid cells.
                    Better to render SVG or sophisticated CSS.
                    Simple CSS approach: check neighbors in path.
                */}
                {content && (content.type === 'path' || content.type === 'endpoint') && (() => {
                    const path = paths[content.color];
                    if (!path) return null;
                    // Find index of this cell
                    const index = path.findIndex(p => p[0] === r && p[1] === c);
                    if (index === -1) return null;

                    const prev = path[index - 1];
                    const next = path[index + 1];

                    const renderConnector = (target, key) => {
                        if (!target) return null;
                        const dr = target[0] - r;
                        const dc = target[1] - c;

                        let style = {
                            position: 'absolute',
                            backgroundColor: content.color,
                            zIndex: 1
                        };

                        if (dr === 1) { // Down
                            style = { ...style, bottom: 0, left: '30%', width: '40%', height: '50%' };
                        } else if (dr === -1) { // Up
                            style = { ...style, top: 0, left: '30%', width: '40%', height: '50%' };
                        } else if (dc === 1) { // Right
                            style = { ...style, right: 0, top: '30%', height: '40%', width: '50%' };
                        } else if (dc === -1) { // Left
                            style = { ...style, left: 0, top: '30%', height: '40%', width: '50%' };
                        }
                        return <div key={key} style={style} />;
                    };

                    return (
                        <>
                          {renderConnector(prev, 'prev')}
                          {renderConnector(next, 'next')}
                        </>
                    );
                })()}

              </div>
            );
          })}
        </div>
      </div>
    </GameWrapper>
  );
};

export default FlowFree;
