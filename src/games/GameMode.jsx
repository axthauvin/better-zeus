import React, { useEffect, useState } from "react";
import { GAMES } from "./registry.js";
import { useGameSession } from "./hooks/useGameSession.js";
import GameToolbar from "./components/GameToolbar";
import GameOverlay from "./components/GameOverlay";
import "./Games.css";

const LAST_GAME_KEY = "better-zeus-games-last";

const readLastGame = () => {
  try {
    const id = localStorage.getItem(LAST_GAME_KEY);
    return GAMES.some((game) => game.id === id) ? id : GAMES[0].id;
  } catch {
    return GAMES[0].id;
  }
};

/** One game run: its session, toolbar, board and overlay. */
const GameRun = ({ game, onSwitch, onExit, events, theme, onToggleTheme, currentDate }) => {
  const session = useGameSession(game.id);
  const [hud, setHud] = useState("");
  const { status, start, resume, togglePause } = session;
  const GameComponent = game.Component;

  // Space / Enter start or resume, P pauses, Escape leaves
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (event.key === "Escape") {
        event.preventDefault();
        onExit();
        return;
      }
      if (key === "p" && (status === "running" || status === "paused")) {
        event.preventDefault();
        togglePause();
        return;
      }
      if (status === "running") return;
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (status === "paused") resume();
      else start();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, start, resume, togglePause, onExit]);

  return (
    <>
      <GameToolbar
        games={GAMES}
        game={game}
        onSwitch={onSwitch}
        session={session}
        hud={hud}
        onExit={onExit}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className={`game-stage status-${status}`}>
        <GameComponent
          game={game}
          session={session}
          setHud={setHud}
          events={events}
          theme={theme}
          currentDate={currentDate}
        />
        <GameOverlay game={game} session={session} controls={game.controls} />
      </div>
    </>
  );
};

/**
 * GameMode — turns the calendar window into a game: the toolbar becomes the
 * game toolbar and the week grid becomes the board.
 */
const GameMode = ({ onExit, events = [], theme = "light", onToggleTheme, currentDate }) => {
  const [activeId, setActiveId] = useState(readLastGame);
  const game = GAMES.find((item) => item.id === activeId) || GAMES[0];

  const switchGame = (id) => {
    setActiveId(id);
    try {
      localStorage.setItem(LAST_GAME_KEY, id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="calendar-view game-mode">
      <GameRun
        key={game.id}
        game={game}
        onSwitch={switchGame}
        onExit={onExit}
        events={events}
        theme={theme}
        onToggleTheme={onToggleTheme}
        currentDate={currentDate || new Date()}
      />
    </div>
  );
};

export default GameMode;
