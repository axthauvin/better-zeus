import React, { useEffect, useMemo, useReducer, useRef } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Coffee } from "lucide-react";
import WeekBoard from "../components/WeekBoard";
import BoardCard from "../components/BoardCard";
import TouchControls from "../components/TouchControls";
import { useGameLoop } from "../hooks/useGameLoop.js";
import { useGameKeys } from "../hooks/useGameKeys.js";
import { buildCoursePool, buildWeekdaySchedule } from "../schedule.js";
import { getEventStyle } from "../../utils/calendarHelpers.js";
import {
  DAY_W,
  PLAYER_X,
  PLAYER_SIZE,
  MEETING_CLEARANCE,
  createRunner,
  update,
  jump,
  clock,
  obstacleHeight,
} from "./engine.js";

const GROUND = 0.78; // the time line sits at 78% of the board height
const VISIBLE_DAYS = 5; // a work-week view: bigger cards than the 7-day grid

const formatMinutes = (minutes) =>
  `${Math.floor(minutes / 60)}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;

const CONTROLS = [
  { keys: ["Espace", "↑"], label: "Sauter" },
  { keys: ["×2"], label: "Double saut" },
];

/**
 * Survie au lundi — you are the red "now" line racing through your week.
 * Jump your real courses, duck under meetings, cross room changes.
 */
const RunnerGame = ({ session, setHud, events, theme, currentDate }) => {
  const schedule = useMemo(() => buildWeekdaySchedule(events, theme), [events, theme]);
  const pool = useMemo(() => buildCoursePool(events, theme).filter((c) => !c.exam), [events, theme]);
  const styles = useMemo(
    () => ({
      exam: getEventStyle({ color: "#FF3B30" }, theme),
      meeting: getEventStyle({ color: "#8E8E93" }, theme),
      fallback: getEventStyle({ color: "#007AFF" }, theme),
    }),
    [theme],
  );
  const stateRef = useRef(createRunner({ schedule, pool }));
  const [, render] = useReducer((n) => n + 1, 0);
  const running = session.status === "running";
  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    if (session.runId > 0) {
      stateRef.current = createRunner({ schedule, pool });
      render();
    }
  }, [session.runId, schedule, pool]);

  const state = stateRef.current;
  const { day, minutes } = clock(state);
  const date = addDays(monday, day);
  const hud = `${format(date, "EEEE d MMMM", { locale: fr })} · ${formatMinutes(minutes)}`;

  useEffect(() => {
    setHud(hud.charAt(0).toUpperCase() + hud.slice(1));
  }, [hud, setHud]);

  useGameLoop((dt) => {
    const current = stateRef.current;
    if (!running) return;
    update(current, dt);
    if (current.score !== session.score) session.setScore(current.score);
    if (current.over) {
      const position = clock(current);
      session.end(
        current.score,
        `Arrêté ${format(addDays(monday, position.day), "EEEE", { locale: fr })} à ${formatMinutes(position.minutes)} · ${current.collected} café${current.collected > 1 ? "s" : ""}`,
      );
    }
    render();
  });

  const onJump = () => jump(stateRef.current);
  useGameKeys({ " ": onJump, ArrowUp: onJump, z: onJump, w: onJump }, running);

  const columns = (geometry) => {
    const scale = geometry.columnWidth / DAY_W;
    const first = Math.floor(state.distance / DAY_W);
    return Array.from({ length: VISIBLE_DAYS + 2 }, (_, i) => {
      const index = first + i;
      return {
        key: index,
        date: addDays(monday, index),
        left: (index * DAY_W - state.distance) * scale,
        width: geometry.columnWidth,
      };
    });
  };

  return (
    <>
      <WeekBoard columns={columns} visibleDays={VISIBLE_DAYS} showHourLabels={false}>
        {(geometry) => {
          const scale = geometry.columnWidth / DAY_W;
          const groundY = geometry.height * GROUND;
          const toX = (x) => (x - state.distance) * scale;

          // Red time line, interrupted by room changes
          const gaps = state.obstacles
            .filter((o) => o.kind === "gap")
            .map((o) => [toX(o.x), toX(o.x + o.w)])
            .sort((a, b) => a[0] - b[0]);
          const segments = [];
          let cursor = 0;
          gaps.forEach(([start, end]) => {
            if (start > cursor) segments.push([cursor, start]);
            cursor = Math.max(cursor, end);
          });
          segments.push([cursor, geometry.width]);

          const player = state.player;
          const playerSize = PLAYER_SIZE * scale;

          return (
            <div className="runner-layer" onPointerDown={() => running && onJump()}>
              {segments.map(([start, end]) => (
                <span
                  key={`line-${start}`}
                  className="runner-line"
                  style={{ left: start, width: Math.max(0, end - start), top: groundY }}
                />
              ))}
              {gaps.map(([start, end]) => (
                <span
                  key={`gap-${start}`}
                  className="runner-gap-label"
                  style={{ left: start, width: end - start, top: groundY + 8 }}
                >
                  Changement de salle
                </span>
              ))}

              {state.obstacles.map((o) => {
                if (o.kind === "gap") return null;
                const left = toX(o.x);
                if (left > geometry.width || left + o.w * scale < 0) return null;
                if (o.kind === "meeting") {
                  const bottom = groundY - MEETING_CLEARANCE * scale;
                  return (
                    <BoardCard
                      key={`${o.kind}-${o.x}`}
                      className="runner-meeting"
                      left={left}
                      top={0}
                      width={o.w * scale}
                      height={bottom}
                      style={styles.meeting}
                      title={o.title}
                    />
                  );
                }
                const height = obstacleHeight(o, state.elapsed) * scale;
                return (
                  <React.Fragment key={`${o.kind}-${o.x}`}>
                    <BoardCard
                      className={o.kind === "exam" ? "runner-exam" : ""}
                      left={left}
                      top={groundY - height}
                      width={o.w * scale}
                      height={height}
                      style={o.kind === "exam" ? styles.exam : o.style || styles.fallback}
                      title=""
                    />
                    <span
                      className={`runner-tag ${o.kind === "exam" ? "exam" : ""}`}
                      style={{
                        left: left + (o.w * scale) / 2,
                        top: groundY - height - 17,
                        maxWidth: (o.w + 70) * scale - 10,
                        color: o.kind === "exam" ? undefined : (o.style || styles.fallback).text,
                      }}
                    >
                      {o.kind === "exam" ? "Partiel" : o.title}
                    </span>
                  </React.Fragment>
                );
              })}

              {state.coffees.map((coffee) => (
                <Coffee
                  key={`coffee-${coffee.x}`}
                  className="runner-coffee"
                  size={Math.max(14, 18 * scale)}
                  strokeWidth={2.2}
                  style={{
                    left: toX(coffee.x),
                    top: groundY - coffee.y * scale + Math.sin((state.elapsed + coffee.x * 7) / 260) * 3,
                  }}
                />
              ))}

              <span
                className={`runner-player ${player.onGround ? "" : "airborne"}`}
                style={{
                  left: PLAYER_X * scale,
                  top: groundY - player.y * scale - playerSize,
                  width: playerSize,
                  height: playerSize,
                }}
              >
              </span>

              <span className="runner-coffee-count">
                <Coffee size={14} strokeWidth={2.2} />
                {state.collected}
              </span>

              {state.banner && (
                <div className="runner-banner" style={{ opacity: Math.min(1, state.banner.time / 400) }}>
                  <strong>{state.banner.text}</strong>
                  <span>Ça accélère.</span>
                </div>
              )}
            </div>
          );
        }}
      </WeekBoard>
      <TouchControls buttons={[{ id: "jump", label: "Sauter", onPress: onJump, wide: true }]} />
    </>
  );
};

RunnerGame.controls = CONTROLS;

export default RunnerGame;
