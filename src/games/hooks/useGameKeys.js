import { useEffect, useRef } from "react";

/**
 * Binds keyboard handlers ({ ArrowLeft: fn, " ": fn, … }) while `enabled`.
 * Handled keys don't scroll the page.
 */
export function useGameKeys(handlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!enabledRef.current) return;
      const handler =
        handlersRef.current[event.key] ||
        handlersRef.current[event.key.toLowerCase()];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
