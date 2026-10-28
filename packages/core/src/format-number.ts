const UNITS = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
] as const;

/**
 * Shortens a count for tight spaces: 999 → "999", 1000 → "1K", 1500 → "1.5K",
 * 1000000 → "1M". Always K/M/B whatever the locale, so the label is the same
 * everywhere; at most one decimal, and none when it would be ".0".
 */
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  for (let i = 0; i < UNITS.length; i += 1) {
    const { value: unit, suffix } = UNITS[i];
    if (abs < unit) continue;
    // Rounding 999.95K up gives "1000K": hand it to the next unit instead.
    const rounded = Math.round((value / unit) * 10) / 10;
    if (Math.abs(rounded) >= 1000 && i > 0) {
      return formatCompactNumber(Math.sign(value) * UNITS[i - 1].value);
    }
    return `${rounded}${suffix}`;
  }
  return String(Math.round(value));
}
