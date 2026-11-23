import React from "react";
import "../../components/EventCard.css";

/**
 * A course card on the game board — same markup and styles as the
 * calendar's EventCard, positioned in board pixels.
 */
const BoardCard = ({ left, top, width, height, style, title, time, ghost = false, className = "" }) => {
  const compact = height < 34;
  return (
    <div
      className={`event-card game-card ${compact ? "small" : ""} ${ghost ? "ghost" : ""} ${className}`}
      style={{
        left,
        top,
        width,
        height,
        backgroundColor: ghost ? "transparent" : style.bg,
        borderLeftColor: style.border,
        ...(ghost ? { borderColor: style.border } : {}),
        color: style.text,
      }}
    >
      {!ghost && (title || time) && (
        <div className="event-card-content">
          {title && <div className="event-card-title">{title}</div>}
          {time && !compact && <div className="event-card-time">{time}</div>}
        </div>
      )}
    </div>
  );
};

export default BoardCard;
