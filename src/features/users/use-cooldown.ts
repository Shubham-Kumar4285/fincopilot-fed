import { useEffect, useState } from "react";

/** Seconds left before an action (e.g. "Resend code") may run again. `start()` restarts the count. */
export function useCooldown(seconds: number) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => {
      setLeft((value) => value - 1);
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [left]);

  return { secondsLeft: left, start: () => { setLeft(seconds); } };
}
