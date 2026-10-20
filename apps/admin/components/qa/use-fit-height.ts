import { useLayoutEffect, useRef } from "react";

/** The `p-6` under the page content: the element ends here, so `main` ends at the viewport bottom. */
const PAGE_PADDING_BOTTOM = 24;

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
      const height =
        window.innerHeight - element.getBoundingClientRect().top - PAGE_PADDING_BOTTOM;
      element.style.setProperty("--fit-h", `${Math.max(height, 240)}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
    };
  });

  return ref;
}
