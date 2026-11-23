import React from "react";

/**
 * On-screen buttons for touch devices (hidden when a mouse is available).
 * Buttons react on pointer down so repeated taps feel immediate.
 */
const TouchControls = ({ buttons }) => (
  <div className="game-touch" aria-hidden="true">
    {buttons.map(({ id, label, onPress, wide }) => (
      <button
        key={id}
        type="button"
        tabIndex={-1}
        className={`game-touch-button ${wide ? "wide" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          onPress();
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

export default TouchControls;
