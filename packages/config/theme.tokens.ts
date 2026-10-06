/**
 * The single source of truth for color values shared across web (theme.css)
 * and mobile (NativeWind preset).
 *
 * In accordance with docs/mobile.md §5.7 and docs/theme.md.
 */

export const brandScale = {
  50: "#e9fcf4",
  100: "#d0f7e8",
  200: "#adeed9",
  300: "#56dfcf",
  400: "#0abab5",
  500: "#009a9a",
  600: "#067b7f",
  700: "#006066",
  800: "#02464d",
  900: "#002e35",
  950: "#001a1f",
} as const;

export const neutralScale = {
  50: "#f6fbfc",
  100: "#eaf2f2",
  200: "#d8e2e2",
  300: "#bfcaca",
  400: "#95a1a2",
  500: "#768384",
  600: "#5a6868",
  700: "#435050",
  800: "#2c3839",
  900: "#172323",
  950: "#0a1414",
} as const;

export const blushScale = {
  100: "#ffedf3",
  600: "#7f3b58",
  900: "#562f3f",
} as const;

export const semanticLight = {
  background: neutralScale[50],
  foreground: brandScale[900],
  surface: "#ffffff",
  "surface-foreground": brandScale[900],
  muted: neutralScale[100],
  "muted-foreground": neutralScale[600],
  highlight: blushScale[100],
  "highlight-foreground": blushScale[600],
  border: neutralScale[200],
  primary: brandScale[600],
  "primary-hover": brandScale[700],
  "primary-foreground": "#ffffff",
  accent: brandScale[700],
  ring: brandScale[400],
  danger: "#b42318",
  success: "#15703a",
  warning: "#a03f07",
} as const;

export const semanticDark = {
  background: brandScale[900],
  foreground: neutralScale[50],
  surface: brandScale[800],
  "surface-foreground": neutralScale[50],
  muted: brandScale[800],
  "muted-foreground": neutralScale[400],
  highlight: blushScale[900],
  "highlight-foreground": blushScale[100],
  border: brandScale[700],
  primary: brandScale[400],
  "primary-hover": brandScale[300],
  "primary-foreground": brandScale[950],
  accent: brandScale[300],
  ring: brandScale[400],
  danger: "#f97066",
  success: "#4ade80",
  warning: "#f79009",
} as const;
