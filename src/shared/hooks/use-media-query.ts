import { useCallback, useSyncExternalStore } from "react";

const supported = () => typeof window.matchMedia === "function";

/** Live result of a CSS media query; `fallback` where matchMedia is unavailable (jsdom). */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!supported()) return () => undefined;
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => {
        media.removeEventListener("change", onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => (supported() ? window.matchMedia(query).matches : fallback));
}
