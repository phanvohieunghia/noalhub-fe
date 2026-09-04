import { useEffect, useState } from "react";

/**
 * Reads the CSS custom properties actually in effect on `<html>`.
 *
 * The swatches are NOT allowed to hardcode the hex values from `theme.css` —
 * two copies of a palette drift apart, and a documentation page that lies about
 * the colors is worse than no page. Reading them live also means the grid
 * re-paints when the theme toolbar flips the `dark` class, which is precisely
 * what makes the light/dark pair reviewable.
 */
export function useTokens(names: readonly string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      setValues(
        Object.fromEntries(
          names.map((name) => [name, style.getPropertyValue(name).trim()]),
        ),
      );
    };

    read();

    // `withThemeByClassName` toggles the class on `<html>`; there is no event
    // for that, so watch the attribute itself.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
    // `names` is a module-level constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return values;
}
