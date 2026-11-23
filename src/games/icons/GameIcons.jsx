import React from "react";

/*
 * App-style icons for the games: one solid system colour per tile,
 * white glyphs, depth only through flat opacity steps — no gradients.
 */

const Tile = ({ color, className = "", children, label }) => (
  <svg
    className={`game-icon ${className}`}
    viewBox="0 0 64 64"
    role="img"
    aria-label={label}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="64" height="64" rx="15" fill={color} />
    {children}
  </svg>
);

/** Pile de cours: courses stacking in day columns, one still falling. */
export const PileIcon = ({ className }) => (
  <Tile color="#007AFF" className={className} label="Pile de cours">
    <g fill="#ffffff">
      <rect x="11" y="38" width="7.5" height="15" rx="2" opacity="0.6" />
      <rect x="20.5" y="31" width="7.5" height="22" rx="2" opacity="0.85" />
      <rect x="30" y="42" width="7.5" height="11" rx="2" opacity="0.6" />
      <rect x="39.5" y="35" width="7.5" height="18" rx="2" opacity="0.85" />
      <rect x="49" y="40" width="4.5" height="13" rx="2" opacity="0.6" />
      <rect x="30" y="11" width="7.5" height="17" rx="2" />
    </g>
    <path d="M33.75 30.5v4.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.8" />
  </Tile>
);

/** Survie au lundi: jumping over a course on the day's timeline. */
export const LundiIcon = ({ className }) => (
  <Tile color="#FF9500" className={className} label="Survie au lundi">
    <g stroke="#ffffff" strokeLinecap="round" opacity="0.45" strokeWidth="1.4">
      <path d="M16 12v34M32 12v34M48 12v34" />
    </g>
    <path d="M8 48.5h48" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="35" y="35" width="14" height="13.5" rx="2.5" fill="#ffffff" opacity="0.7" />
    <g transform="rotate(-14 21 26)">
      <rect x="14" y="19" width="14" height="14" rx="4" fill="#ffffff" />
      <circle cx="23" cy="24.5" r="1.4" fill="#FF9500" />
      <circle cx="26.3" cy="24.5" r="1.4" fill="#FF9500" />
    </g>
    <path d="M9 34h3.5M7 29h3.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
  </Tile>
);
