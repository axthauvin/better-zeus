import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { addDays, startOfWeek } from "date-fns";
import WeekBoard from "../components/WeekBoard";
import BoardCard from "../components/BoardCard";
import TouchControls from "../components/TouchControls";
import { useGameLoop } from "../hooks/useGameLoop.js";
import { useGameKeys } from "../hooks/useGameKeys.js";
import { buildCoursePool } from "../schedule.js";
import {
  COLS,
  createPile,
  move,
  rotate,
  softDrop,
  hardDrop,
  landingOffset,
  pieceCells,
  cellRuns,
  placedRuns,
  slotTime,
  update,
} from "./engine.js";

const freedSlots = (count) =>
  count > 1 ? `${count} créneaux libérés` : `${count} créneau libéré`;

/** Cards for a set of runs, positioned on the week grid. */
const Runs = ({ runs, geometry, style, title, ghost, showTime = true }) => {
  const { columnWidth, rowHeight } = geometry;
  const head = runs.reduce(
    (best, run) => (!best || run.y < best.y || (run.y === best.y && run.x < best.x) ? run : best),
    null,
  );
  return runs.map((run) => (
    <BoardCard
      key={`${run.x}-${run.y}`}
      left={run.x * columnWidth + 3}
      top={run.y * rowHeight + 1}
      width={columnWidth - 6}
      height={run.height * rowHeight - 2}
      style={run.course?.style || style}
      title={run === head || run.course ? run.course?.title || title : ""}
      time={showTime && run.height >= 3 ? `${slotTime(run.y)} – ${slotTime(run.y + run.height)}` : ""}
      ghost={ghost}
    />
  ));
};

/** Mini preview of the next piece, in the weekend columns. */
const NextPiece = ({ piece, size }) => {
  const runs = cellRuns(piece.cells.map(([x, y]) => ({ x, y })));
  const columns = Math.max(...piece.cells.map(([x]) => x)) + 1;
  const rows = Math.max(...piece.cells.map(([, y]) => y)) + 1;
  return (
    <div
      className="pile-next-piece"
      style={{ width: columns * (size + 4), height: rows * size }}
    >
      {runs.map((run) => (
        <span
          key={`${run.x}-${run.y}`}
          className="pile-next-cell"
          style={{
            left: run.x * (size + 4),
            top: run.y * size,
            width: size,
            height: run.height * size - 2,
            backgroundColor: piece.course.style.bg,
            borderLeftColor: piece.course.style.border,
          }}
        />
      ))}
    </div>
  );
};

const CONTROLS = [
  { keys: ["←", "→"], label: "Changer de jour" },
  { keys: ["↑"], label: "Tourner" },
  { keys: ["↓"], label: "Descendre" },
  { keys: ["Espace"], label: "Poser" },
];

/**
 * Pile de cours — courses fall onto your week; fill a slot from Monday to
 * Friday to free it.
 */
const PileGame = ({ session, setHud, events, theme, currentDate }) => {
  const pool = useMemo(() => buildCoursePool(events, theme), [events, theme]);
  const stateRef = useRef(createPile({ pool }));
  const [, render] = useReducer((n) => n + 1, 0);
  const seenVersion = useRef(-1);
  const running = session.status === "running";
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    if (session.runId > 0) {
      stateRef.current = createPile({ pool });
      render();
    }
  }, [session.runId, pool]);

  const state = stateRef.current;

  useEffect(() => {
    setHud(`Niveau ${state.level} · ${freedSlots(state.lines)}`);
  });

  useGameLoop((dt) => {
    const current = stateRef.current;
    if (!running) return;
    update(current, dt);
    if (current.score !== session.score) session.setScore(current.score);
    if (current.over) {
      session.end(
        current.score,
        `${freedSlots(current.lines)} · niveau ${current.level}`,
      );
    }
    if (current.version !== seenVersion.current) {
      seenVersion.current = current.version;
      render();
    }
  });

  const act = (fn) => () => {
    fn(stateRef.current);
    render();
  };
  const actions = {
    left: act((s) => move(s, -1)),
    right: act((s) => move(s, 1)),
    rotate: act(rotate),
    down: act(softDrop),
    drop: act(hardDrop),
  };

  useGameKeys(
    {
      ArrowLeft: actions.left,
      ArrowRight: actions.right,
      ArrowUp: actions.rotate,
      x: actions.rotate,
      ArrowDown: actions.down,
      " ": actions.drop,
    },
    running,
  );

  const columns = (geometry) =>
    Array.from({ length: 7 }, (_, index) => ({
      key: index,
      date: addDays(monday, index),
      left: index * geometry.columnWidth,
      width: geometry.columnWidth,
    }));

  return (
    <>
      <WeekBoard columns={columns}>
        {(geometry) => {
          const piece = state.current;
          const offset = piece ? landingOffset(state) : 0;
          return (
            <>
              {state.cleared &&
                state.cleared.rows.map((row) => (
                  <span
                    key={`flash-${row}`}
                    className="pile-flash"
                    style={{
                      top: row * geometry.rowHeight,
                      height: geometry.rowHeight,
                      width: geometry.columnWidth * COLS,
                    }}
                  />
                ))}

              <Runs runs={placedRuns(state.grid)} geometry={geometry} showTime />

              {piece && !state.over && (
                <>
                  {offset > 0 && (
                    <Runs
                      runs={cellRuns(pieceCells(piece, 0, offset))}
                      geometry={geometry}
                      style={piece.course.style}
                      ghost
                    />
                  )}
                  <Runs
                    runs={cellRuns(pieceCells(piece))}
                    geometry={geometry}
                    style={piece.course.style}
                    title={piece.course.title}
                  />
                </>
              )}

              <aside
                className="pile-panel"
                style={{
                  left: geometry.columnWidth * COLS,
                  width: geometry.columnWidth * 2,
                }}
              >
                <span className="pile-panel-label">À suivre</span>
                {state.next && (
                  <>
                    <NextPiece
                      piece={state.next}
                      size={Math.min(geometry.columnWidth / 4, geometry.rowHeight)}
                    />
                    <span className="pile-panel-course">{state.next.course.title}</span>
                  </>
                )}
                <div className="pile-panel-stats">
                  <div>
                    <span>Niveau</span>
                    <strong>{state.level}</strong>
                  </div>
                  <div>
                    <span>Créneaux libérés</span>
                    <strong>{state.lines}</strong>
                  </div>
                </div>
              </aside>
            </>
          );
        }}
      </WeekBoard>
      <TouchControls
        buttons={[
          { id: "left", label: "←", onPress: actions.left },
          { id: "rotate", label: "↻", onPress: actions.rotate },
          { id: "down", label: "↓", onPress: actions.down },
          { id: "right", label: "→", onPress: actions.right },
          { id: "drop", label: "Poser", onPress: actions.drop, wide: true },
        ]}
      />
    </>
  );
};

PileGame.controls = CONTROLS;

export default PileGame;
