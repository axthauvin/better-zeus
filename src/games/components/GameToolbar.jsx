import React from "react";
import { ChevronLeft, Pause, Play, Sun, Moon, X } from "lucide-react";

const formatScore = (value) => Number(value || 0).toLocaleString("fr-FR");

/**
 * The calendar toolbar, in game mode: same grid and controls as the
 * calendar's, with the game switcher in place of Jour/Semaine/Mois.
 */
const GameToolbar = ({
  games,
  game,
  onSwitch,
  session,
  hud,
  onExit,
  theme,
  onToggleTheme,
}) => {
  const { status, score, best, togglePause } = session;
  const canPause = status === "running" || status === "paused";

  return (
    <header className="calendar-toolbar game-toolbar">
      <div className="toolbar-leading">
        <button
          type="button"
          className="bz-icon-button"
          onClick={onExit}
          aria-label="Revenir au calendrier"
          title="Revenir au calendrier (Échap)"
        >
          <ChevronLeft size={19} strokeWidth={1.9} />
        </button>
        <div className="toolbar-title">
          <h1 className="toolbar-heading">
            <strong>{game.title}</strong>
          </h1>
          <div className="toolbar-subtitle">
            <span>{hud || game.tagline}</span>
          </div>
        </div>
      </div>

      <div className="toolbar-views">
        <div className="bz-segmented game-switcher" role="tablist" aria-label="Jeux">
          {games.map((item) => {
            const { Icon } = item;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={item.id === game.id}
                className={`bz-segmented-item ${item.id === game.id ? "active" : ""}`}
                onClick={() => item.id !== game.id && onSwitch(item.id)}
              >
                <Icon className="game-switcher-icon" />
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="toolbar-search" />

      <div className="toolbar-nav game-scores">
        <div className="game-score">
          <span>Score</span>
          <strong>{formatScore(score)}</strong>
        </div>
        <div className="game-score">
          <span>Record</span>
          <strong>{formatScore(best)}</strong>
        </div>
      </div>

      <div className="toolbar-actions">
        <button
          type="button"
          className="bz-icon-button"
          onClick={togglePause}
          disabled={!canPause}
          aria-label={status === "paused" ? "Reprendre" : "Pause"}
          title={status === "paused" ? "Reprendre (P)" : "Pause (P)"}
        >
          {status === "paused" ? (
            <Play size={17} strokeWidth={1.9} />
          ) : (
            <Pause size={17} strokeWidth={1.9} />
          )}
        </button>
        <button
          type="button"
          className="bz-icon-button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Apparence claire" : "Apparence sombre"}
          title={theme === "dark" ? "Apparence claire" : "Apparence sombre"}
        >
          {theme === "dark" ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
        </button>
        <button
          type="button"
          className="bz-icon-button"
          onClick={onExit}
          aria-label="Quitter les jeux"
          title="Quitter les jeux (Échap)"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
};

export default GameToolbar;
