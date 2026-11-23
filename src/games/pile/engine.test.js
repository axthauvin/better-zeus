import {
  COLS,
  ROWS,
  SHAPES,
  createPile,
  move,
  rotate,
  hardDrop,
  update,
  fallInterval,
  rotateCells,
  cellRuns,
  pieceCells,
} from "./engine.js";

const style = { bg: "#000", border: "#000", text: "#000" };
const pool = [{ title: "Cours", minutes: 60, style }];

/** A pile whose next pieces are always `shape`. */
function pileOf(shape) {
  const state = createPile({ pool, rng: () => 0 });
  state.bag = Array(200).fill(shape);
  state.current = { shape, cells: SHAPES[shape].cells, course: pool[0], id: 99, x: 0, y: 0 };
  state.next = { shape, cells: SHAPES[shape].cells, course: pool[0] };
  return state;
}

describe("Pile de cours engine", () => {
  test("spawns a piece centred at the top of the week", () => {
    const state = createPile({ pool, rng: () => 0 });
    const cells = pieceCells(state.current);
    expect(Math.min(...cells.map((c) => c.y))).toBe(0);
    expect(cells.every((c) => c.x >= 0 && c.x < COLS)).toBe(true);
  });

  test("rotating a 2 h course lays it across four days", () => {
    expect(rotateCells(SHAPES.cours2h.cells)).toEqual([[3, 0], [2, 0], [1, 0], [0, 0]]);
    const state = pileOf("cours2h");
    state.current.x = 1;
    rotate(state);
    const cells = pieceCells(state.current);
    expect(new Set(cells.map((c) => c.y)).size).toBe(1);
    expect(cells.every((c) => c.x >= 0 && c.x < COLS)).toBe(true);
  });

  test("rotation kicks away from the wall instead of failing", () => {
    const state = pileOf("cours2h");
    state.current.x = COLS - 1;
    rotate(state);
    expect(pieceCells(state.current).every((c) => c.x < COLS)).toBe(true);
  });

  test("moves within the week and stops at the edges", () => {
    const state = pileOf("cours1h");
    for (let i = 0; i < 10; i += 1) move(state, 1);
    expect(state.current.x).toBe(COLS - 1);
    for (let i = 0; i < 10; i += 1) move(state, -1);
    expect(state.current.x).toBe(0);
  });

  test("a slot filled on all five days is freed", () => {
    const state = pileOf("cours1h");
    for (let col = 0; col < COLS; col += 1) {
      for (let i = 0; i < COLS; i += 1) move(state, -1);
      for (let i = 0; i < col; i += 1) move(state, 1);
      hardDrop(state);
    }
    expect(state.lines).toBe(2);
    expect(state.grid[ROWS - 1].every((cell) => cell === null)).toBe(true);
    expect(state.score).toBeGreaterThanOrEqual(300);
  });

  test("gravity follows the level and overflowing the week ends the game", () => {
    const state = pileOf("cours2h");
    update(state, fallInterval(1));
    expect(state.current.y).toBe(1);
    for (let i = 0; i < ROWS; i += 1) hardDrop(state);
    expect(state.over).toBe(true);
  });

  test("cellRuns merges vertical cells of the same day", () => {
    expect(cellRuns([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 3 }])).toEqual([
      { x: 0, y: 0, height: 2 },
      { x: 0, y: 3, height: 1 },
      { x: 1, y: 1, height: 1 },
    ]);
  });
});
