import React from "react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useElementSize } from "../hooks/useElementSize";

/**
 * WeekBoard — the calendar's week grid, reused as a game board.
 * Same day headers, hour gutter, hairlines and weekend tint as the week view,
 * but sized to fit the window (no scrolling) between `startHour` and `endHour`.
 *
 * `columns(geometry)` returns the day columns to draw:
 *   [{ key, date, left, width }] — `left` in px, so games can scroll them.
 * `children(geometry)` renders the game layer on top of the grid.
 */
const WeekBoard = ({
  startHour = 8,
  endHour = 20,
  visibleDays = 7,
  showHourLabels = true,
  columns,
  children,
}) => {
  const [gridRef, size] = useElementSize();
  const hours = endHour - startHour;
  const geometry = {
    width: size.width,
    height: size.height,
    columnWidth: size.width / visibleDays,
    hourHeight: size.height / hours,
    rowHeight: size.height / (hours * 2),
    startHour,
    endHour,
    ready: size.width > 0 && size.height > 0,
  };
  const dayColumns = geometry.ready ? columns(geometry) : [];
  const today = new Date();

  return (
    <div className="game-board">
      <div className="game-board-corner" />

      <div className="game-board-days" aria-hidden="true">
        {dayColumns.map((column) => {
          const isToday = isSameDay(column.date, today);
          const weekend = [0, 6].includes(column.date.getDay());
          return (
            <div
              key={column.key}
              className={`day-header ${isToday ? "today" : ""} ${weekend ? "weekend" : ""}`}
              style={{ left: column.left, width: column.width }}
            >
              <span className="day-header-weekday">
                {format(column.date, "EEE", { locale: fr })}
              </span>
              <span className="day-header-date">{format(column.date, "d")}</span>
            </div>
          );
        })}
      </div>

      <div className="game-board-times" aria-hidden="true">
        {Array.from({ length: hours + 1 }, (_, index) => (
          <span
            key={index}
            className="time-label"
            style={{ top: index * geometry.hourHeight }}
          >
            {showHourLabels && index > 0 && index < hours ? `${startHour + index}:00` : ""}
          </span>
        ))}
      </div>

      <div className="game-board-grid" ref={gridRef}>
        {Array.from({ length: hours - 1 }, (_, index) => (
          <span
            key={index}
            className="game-board-hour"
            style={{ top: (index + 1) * geometry.hourHeight }}
          />
        ))}
        {dayColumns.map((column) => (
          <span
            key={column.key}
            className={`game-board-day ${[0, 6].includes(column.date.getDay()) ? "weekend" : ""}`}
            style={{ left: column.left, width: column.width }}
          />
        ))}
        {geometry.ready && children(geometry)}
      </div>
    </div>
  );
};

export default WeekBoard;
