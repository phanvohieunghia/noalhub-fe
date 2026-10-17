import { useLayoutEffect, useRef } from "react";

/**
 * Sizes an element to end at the bottom of the viewport, whatever sits above it:
 * sets `--fit-h` on it, to be read as `max-h-[var(--fit-h,70vh)]`. The page then
 * stays still and only the element scrolls.
 */
export function useFitHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const element = ref.current;
      if (!element) return;
      const height = window.innerHeight - element.getBoundingClientRect().top - 56;
      element.style.setProperty("--fit-h", `${Math.max(height, 240)}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", fit, true);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", fit, true);
    };
  });

  return ref;
}
