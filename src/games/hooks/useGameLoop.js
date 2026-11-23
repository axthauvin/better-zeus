import { useEffect, useRef } from "react";

/**
 * Runs `callback(dt)` on every animation frame while mounted.
 * dt is in milliseconds and capped so a background tab doesn't
 * produce one giant step when it comes back.
 */
export function useGameLoop(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let frame;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      callbackRef.current(dt);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
}
