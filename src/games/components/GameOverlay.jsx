import React, { useEffect, useRef } from "react";
import { Play, RotateCcw } from "lucide-react";

const formatScore = (value) => Number(value || 0).toLocaleString("fr-FR");

/**
 * Start / pause / game-over card, floating over the board.
 */
const GameOverlay = ({ game, session, controls }) => {
  const { status, score, isNewBest, summary, start, resume } = session;
  const primaryRef = useRef(null);
  const { Icon } = game;

  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [status]);

  if (status === "running") return null;

  return (
    <div className="game-overlay">
      <div className="game-overlay-card bz-popover">
        {status === "ready" && (
          <>
            <Icon className="game-overlay-icon" />
            <h4>{game.title}</h4>
            <p>{game.description}</p>
            <div className="game-keys">
              {controls.map(({ keys, label }) => (
                <span key={label}>
                  {keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                  {label}
                </span>
              ))}
            </div>
            <button
              ref={primaryRef}
              type="button"
              className="bz-button bz-button-primary game-overlay-action"
              onClick={start}
            >
              <Play size={14} strokeWidth={2.25} />
              Jouer
            </button>
            <span className="game-overlay-hint">ou appuie sur Espace</span>
          </>
        )}

        {status === "paused" && (
          <>
            <h4>Pause</h4>
            <p>Ton emploi du temps t'attend.</p>
            <button
              ref={primaryRef}
              type="button"
              className="bz-button bz-button-primary game-overlay-action"
              onClick={resume}
            >
              <Play size={14} strokeWidth={2.25} />
              Reprendre
            </button>
          </>
        )}

        {status === "over" && (
          <>
            <span className={`game-overlay-badge ${isNewBest ? "best" : ""}`}>
              {isNewBest ? "Nouveau record" : "Partie terminée"}
            </span>
            <strong className="game-overlay-score">{formatScore(score)}</strong>
            {summary && <p>{summary}</p>}
            <button
              ref={primaryRef}
              type="button"
              className="bz-button bz-button-primary game-overlay-action"
              onClick={start}
            >
              <RotateCcw size={14} strokeWidth={2.25} />
              Rejouer
            </button>
            <span className="game-overlay-hint">Espace pour rejouer · Échap pour revenir</span>
          </>
        )}
      </div>
    </div>
  );
};

export default GameOverlay;
