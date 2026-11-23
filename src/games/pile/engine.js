/**
 * Pile de cours — game rules (no rendering).
 *
 * The board is the work week: 5 day columns × 24 half-hour rows
 * (8:00 → 20:00). Each falling piece is a course spread over one or more
 * days and slots; rotate and place it. A slot filled from Monday to Friday
 * ("créneau complet") is freed and everything above slides down.
 */

export const COLS = 5;
export const ROWS = 24;

/** Piece shapes as [day, slot] cells — every one is a plausible course pattern. */
export const SHAPES = {
  cours1h: { label: "1 h", cells: [[0, 0], [0, 1]] },
  cours2h: { label: "2 h", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  binome: { label: "Binôme", cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  amphi: { label: "Amphi", cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  projetL: { label: "Projet", cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
  projetJ: { label: "Projet", cells: [[1, 0], [1, 1], [1, 2], [0, 2]] },
  decaleS: { label: "Décalé", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  decaleZ: { label: "Décalé", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  td3j: { label: "TD", cells: [[0, 0], [1, 0], [2, 0]] },
  cours1h30: { label: "1 h 30", cells: [[0, 0], [0, 1], [0, 2]] },
};

const LINE_POINTS = [0, 100, 300, 500, 800, 1200, 1600];

const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export function normalize(cells) {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY]);
}

/** Quarter turn clockwise. */
export function rotateCells(cells) {
  const height = Math.max(...cells.map(([, y]) => y)) + 1;
  return normalize(cells.map(([x, y]) => [height - 1 - y, x]));
}

export const pieceCells = (piece, dx = 0, dy = 0, cells = piece.cells) =>
  cells.map(([x, y]) => ({ x: piece.x + x + dx, y: piece.y + y + dy }));

export function collides(state, cells) {
  return cells.some(
    ({ x, y }) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && state.grid[y][x]),
  );
}

export function fallInterval(level) {
  return Math.max(80, 700 - (level - 1) * 60);
}

function drawShape(state) {
  // "Bag" randomizer: every shape once before any repeats
  if (state.bag.length === 0) {
    state.bag = Object.keys(SHAPES);
    for (let i = state.bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(state.rng() * (i + 1));
      [state.bag[i], state.bag[j]] = [state.bag[j], state.bag[i]];
    }
  }
  return state.bag.pop();
}

function makePiece(state) {
  const shape = drawShape(state);
  const course = state.pool[Math.floor(state.rng() * state.pool.length)];
  return { shape, cells: SHAPES[shape].cells, course };
}

function spawn(state) {
  const piece = state.next;
  state.next = makePiece(state);
  const width = Math.max(...piece.cells.map(([x]) => x)) + 1;
  state.current = { ...piece, id: state.nextId, x: Math.floor((COLS - width) / 2), y: 0 };
  state.nextId += 1;
  if (collides(state, pieceCells(state.current))) state.over = true;
  state.version += 1;
}

function clearFullRows(state) {
  const full = [];
  state.grid.forEach((row, index) => {
    if (row.every(Boolean)) full.push(index);
  });
  if (full.length === 0) return;

  state.grid = [
    ...full.map(() => Array(COLS).fill(null)),
    ...state.grid.filter((_, index) => !full.includes(index)),
  ];
  state.lines += full.length;
  state.score += LINE_POINTS[Math.min(full.length, LINE_POINTS.length - 1)] * state.level;
  state.level = 1 + Math.floor(state.lines / 8);
  state.cleared = { rows: full, time: 320 };
}

function lock(state) {
  const { id, course } = state.current;
  pieceCells(state.current).forEach(({ x, y }) => {
    if (y >= 0) state.grid[y][x] = { id, course };
  });
  state.current = null;
  clearFullRows(state);
  spawn(state);
}

export function createPile({ pool, rng = Math.random }) {
  const state = {
    grid: emptyGrid(),
    pool,
    rng,
    bag: [],
    current: null,
    next: null,
    nextId: 1,
    score: 0,
    lines: 0,
    level: 1,
    fallTimer: 0,
    cleared: null,
    over: false,
    version: 0,
  };
  state.next = makePiece(state);
  spawn(state);
  return state;
}

export function move(state, direction) {
  if (state.over || !state.current) return;
  if (!collides(state, pieceCells(state.current, direction, 0))) {
    state.current.x += direction;
    state.version += 1;
  }
}

/** Rotates with small sideways "kicks" so pieces can turn against a wall. */
export function rotate(state) {
  if (state.over || !state.current) return;
  const rotated = rotateCells(state.current.cells);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collides(state, pieceCells(state.current, kick, 0, rotated))) {
      state.current.cells = rotated;
      state.current.x += kick;
      state.version += 1;
      return;
    }
  }
}

/** One step down; locks the piece when it can't fall anymore. */
export function stepDown(state) {
  if (state.over || !state.current) return false;
  if (collides(state, pieceCells(state.current, 0, 1))) {
    lock(state);
    return false;
  }
  state.current.y += 1;
  state.version += 1;
  return true;
}

export function softDrop(state) {
  if (stepDown(state)) state.score += 1;
  state.fallTimer = 0;
}

export function landingOffset(state) {
  if (!state.current) return 0;
  let offset = 0;
  while (!collides(state, pieceCells(state.current, 0, offset + 1))) offset += 1;
  return offset;
}

export function hardDrop(state) {
  if (state.over || !state.current) return;
  const offset = landingOffset(state);
  state.current.y += offset;
  state.score += offset * 2;
  lock(state);
  state.fallTimer = 0;
}

export function update(state, dt) {
  if (state.cleared) {
    state.cleared.time -= dt;
    if (state.cleared.time <= 0) {
      state.cleared = null;
      state.version += 1;
    }
  }
  if (state.over) return;
  state.fallTimer += dt;
  const interval = fallInterval(state.level);
  while (state.fallTimer >= interval && !state.over) {
    state.fallTimer -= interval;
    stepDown(state);
  }
}

/**
 * Vertical runs of cells per day — what the board draws as course cards.
 * `cells` are absolute { x, y }; returns [{ x, y, height }].
 */
export function cellRuns(cells) {
  const byColumn = new Map();
  cells.forEach(({ x, y }) => {
    if (!byColumn.has(x)) byColumn.set(x, []);
    byColumn.get(x).push(y);
  });
  const runs = [];
  [...byColumn.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([x, ys]) => {
      ys.sort((a, b) => a - b);
      let start = ys[0];
      let previous = ys[0];
      ys.slice(1).forEach((y) => {
        if (y !== previous + 1) {
          runs.push({ x, y: start, height: previous - start + 1 });
          start = y;
        }
        previous = y;
      });
      runs.push({ x, y: start, height: previous - start + 1 });
    });
  return runs;
}

/** Placed cells grouped into runs of the same course, per day. */
export function placedRuns(grid) {
  const runs = [];
  for (let x = 0; x < COLS; x += 1) {
    let y = 0;
    while (y < ROWS) {
      const cell = grid[y][x];
      if (!cell) {
        y += 1;
        continue;
      }
      let end = y + 1;
      while (end < ROWS && grid[end][x]?.id === cell.id) end += 1;
      runs.push({ x, y, height: end - y, id: cell.id, course: cell.course });
      y = end;
    }
  }
  return runs;
}

export const slotTime = (row) => {
  const minutes = 8 * 60 + row * 30;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
};
