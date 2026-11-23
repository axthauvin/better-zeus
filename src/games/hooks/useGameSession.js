import { useCallback, useEffect, useState } from "react";

const bestKey = (gameId) => `better-zeus-games-best-${gameId}`;

export const readBestScore = (gameId) => {
  try {
    return Number(localStorage.getItem(bestKey(gameId))) || 0;
  } catch {
    return 0;
  }
};

/**
 * Lifecycle shared by every game: ready → running ⇄ paused → over,
 * live score, persisted best score and a `runId` that bumps on each new run.
 */
export function useGameSession(gameId) {
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readBestScore(gameId));
  const [isNewBest, setIsNewBest] = useState(false);
  const [summary, setSummary] = useState("");
  const [runId, setRunId] = useState(0);

  const start = useCallback(() => {
    setScore(0);
    setSummary("");
    setIsNewBest(false);
    setRunId((id) => id + 1);
    setStatus("running");
  }, []);

  const pause = useCallback(
    () => setStatus((s) => (s === "running" ? "paused" : s)),
    [],
  );
  const resume = useCallback(
    () => setStatus((s) => (s === "paused" ? "running" : s)),
    [],
  );
  const togglePause = useCallback(
    () =>
      setStatus((s) =>
        s === "running" ? "paused" : s === "paused" ? "running" : s,
      ),
    [],
  );

  const end = useCallback(
    (finalScore, finalSummary = "") => {
      setScore(finalScore);
      setSummary(finalSummary);
      setStatus("over");
      setBest((previous) => {
        if (finalScore > previous) {
          try {
            localStorage.setItem(bestKey(gameId), String(finalScore));
          } catch {
            // storage unavailable: keep the record for this session only
          }
          setIsNewBest(true);
          return finalScore;
        }
        return previous;
      });
    },
    [gameId],
  );

  // Never keep running in a hidden tab
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  return {
    status,
    score,
    setScore,
    best,
    isNewBest,
    summary,
    runId,
    start,
    pause,
    resume,
    togglePause,
    end,
  };
}
