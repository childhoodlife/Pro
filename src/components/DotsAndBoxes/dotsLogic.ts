export type EdgeType = 'horizontal' | 'vertical';

export interface Edge {
  type: EdgeType;
  r: number; // Row index
  c: number; // Col index
  player: 1 | 2; // Who drew this edge
  id: string; // e.g. "h-0-1" or "v-2-0"
}

export interface Box {
  r: number;
  c: number;
  owner: 1 | 2 | null;
}

export interface DotsState {
  gridSize: number; // Number of boxes (e.g. 3 for 3x3 boxes = 4x4 dots)
  horizontalEdges: Record<string, 1 | 2>; // key: `${r}_${c}`
  verticalEdges: Record<string, 1 | 2>;   // key: `${r}_${c}`
  boxes: Record<string, 1 | 2>;           // key: `${r}_${c}`
  currentTurn: 1 | 2;
  p1Score: number;
  p2Score: number;
  history: Array<{
    edgeType: EdgeType;
    r: number;
    c: number;
    player: 1 | 2;
    boxesCompleted: string[];
    previousTurn: 1 | 2;
  }>;
}

export function createInitialDotsState(gridSize: number): DotsState {
  return {
    gridSize,
    horizontalEdges: {},
    verticalEdges: {},
    boxes: {},
    currentTurn: 1,
    p1Score: 0,
    p2Score: 0,
    history: [],
  };
}

// Check how many sides of a box (r, c) are completed
export function getBoxSidesCount(
  r: number,
  c: number,
  horizontalEdges: Record<string, 1 | 2>,
  verticalEdges: Record<string, 1 | 2>
): number {
  let count = 0;
  if (horizontalEdges[`${r}_${c}`]) count++;        // Top
  if (horizontalEdges[`${r + 1}_${c}`]) count++;    // Bottom
  if (verticalEdges[`${r}_${c}`]) count++;          // Left
  if (verticalEdges[`${r}_${c + 1}`]) count++;      // Right
  return count;
}

// Find all boxes that would be completed if an edge is placed
export function findCompletedBoxesForEdge(
  edgeType: EdgeType,
  r: number,
  c: number,
  gridSize: number,
  horizontalEdges: Record<string, 1 | 2>,
  verticalEdges: Record<string, 1 | 2>,
  existingBoxes: Record<string, 1 | 2>
): string[] {
  const completed: string[] = [];
  const testH = { ...horizontalEdges };
  const testV = { ...verticalEdges };

  if (edgeType === 'horizontal') testH[`${r}_${c}`] = 1;
  else testV[`${r}_${c}`] = 1;

  if (edgeType === 'horizontal') {
    // Box above edge: (r-1, c)
    if (r > 0 && !existingBoxes[`${r - 1}_${c}`]) {
      if (getBoxSidesCount(r - 1, c, testH, testV) === 4) {
        completed.push(`${r - 1}_${c}`);
      }
    }
    // Box below edge: (r, c)
    if (r < gridSize && !existingBoxes[`${r}_${c}`]) {
      if (getBoxSidesCount(r, c, testH, testV) === 4) {
        completed.push(`${r}_${c}`);
      }
    }
  } else {
    // Box left of edge: (r, c-1)
    if (c > 0 && !existingBoxes[`${r}_${c - 1}`]) {
      if (getBoxSidesCount(r, c - 1, testH, testV) === 4) {
        completed.push(`${r}_${c - 1}`);
      }
    }
    // Box right of edge: (r, c)
    if (c < gridSize && !existingBoxes[`${r}_${c}`]) {
      if (getBoxSidesCount(r, c, testH, testV) === 4) {
        completed.push(`${r}_${c}`);
      }
    }
  }

  return completed;
}

// Get all possible unplayed moves
export function getAllAvailableMoves(state: DotsState): Array<{ type: EdgeType; r: number; c: number }> {
  const moves: Array<{ type: EdgeType; r: number; c: number }> = [];
  const n = state.gridSize;

  // Horizontal edges: (n+1) rows x n cols
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c < n; c++) {
      if (!state.horizontalEdges[`${r}_${c}`]) {
        moves.push({ type: 'horizontal', r, c });
      }
    }
  }

  // Vertical edges: n rows x (n+1) cols
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n; c++) {
      if (!state.verticalEdges[`${r}_${c}`]) {
        moves.push({ type: 'vertical', r, c });
      }
    }
  }

  return moves;
}

// AI Move Selector with Easy, Medium, and Hard strategies
export function selectAIMove(
  state: DotsState,
  difficulty: 'easy' | 'medium' | 'hard'
): { type: EdgeType; r: number; c: number } | null {
  const availableMoves = getAllAvailableMoves(state);
  if (availableMoves.length === 0) return null;

  // 1. Easy Mode: Picks randomly, but has a 40% chance of completing a box if obvious
  if (difficulty === 'easy') {
    const capturingMoves = availableMoves.filter((m) =>
      findCompletedBoxesForEdge(m.type, m.r, m.c, state.gridSize, state.horizontalEdges, state.verticalEdges, state.boxes).length > 0
    );
    if (capturingMoves.length > 0 && Math.random() < 0.4) {
      return capturingMoves[Math.floor(Math.random() * capturingMoves.length)];
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // 2. Medium & Hard:
  // Categorize moves into:
  // - Captures (completes 1 or 2 boxes) -> ALWAYS take!
  // - Safe moves (does not create a 3rd side on any adjacent box)
  // - Sacrificial moves (gives opponent a 3rd side)
  const captureMoves: Array<{ move: typeof availableMoves[0]; count: number }> = [];
  const safeMoves: typeof availableMoves = [];
  const dangerousMoves: typeof availableMoves = [];

  for (const m of availableMoves) {
    const completed = findCompletedBoxesForEdge(
      m.type,
      m.r,
      m.c,
      state.gridSize,
      state.horizontalEdges,
      state.verticalEdges,
      state.boxes
    );

    if (completed.length > 0) {
      captureMoves.push({ move: m, count: completed.length });
      continue;
    }

    // Check if playing this move would give adjacent boxes a 3rd side (giving free box to opponent)
    const testH = { ...state.horizontalEdges };
    const testV = { ...state.verticalEdges };
    if (m.type === 'horizontal') testH[`${m.r}_${m.c}`] = 1;
    else testV[`${m.r}_${m.c}`] = 1;

    let givesThirdSide = false;
    if (m.type === 'horizontal') {
      if (m.r > 0 && getBoxSidesCount(m.r - 1, m.c, testH, testV) === 3) givesThirdSide = true;
      if (m.r < state.gridSize && getBoxSidesCount(m.r, m.c, testH, testV) === 3) givesThirdSide = true;
    } else {
      if (m.c > 0 && getBoxSidesCount(m.r, m.c - 1, testH, testV) === 3) givesThirdSide = true;
      if (m.c < state.gridSize && getBoxSidesCount(m.r, m.c, testH, testV) === 3) givesThirdSide = true;
    }

    if (givesThirdSide) {
      dangerousMoves.push(m);
    } else {
      safeMoves.push(m);
    }
  }

  // If there are capturing moves, prioritize double captures
  if (captureMoves.length > 0) {
    // Sort by most boxes captured
    captureMoves.sort((a, b) => b.count - a.count);
    return captureMoves[0].move;
  }

  // If safe moves exist, play one of them
  if (safeMoves.length > 0) {
    // Hard mode: prefer perimeter edges or edges that limit long chains
    if (difficulty === 'hard') {
      // Prioritize edges along the outer perimeter (r === 0, r === gridSize, c === 0, c === gridSize)
      const perimeterMoves = safeMoves.filter(
        (m) =>
          (m.type === 'horizontal' && (m.r === 0 || m.r === state.gridSize)) ||
          (m.type === 'vertical' && (m.c === 0 || m.c === state.gridSize))
      );
      if (perimeterMoves.length > 0) {
        return perimeterMoves[Math.floor(Math.random() * perimeterMoves.length)];
      }
    }
    return safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  // Forced to make a dangerous move:
  // Hard mode: Pick move that gives away the shortest chain
  return dangerousMoves[Math.floor(Math.random() * dangerousMoves.length)] || availableMoves[0];
}
